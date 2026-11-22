# Android Native App (Kotlin + Jetpack Compose)

## Chức năng đã cài đặt
- **UC11 (`PublicTrackingScreen`):** Mở app tra cứu ngay mã vận đơn (`SPX20260501089`, `SPX999`) không cần đăng nhập.
- **UC01 / UC02 (`ShipperLoginScreen`):** Đăng ký tài xế, Đăng nhập JWT (`SHIPPER_01` / `123456`), cấu hình URL API Gateway (`http://10.0.2.2:8080/` cho Android Emulator hoặc IP LAN máy thật).
- **UC16–UC21 (`ShipperDashboardScreen`):**
  - Bật/Tắt trạng thái hoạt động (`ONLINE` / `OFFLINE`).
  - Xem danh sách đơn cần lấy (`WAITING_FOR_PICKUP`), đơn đang xử lý, lịch sử.
  - Quét Barcode bằng Google Play Services ML Kit Code Scanner (kèm ô nhập mã dự phòng trên máy ảo) để xác nhận `PICKED_UP`.
  - Luân chuyển `IN_TRANSIT` -> `OUT_FOR_DELIVERY`.
  - Xác nhận Giao thành công (`DELIVERED`) kèm chữ ký & COD.
  - Báo cáo Giao thất bại (`FAILED`) kèm lý do bắt buộc.

## Hướng dẫn mở & build trong Android Studio
1. Mở **Android Studio** -> **Open** thư mục `clients/android-app`.
2. Đợi Gradle Sync tải SDK & thư viện Jetpack Compose / Retrofit2 / ML Kit.
3. Chạy trên Emulator (`http://10.0.2.2:8080/`) hoặc điện thoại thật qua biểu tượng **Run**.
