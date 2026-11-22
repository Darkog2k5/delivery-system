# Kiến Trúc Hướng Dịch Vụ & Thiết Kế Miền (`ARCHITECTURE_SOA.md`)

Tài liệu này trình bày kiến trúc Microservices của đồ án **Hệ thống Quản lý Vận đơn và Điều phối Giao hàng (`SPX-CLONE-2026`)**, đáp ứng đầy đủ các chuẩn đầu ra môn *Phát triển phần mềm hướng dịch vụ (INT1448)*.

---

## 1. Sơ đồ Kiến trúc Tổng thể (3-Domain Polyglot Microservices)

```mermaid
flowchart LR
    Web["Web Portal :3000<br/>(React + TypeScript + Tailwind)"] --> GW["API Gateway :8080<br/>(Spring Cloud Gateway + JWT RBAC)"]
    Android["Android Native App<br/>(Kotlin + Jetpack Compose)"] --> GW

    GW -->|"Auth / Users"| UserSvc["Domain 1: user-service :8081<br/>(Java 17 Spring Boot)"]
    GW -->|"Orders / Fee / Label"| OrderSvc["Domain 1: order-service :8082<br/>(Java 17 Spring Boot)"]
    GW -->|"Dispatch / Shipper Ops"| DispatchSvc["Domain 2: dispatch-service :8083<br/>(TypeScript NestJS)"]
    GW -->|"Public Tracking / Notify"| TrackSvc["Domain 3: tracking-service :8084<br/>(C# .NET 9 Web API)"]

    UserSvc --> UserDB[("PostgreSQL 16<br/>user_db")]
    OrderSvc --> OrderDB[("PostgreSQL 16<br/>order_db")]
    DispatchSvc --> DispatchDB[("MySQL 8.0<br/>dispatch_db")]
    TrackSvc --> TrackDB[("MongoDB 7.0<br/>tracking_db - CQRS")]

    OrderSvc <-->|"order.created / sync"| MQ["RabbitMQ :5672 / :15672<br/>spx.events.exchange"]
    DispatchSvc <-->|"dispatch.status.updated"| MQ
    MQ -->|"order.#, dispatch.#"| TrackSvc
```

---

## 2. Phân rã Ranh giới Miền (DDD Bounded Contexts)

| Bounded Context | Chủ sở hữu | Dịch vụ & Cổng | Dữ liệu độc lập (Database-per-Service) | Trách nhiệm cốt lõi |
| :--- | :--- | :--- | :--- | :--- |
| **Gateway & RBAC** | Trần Nguyên An | `api-gateway` (`:8080`) | Không dùng DB | Định tuyến tập trung, CORS, xác thực chữ ký JWT, chặn phân quyền 3 vai trò (`ROLE_CUSTOMER`, `ROLE_SHIPPER`, `ROLE_ADMIN`), truyền `X-User-*` đã chuẩn hóa xuống downstream. |
| **Miền 1: Core Auth & Order** | Trần Nguyên An | `user-service` (`:8081`), `order-service` (`:8082`) | PostgreSQL (`user_db`, `order_db`) — ACID | Đăng ký/đăng nhập BCrypt, cấp JWT, tạo vận đơn `SPX...`, tính cước Haversine & khối lượng quy đổi thể tích (`UC08`), sinh dữ liệu tem nhiệt A6 (`UC09`). |
| **Miền 2: Dispatch & Operations** | Đỗ Cao Cường | `dispatch-service` (`:8083`) | MySQL 8.0 (`dispatch_db`) | Quản lý bưu cục Hub, trạng thái Online/Offline của tài xế (`UC16`), Master Dashboard (`UC26`), gán đơn, kiểm tra quét Barcode (`UC18`), giao thành công/thất bại (`UC20`, `UC21`), bảo vệ vòng đời 7 trạng thái. |
| **Miền 3: Tracking & Notification** | Phạm Tuấn Kiệt | `tracking-service` (`:8084`) | MongoDB 7.0 (`tracking_db`) | Lắng nghe sự kiện bất đồng bộ, cập nhật CQRS Read Model (`tracking_read_models`) + Event Store (`tracking_events`), phục vụ tra cứu công khai `UC11` tốc độ cao không cần đăng nhập và lưu thông báo `UC15`. |

---

## 3. Vòng Đời 7 Trạng Thái Vận Đơn (State Machine Diagram)

