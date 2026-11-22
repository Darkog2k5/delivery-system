# Hệ Thống Quản Lý Vận Đơn & Điều Phối Giao Hàng (`SPX-CLONE-2026`)

Dự án đồ án tích hợp dùng chung cho 2 học phần tại Học viện Công nghệ Bưu chính Viễn thông (PTIT - Nhóm 24):
1. **Phát triển phần mềm hướng dịch vụ (SOA / Microservices - INT1448)**
2. **Quản lý dự án phần mềm (QLDA)**

---

## 1. Kiến trúc Polyglot Microservices & Polyglot Persistence

Hệ thống áp dụng triệt để nguyên lý **3-Domain Modular Microservices**, **Database-per-Service** (0% truy vấn chéo DB), **API Gateway tập trung**, **Choreography SAGA + RabbitMQ**, và **CQRS**:

| Thành phần | Miền / Phụ trách | Công nghệ lựa chọn | CSDL riêng (Polyglot) | Cổng mạng |
| :--- | :--- | :--- | :--- | :---: |
| **API Gateway** | Cửa ngõ duy nhất & RBAC JWT (`Trần Nguyên An`) | Java 17 · Spring Cloud Gateway | Stateless (JWT) | `:8080` |
| **User Service** | Miền 1: Tài khoản & Phân quyền (`Trần Nguyên An`) | Java 17 · Spring Boot 3.2 · Spring Security | PostgreSQL 16 (`user_db`) | `:8081` |
| **Order Service** | Miền 1: Vận đơn, Tính cước Haversine, Tem A6 (`Trần Nguyên An`) | Java 17 · Spring Boot 3.2 · Spring AMQP | PostgreSQL 16 (`order_db`) | `:8082` |
| **Dispatch Service** | Miền 2: Điều phối, Hub, Shipper (`Đỗ Cao Cường`) | TypeScript · NestJS 10 · TypeORM | MySQL 8.0 (`dispatch_db`) | `:8083` |
| **Tracking Service** | Miền 3: Hành trình CQRS & Thông báo (`Phạm Tuấn Kiệt`) | C# · .NET 9 ASP.NET Core Web API | MongoDB 7.0 (`tracking_db`) | `:8084` |
| **Message Broker** | Hàng đợi sự kiện bất đồng bộ (`spx.events.exchange`) | RabbitMQ 3.13 Management | Persistent Queues | `:5672` / `:15672` |
| **Web Portal** | Client 1: Shop, Admin Dashboard, Public Track (`Đỗ Cao Cường`) | React 18 · TypeScript · Tailwind · Vite | Browser `localStorage` | `:3000` |
| **Android App** | Client 2: Tài xế Shipper & Tra cứu công khai (`Phạm Tuấn Kiệt`) | Kotlin Native · Jetpack Compose · Retrofit2 | Android `SharedPreferences` | Mobile |

---

## 2. Cấu trúc Thư mục Monorepo

```text
delivery-system/
├── docker-compose.yml                  # Mạng spx-network, 4 DB riêng, RabbitMQ, 5 Services, Web Portal
├── .env.example                        # Biến môi trường chuẩn
├── database/seed/                      # Script tham chiếu dữ liệu mẫu 4 CSDL
├── services/
│   ├── api-gateway/                    # Spring Cloud Gateway (:8080)
│   ├── domain1-auth-order/
│   │   ├── user-service/               # Spring Boot + PostgreSQL/H2 (:8081)
│   │   └── order-service/              # Spring Boot + PostgreSQL/H2 (:8082)
│   ├── domain2-dispatch/
│   │   └── dispatch-service/           # NestJS + MySQL/sql.js + Swagger (:8083)
│   └── domain3-tracking/
│       └── tracking-service/           # .NET 9 + MongoDB/File CQRS + Swagger (:8084)
├── clients/
│   ├── web-portal/                     # React + Vite + Tailwind + Barcode/QR A6 (:3000)
│   └── android-app/                    # Kotlin Native + Jetpack Compose + ML Kit Barcode
├── postman/                            # Postman Collection & Environment (12 Test Cases)
├── scripts/                            # start-local.ps1, stop-local.ps1, e2e-test.mjs
└── docs/                               # ARCHITECTURE_SOA.md, API_CONTRACT.md, DEMO_AND_TEST_REPORT.md
```

---

## 3. Tài khoản & Dữ liệu Mẫu Chuẩn (Seed Data)

Mật khẩu chung cho toàn bộ 9 tài khoản mẫu là **`123456`** (hỗ trợ đăng nhập bằng SĐT hoặc Mã tài khoản):

| Vai trò | Mã tài khoản | SĐT | Họ tên / Shop | Hub |
| :--- | :--- | :--- | :--- | :---: |
| `ROLE_ADMIN` | `ADMIN_01` | `0900000001` | Nguyễn Quản Trị | `HUB-Q1` |
| `ROLE_SHIPPER` | `SHIPPER_01` | `0911000001` | Nguyễn Văn Tài | `HUB-Q1` |
| `ROLE_SHIPPER` | `SHIPPER_02` | `0911000002` | Trần Minh Tuấn | `HUB-TD` |
| `ROLE_SHIPPER` | `SHIPPER_03` | `0911000003` | Lê Hoàng Nam | `HUB-TB` |
| `ROLE_CUSTOMER` | `SHOP_01` .. `SHOP_05` | `0988000001` .. `0988000005` | 5 Shop bán hàng mẫu | — |

- Mã vận đơn tra cứu công khai nổi bật (`TC-06`): **`SPX20260501089`** (và 9 đơn mẫu đủ 7 trạng thái `CREATED`, `WAITING_FOR_PICKUP`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`).

---

## 4. Hướng dẫn Khởi chạy & Kiểm thử

### Cách 1: Chạy toàn bộ hệ thống bằng Docker Compose (Khuyến nghị khi Demo đầy đủ PostgreSQL + MySQL + MongoDB + RabbitMQ)
```bash
docker compose up --build -d
```
- Web Portal: `http://localhost:3000`
- API Gateway: `http://localhost:8080`
- RabbitMQ Management UI: `http://localhost:15672` (`spx_user` / `spx_pass_2026`)

### Cách 2: Chạy trực tiếp trên máy cục bộ Windows không cần Docker (`local` profile)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1 -ResetData
node .\scripts\e2e-test.mjs
powershell -ExecutionPolicy Bypass -File .\scripts\stop-local.ps1
```

### Cách 3: Mở Android Native App (Kotlin)
1. Mở **Android Studio** -> chọn **Open** thư mục `clients/android-app`.
2. Mặc định ứng dụng kết nối vào `http://10.0.2.2:8080/` (Emulator trỏ về `localhost:8080` trên máy host), hoặc đổi IP LAN ngay tại màn hình Đăng nhập.

---

## 5. Tài liệu Chi tiết
- Báo cáo bàn giao & Hướng dẫn ngữ cảnh cho AI Agent: [AGENTS.md](./AGENTS.md)
- Kiến trúc SOA, DDD, SAGA & CQRS: [ARCHITECTURE_SOA.md](./docs/ARCHITECTURE_SOA.md)
- Đặc tả API Contract & RBAC: [API_CONTRACT.md](./docs/API_CONTRACT.md)
- Kịch bản Demo & Kết quả Kiểm thử 12 Test Cases: [DEMO_AND_TEST_REPORT.md](./docs/DEMO_AND_TEST_REPORT.md)
