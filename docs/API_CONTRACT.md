# Đặc Tả Hợp Đồng Giao Tiếp API (`API_CONTRACT.md`)

Mọi yêu cầu từ **Web Portal (`:3000`)** và **Android App** đều đi qua cửa ngõ duy nhất **API Gateway (`http://localhost:8080`)**.

---

## 1. Cấu trúc Phản hồi JSON Chuẩn (3 Trường Bắt Buộc)

```json
{
  "status": 200,
  "message": "Success",
  "data": {}
}
```

Ví dụ phản hồi lỗi nghiệp vụ / bảo mật:
```json
{
  "status": 400,
  "message": "Khối lượng kiện hàng không hợp lệ (Phải lớn hơn 0g)",
  "data": {
    "errorCode": "ERR_INVALID_WEIGHT",
    "field": "packageWeight"
  }
}
```

---

## 2. Bảng Phân Quyền RBAC tại API Gateway (`:8080`)

| Endpoint Pattern | Method | Vai trò cho phép | Kết quả nếu vi phạm |
| :--- | :--- | :--- | :--- |
| `/api/auth/register`, `/api/auth/login` | `POST` | Public (Không cần Token) | — |
| `/api/tracking/**` | `GET` | Public (Không cần Token - `UC11`) | — |
| `/api/orders/locations`, `/api/orders/calculate-fee` | `GET`, `POST` | Public | — |
| `/api/orders`, `/api/orders/my`, `/api/orders/{code}/label` | `POST`, `GET` | `ROLE_CUSTOMER`, `ROLE_ADMIN` | `401` / `403` |
| `/api/orders` (danh sách toàn hệ thống) | `GET` | `ROLE_ADMIN` | `403 ERR_FORBIDDEN` |
| `/api/dispatch/assign`, `/api/dispatch/dashboard/**`, `/api/dispatch/shippers`, `/api/dispatch/hubs` | `POST`, `GET` | `ROLE_ADMIN` | `403 ERR_FORBIDDEN` |
| `/api/dispatch/shipper/**`, `/api/dispatch/orders/**` | `GET`, `POST`, `PATCH` | `ROLE_SHIPPER`, `ROLE_ADMIN` | `403 ERR_FORBIDDEN` |
| `/api/*/internal/**` | `ANY` | Nội bộ giữa các service (Chặn từ ngoài) | `403 ERR_INTERNAL_ROUTE_FORBIDDEN` |

---

## 3. Chi tiết Endpoints Theo Từng Miền

### Miền 1A — User & Auth Service (`:8081`)
- `POST /api/auth/register` — Đăng ký tài khoản mới (`CUSTOMER` hoặc `SHIPPER`), trả `201 Created` hoặc `409 Conflict` nếu trùng SĐT.
- `POST /api/auth/login` — Đăng nhập bằng `phone` hoặc `identifier` (`SHOP_01`, `SHIPPER_01`, `ADMIN_01`), trả JWT Bearer token.
- `GET /api/auth/me` — Lấy thông tin người dùng hiện tại từ header `X-User-Code`.
- `GET /api/users/shippers` — Danh sách tài xế Shipper (`ROLE_ADMIN`).

### Miền 1B — Order & Waybill Service (`:8082`)
- `GET /api/orders/locations` — Danh mục 10 Quận/Huyện kèm tọa độ `(lat, lng)` và `hubCode`.
- `POST /api/orders/calculate-fee` — Tính khoảng cách Haversine, khối lượng quy đổi `(L*W*H)/5` và tổng cước (`UC08`).
- `POST /api/orders` — Tạo vận đơn mới mã `SPX...`, trạng thái `CREATED`, bắn sự kiện `order.created` (`UC06`).
- `GET /api/orders/my` — Danh sách vận đơn của Shop đang đăng nhập.
- `GET /api/orders/{trackingCode}/label` — Dữ liệu tem nhiệt khổ A6 (`100x150 mm`) chuẩn `CODE128` + QR link tra cứu (`UC09`).
- `PATCH /api/orders/{trackingCode}/status` — Cập nhật trạng thái có kiểm tra State Machine (chặn nhảy cóc với `400 Bad Request`).

### Miền 2 — Dispatch & Operations Service (`:8083`)
- `GET /api/dispatch/dashboard?status=&hubCode=&search=` — Master Dashboard tổng hợp KPI, đơn hàng, Shipper, Hub (`UC26`).
- `POST /api/dispatch/assign` — Gán đơn cho Shipper (`CREATED -> WAITING_FOR_PICKUP`) và phát sự kiện `dispatch.status.updated`.
- `GET /api/dispatch/shipper/profile` — Thông tin & trạng thái hoạt động Shipper (`UC16`).
- `PATCH /api/dispatch/shipper/status` — Bật/Tắt Online/Offline (`{ "isOnline": true/false }`).
- `GET /api/dispatch/shipper/orders?tab=pickup|delivery|history` — Danh sách đơn được gán (`UC17`).
- `POST /api/dispatch/orders/{code}/pickup` — Đối chiếu `scannedBarcode` & xác nhận đã lấy hàng (`UC18`).
- `POST /api/dispatch/orders/{code}/transit` — Luân chuyển sang `IN_TRANSIT` hoặc `OUT_FOR_DELIVERY`.
- `POST /api/dispatch/orders/{code}/deliver` — Xác nhận giao thành công, chữ ký, ảnh minh chứng, thu COD (`UC20`).
- `POST /api/dispatch/orders/{code}/fail` — Báo giao thất bại kèm lý do bắt buộc, tăng `deliveryAttempts` tối đa 3 lần (`UC21`).
- `PATCH /api/dispatch/orders/{code}/status` — Chuyển trạng thái qua State Machine kiểm tra chặt chẽ (`TC-12`).

### Miền 3 — Tracking & Notification Service (`:8084`)
- `GET /api/tracking/{trackingCode}` — Tra cứu công khai từ CQRS Read Model (`200 OK` hoặc `404 Not Found` với `ERR_TRACKING_NOT_FOUND` - `UC11`).
- `GET /api/tracking/recent/public` — Danh sách tóm tắt các vận đơn gần đây.
- `GET /api/notifications/my` — Danh sách thông báo biến động trạng thái của người dùng (`UC15`).