```mermaid
stateDiagram-v2
    [*] --> CREATED : UC06 Shop tạo đơn
    CREATED --> WAITING_FOR_PICKUP : UC26 Admin gán Shipper
    WAITING_FOR_PICKUP --> PICKED_UP : UC18 Shipper quét Barcode lấy hàng
    PICKED_UP --> IN_TRANSIT : Luân chuyển qua trạm Hub
    IN_TRANSIT --> OUT_FOR_DELIVERY : Shipper bắt đầu đi giao
    OUT_FOR_DELIVERY --> DELIVERED : UC20 Giao thành công + COD
    OUT_FOR_DELIVERY --> FAILED : UC21 Giao thất bại (tối đa 3 lần)
    FAILED --> WAITING_FOR_PICKUP : Điều phối lấy/giao lại (attempts < 3)
    FAILED --> OUT_FOR_DELIVERY : Shipper giao lại (attempts < 3)
    DELIVERED --> [*]
```

- Cả **Miền 1 (`WaybillStateMachine.java`)** và **Miền 2 (`waybill-state-machine.ts`)** đều thực thi kiểm tra chuyển trạng thái nghiêm ngặt, từ chối mọi thao tác nhảy cóc (ví dụ `CREATED -> DELIVERED` tại `TC-12`) với mã HTTP `400 Bad Request` (`ERR_INVALID_STATE_TRANSITION`).

---

## 4. Biểu đồ Tuần tự (Sequence Diagrams) — Choreography SAGA & CQRS

### 4.1. Luồng Tạo vận đơn (`UC06`) & Đồng bộ liên miền qua RabbitMQ
```mermaid
sequenceDiagram
    actor Shop
    participant Web as Web Portal (:3000)
    participant GW as API Gateway (:8080)
    participant Order as Order Service (:8082)
    participant MQ as RabbitMQ (spx.events.exchange)
    participant Dispatch as Dispatch Service (:8083)
    participant Track as Tracking Service (:8084)

    Shop->>Web: Nhập kiện hàng, nơi gửi/nhận
    Web->>GW: POST /api/orders/calculate-fee
    GW->>Order: Forward request
    Order-->>Web: 200 OK (distanceKm, shippingFee)
    Shop->>Web: Bấm Tạo vận đơn
    Web->>GW: POST /api/orders (Bearer JWT)
    GW->>GW: Verify JWT & Inject X-User-*
    GW->>Order: POST /api/orders
    Order->>Order: Lưu OrderDB (status=CREATED)
    Order->>MQ: Publish event "order.created"
    Order-->>Web: 201 Created (trackingCode=SPX...)
    MQ-->>Dispatch: Consume -> Tạo bản ghi DispatchDB
    MQ-->>Track: Consume -> Tạo CQRS Read Model & Timeline
```

### 4.2. Luồng Điều phối (`UC26`) -> Shipper Tác nghiệp (`UC16–UC21`) -> Tra cứu Công khai (`UC11`)
```mermaid
sequenceDiagram
    actor Admin
    actor Shipper
    actor Receiver
    participant GW as API Gateway (:8080)
    participant Dispatch as Dispatch Service (:8083)
    participant MQ as RabbitMQ
    participant Order as Order Service (:8082)
    participant Track as Tracking Service (:8084)

    Admin->>GW: POST /api/dispatch/assign (Bearer ADMIN)
    GW->>Dispatch: Forward (RBAC = ROLE_ADMIN)
    Dispatch->>Dispatch: CREATED -> WAITING_FOR_PICKUP
    Dispatch->>MQ: Publish "dispatch.status.updated"
    MQ-->>Order: Sync OrderDB status & assignedShipperCode
    MQ-->>Track: Append timeline & update CQRS Read Model
    Shipper->>GW: POST /api/dispatch/orders/{code}/pickup (Barcode)
    GW->>Dispatch: WAITING_FOR_PICKUP -> PICKED_UP
    Dispatch->>MQ: Publish "dispatch.status.updated"
    MQ-->>Track: Update CQRS Read Model (PICKED_UP)
    Receiver->>GW: GET /api/tracking/{code} (Public - No Token)
    GW->>Track: Query tracking_read_models (MongoDB)
    Track-->>Receiver: 200 OK + Timeline đầy đủ
```

---

## 5. Mô hình Triển khai Sẵn sàng & Dự phòng Môi trường
1. **Docker Mode (`docker-compose.yml`):** Chạy trọn vẹn PostgreSQL x2, MySQL 8, MongoDB 7, RabbitMQ Management, 5 Backend Services và Web Portal Nginx trên mạng `spx-network` với giới hạn RAM tối ưu cho máy cá nhân (`mem_limit` từ 128MB–384MB).
2. **Local Standalone Mode (`scripts/start-local.ps1`):** Khi máy trạm chưa bật Docker Desktop, các dịch vụ tự động chuyển sang cấu hình lưu trữ cục bộ độc lập (H2 PostgreSQL-mode cho Miền 1, SQLite `sql.js` cho Miền 2, File JSON CQRS Store cho Miền 3) và đồng bộ sự kiện bất đồng bộ qua endpoint nội bộ `/internal/events`.
