# Kịch Bản Demo Bảo Vệ & Báo Cáo Kết Quả Kiểm Thử (`DEMO_AND_TEST_REPORT.md`)

Tài liệu này phục vụ buổi bảo vệ đồ án môn **Phát triển phần mềm hướng dịch vụ** và **Quản lý dự án phần mềm**, bám sát 12 Kịch bản Kiểm thử Thiết kế Trước (Phụ lục C — Bảng C.1) và các chỉ số SLA (Chương 6 — Bảng 6.2).

---

## 1. Kịch bản Trình diễn Demo 4 Tác nhân Trên 2 Nền tảng (Rehearsal Script)

### Giai đoạn Chuẩn bị (1 phút)
1. Khởi chạy hệ thống bằng Docker (`docker compose up --build -d`) hoặc Local mode (`./scripts/start-local.ps1 -ResetData`).
2. Mở trình duyệt Web Portal tại `http://localhost:3000` và ứng dụng Android Studio Emulator (`clients/android-app`, kết nối tới `http://10.0.2.2:8080/`).

### Màn 1: Người nhận hàng Tra cứu Công khai (`UC11` — Web & Android)
- Không cần đăng nhập. Nhập mã mẫu **`SPX20260501089`** -> Hệ thống truy vấn CQRS Read Model từ **Tracking Service (`:8084` - .NET 9 / MongoDB)** trả về `200 OK` cùng hành trình 4 mốc thời gian.
- Nhập mã không tồn tại **`SPX999`** -> Trả về `404 Not Found` và thông báo rõ ràng.

### Màn 2: Chủ Shop Tạo Vận Đơn & In Tem A6 (`UC06`, `UC08`, `UC09` — Web Portal)
- Đăng nhập tài khoản **`SHOP_01` / `123456`** -> Tự động điều hướng sang `/shop`.
- Nhập đơn giao từ `Quận 1` đi `TP. Thủ Đức`, khối lượng `2500g`, kích thước `30x20x15 cm`, thu hộ `COD = 500.000đ`.
- Quan sát khung **Ước tính cước tự động (`UC08`)** tính theo công thức Haversine (`9.91 km`) + quy đổi thể tích (`1800 g`) -> Tổng cước `65.000 đ`.
- Bấm **Tạo Vận Đơn & Sinh Tem A6** -> Sinh mã vận đơn `SPX...` trạng thái `CREATED`, bật Modal **Tem nhiệt chuẩn A6 (`100 x 150 mm`)** kèm mã vạch **1D Code 128** và **2D QR Code**.

### Màn 3: Quản trị viên Giám sát & Điều phối (`UC26` — Web Portal)
- Đăng xuất, đăng nhập tài khoản **`ADMIN_01` / `123456`** -> Mở Master Dashboard `/admin`.
- Lọc trạng thái `CREATED`, chọn đơn vừa tạo và gán cho **`SHIPPER_01`** -> Đơn chuyển sang `WAITING_FOR_PICKUP` và đồng bộ sự kiện sang Tracking Service.

### Màn 4: Tài xế Shipper Tác nghiệp Ngoài Hiện trường (`UC16`–`UC21` — Android App / Companion)
- Đăng nhập **`SHIPPER_01` / `123456`** trên **Android App (Kotlin)** (hoặc `/shipper` Web Companion dự phòng theo kịch bản R09).
- Bật công tắc **ONLINE** (`UC16`) -> Mở tab **Cần lấy (`UC17`)** -> Bấm **Quét Barcode & Lấy Hàng (`UC18`)** xác nhận mã `SPX...` -> Trạng thái chuyển sang `PICKED_UP`.
- Luân chuyển `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> Xác nhận **Giao thành công (`UC20`)** kèm chữ ký & thu COD -> Trạng thái thành `DELIVERED`.
- Đối với đơn `SPX20260501007` (`OUT_FOR_DELIVERY`), thử báo cáo **Giao thất bại (`UC21`)** với lý do *"Không liên lạc được với người nhận"* -> Trạng thái thành `FAILED` và hiển thị rõ lý do trên trang Tra cứu công khai `UC11`.

---

## 2. Kết Quả Kiểm Thử Tự Động & Kiểm Chứng SLA Thực Tế

Kết quả chạy trực tiếp bộ kiểm thử Unit Tests từng miền và bộ kiểm thử tích hợp `scripts/e2e-test.mjs` đi qua cổng **API Gateway (`http://localhost:8080`)**:

### 2.1. Kiểm thử Đơn vị (Unit Tests) & Biên dịch Từng Miền
| Thành phần | Công nghệ | Kết quả chạy kiểm thử |
| :--- | :--- | :--- |
| `api-gateway` (`:8080`) | Java 17 · Spring Cloud Gateway | `mvn clean package`: **BUILD SUCCESS**, 4/4 test cases pass (`JwtAuthenticationGatewayFilterTest`) |
| `user-service` (`:8081`) | Java 17 · Spring Boot · JPA | `mvn clean package`: **BUILD SUCCESS**, 2/2 test cases pass (`AuthServiceTest`) |
| `order-service` (`:8082`) | Java 17 · Spring Boot · AMQP | `mvn clean package`: **BUILD SUCCESS**, 4/4 test cases pass (`OrderDomainTests`) |
| `dispatch-service` (`:8083`) | TypeScript · NestJS · TypeORM | `npm run build && npm test`: **PASS 3/3** (`waybill-state-machine.spec.ts`) |
| `tracking-service` (`:8084`) | C# · .NET 9 · MongoDB/CQRS | `dotnet test && dotnet build -c Release`: **PASS 2/2** (`TrackingProjectorTests`), 0 errors |
| `web-portal` (`:3000`) | React 18 · Vite · Tailwind | `tsc -b && vite build`: **PASS**, build production sạch |
| `docker-compose.yml` | Docker Compose (`spx-network`) | `docker compose config --quiet`: **Exit code 0** (Cú pháp hợp lệ 100%) |

### 2.2. Kết Quả Bộ 12 Test Cases Tích Hợp Toàn Trình (`TC-01` đến `TC-12`)
Chạy qua `node scripts/e2e-test.mjs` (sau lần chỉnh sửa mã nguồn cuối cùng):

| Mã TC | Use Case | Kịch bản kiểm chứng | Kết quả thực tế quan sát | Trạng thái |
| :---: | :---: | :--- | :--- | :---: |
| **TC-01** | `UC01` | Đăng ký tài khoản mới (`0901234567`) & chặn trùng SĐT | Lần 1 `201 Created` (`ROLE_CUSTOMER`), Lần 2 `409 Conflict` | **PASS** |
| **TC-02** | `UC02` | Đăng nhập 3 vai trò `SHOP_01`, `SHIPPER_01`, `ADMIN_01` | Cả 3 trả `200 OK` đúng chuẩn JSON 3 trường & JWT chứa Role | **PASS** |
| **TC-03** | `UC02` | Bảo mật RBAC tại Gateway: Dùng token `CUSTOMER` gọi API gán đơn của `ADMIN` | Gateway `:8080` chặn ngay với `403 Forbidden` (`ERR_FORBIDDEN`) | **PASS** |
| **TC-04** | `UC08` | Tính cước Quận 1 → TP. Thủ Đức (`2.5 kg`, `30x20x15 cm`) | `200 OK`, `Distance=9.91km`, `volumetric=1800g`, `Fee=65000đ` | **PASS** |
| **TC-05** | `UC06`, `UC09` | Shop tạo vận đơn mới (`COD = 500.000đ`) & lấy tem in A6 | `201 Created` (`SPX...`, `CREATED`) & Label `CODE128` `100x150` `200 OK` | **PASS** |
| **TC-06** | `UC11` | Tra cứu công khai không token (`SPX20260501089` và `SPX999`) | `SPX20260501089` -> `200 OK` (timeline); `SPX999` -> `404 Not Found` | **PASS** |
| **TC-07** | `UC26` | Admin xem Master Dashboard (`CREATED`) & gán cho `SHIPPER_01` | `200 OK` (`WAITING_FOR_PICKUP`), đồng bộ sang Tracking trong `~381ms` | **PASS** |
| **TC-08** | `UC16`, `UC17` | Shipper bật Online & xem danh sách đơn cần lấy | `200 OK`, thấy đơn vừa gán ở trạng thái `WAITING_FOR_PICKUP` | **PASS** |
| **TC-09** | `UC18` | Shipper quét Barcode xác nhận lấy hàng | `200 OK` (`PICKED_UP`), Tracking public cập nhật ngay | **PASS** |
| **TC-10** | `UC20` | Luân chuyển & xác nhận Giao thành công | `200 OK` (`DELIVERED`), đồng bộ toàn hệ thống | **PASS** |
| **TC-11** | `UC21` | Shipper báo cáo Giao thất bại (`SPX20260501007`) kèm lý do bắt buộc | `200 OK` (`FAILED`), lưu đúng `failReason` trên Tracking | **PASS** |
| **TC-12** | State Machine | Gửi yêu cầu nhảy cóc `CREATED -> DELIVERED` trên cả Miền 1 & Miền 2 | Cả hai service đều từ chối với `400 Bad Request` (`ERR_INVALID_STATE_TRANSITION`) | **PASS** |

- **Tổng kết E2E:** **12/12 Test Cases PASS**.
- **Độ trễ phản hồi API trung bình (`NFR-01`):** `227.11 ms` (đạt xa ngưỡng yêu cầu `< 500 ms`).
- **Độ trễ đồng bộ sự kiện liên miền (`NFR-02`):** `~381 ms` (đạt ngưỡng `< 1000 ms`).
- **Cô lập dữ liệu (`NFR-03`):** 100% dịch vụ dùng kho lưu trữ độc lập, `0%` truy vấn chéo DB.
