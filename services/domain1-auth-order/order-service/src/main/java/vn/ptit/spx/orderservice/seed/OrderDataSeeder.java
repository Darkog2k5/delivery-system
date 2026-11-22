package vn.ptit.spx.orderservice.seed;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import vn.ptit.spx.orderservice.domain.ShippingFeeCalculator;
import vn.ptit.spx.orderservice.domain.WaybillStateMachine;
import vn.ptit.spx.orderservice.entity.Order;
import vn.ptit.spx.orderservice.repository.OrderRepository;

import java.util.List;

/**
 * Idempotent seed data of 10 standard waybills aligned across OrderDB, DispatchDB, and TrackingDB.
 * Includes SPX20260501089 for TC-06 and orders ready for TC-07..TC-12.
 */
@Component
public class OrderDataSeeder implements CommandLineRunner {

    private final OrderRepository orderRepository;

    public OrderDataSeeder(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public void run(String... args) {
        List<SeedOrder> seeds = List.of(
                new SeedOrder("SPX20260501089", "SHOP_01", "Shop Thời Trang Sài Gòn", "0988000001", "120 Lê Lợi", "Quận 1",
                        "Nguyễn Thị Mai", "0909111222", "88 Võ Văn Ngân", "TP. Thủ Đức",
                        "Áo khoác Denim Unisex", 1200, 25, 20, 10, 350000, "Gọi trước khi giao",
                        "HUB-TD", "SHIPPER_01", WaybillStateMachine.IN_TRANSIT, 0, null),
                new SeedOrder("SPX20260501001", "SHOP_01", "Shop Thời Trang Sài Gòn", "0988000001", "120 Lê Lợi", "Quận 1",
                        "Lê Văn Hùng", "0903222333", "25 Nguyễn Thị Thập", "Quận 7",
                        "Giày Sneaker Thể Thao", 1500, 20, 15, 10, 450000, "Hàng dễ móp hộp",
                        "HUB-Q1", null, WaybillStateMachine.CREATED, 0, null),
                new SeedOrder("SPX20260501002", "SHOP_02", "Cửa Hàng Điện Tử Minh Anh", "0988000002", "45 Cộng Hòa", "Quận Tân Bình",
                        "Phạm Thị Hoa", "0904333444", "102 Quang Trung", "Quận Gò Vấp",
                        "Tai nghe Bluetooth Pro", 800, 15, 15, 10, 280000, "Kiểm hàng trước khi thanh toán",
                        "HUB-TB", null, WaybillStateMachine.CREATED, 0, null),
                new SeedOrder("SPX20260501003", "SHOP_01", "Shop Thời Trang Sài Gòn", "0988000001", "120 Lê Lợi", "Quận 1",
                        "Trần Quốc Bảo", "0905444555", "300 Điện Biên Phủ", "Quận Bình Thạnh",
                        "Set Quần Áo Công Sở", 1000, 20, 20, 10, 520000, "Giao giờ hành chính",
                        "HUB-Q1", "SHIPPER_01", WaybillStateMachine.WAITING_FOR_PICKUP, 0, null),
                new SeedOrder("SPX20260501004", "SHOP_03", "Mỹ Phẩm Lan Chi", "0988000003", "88 Võ Văn Tần", "Quận 3",
                        "Võ Minh Tâm", "0906555666", "55 Sư Vạn Hạnh", "Quận 10",
                        "Bộ Dưỡng Da Chống Nắng", 600, 15, 10, 10, 190000, "Tránh nắng nóng",
                        "HUB-Q1", "SHIPPER_01", WaybillStateMachine.WAITING_FOR_PICKUP, 0, null),
                new SeedOrder("SPX20260501005", "SHOP_02", "Cửa Hàng Điện Tử Minh Anh", "0988000002", "45 Cộng Hòa", "Quận Tân Bình",
                        "Ngô Thị Lan", "0907666777", "19 Xa Lộ Hà Nội", "TP. Thủ Đức",
                        "Bàn phím Cơ Không Dây", 2000, 30, 20, 15, 1200000, "Hàng giá trị cao",
                        "HUB-TB", "SHIPPER_02", WaybillStateMachine.PICKED_UP, 0, null),
                new SeedOrder("SPX20260501006", "SHOP_04", "Gia Dụng Phú Quý", "0988000004", "210 Xô Viết Nghệ Tĩnh", "Quận Bình Thạnh",
                        "Đặng Hữu Nghĩa", "0908777888", "12 Nguyễn Huệ", "Quận 1",
                        "Ấm Siêu Tốc Inox 304", 900, 20, 15, 10, 640000, "Giao trước 17h",
                        "HUB-Q1", "SHIPPER_01", WaybillStateMachine.OUT_FOR_DELIVERY, 0, null),
                new SeedOrder("SPX20260501007", "SHOP_05", "Nhà Sách Tri Thức", "0988000005", "15 Nguyễn Trãi", "Quận 5",
                        "Huỳnh Ngọc Ánh", "0909888999", "68 Trần Hưng Đạo", "Quận 1",
                        "Bộ Sách Thiết Kế Hệ Thống", 700, 22, 16, 8, 310000, "Gọi điện trước 15 phút",
                        "HUB-Q1", "SHIPPER_01", WaybillStateMachine.OUT_FOR_DELIVERY, 0, null),
                new SeedOrder("SPX20260501008", "SHOP_01", "Shop Thời Trang Sài Gòn", "0988000001", "120 Lê Lợi", "Quận 1",
                        "Bùi Thanh Tùng", "0912000111", "44 Pasteur", "Quận 3",
                        "Túi Đeo Chéo Da PU", 500, 15, 15, 10, 250000, "Giao tận tay",
                        "HUB-Q1", "SHIPPER_03", WaybillStateMachine.DELIVERED, 1, null),
                new SeedOrder("SPX20260501009", "SHOP_03", "Mỹ Phẩm Lan Chi", "0988000003", "88 Võ Văn Tần", "Quận Phú Nhuận",
                        "Trương Mỹ Linh", "0913000222", "90 Nguyễn Hữu Thọ", "Quận 7",
                        "Nước Hoa Cao Cấp 50ml", 1100, 20, 15, 12, 420000, "Không giao được hãy gọi lại",
                        "HUB-BT", "SHIPPER_02", WaybillStateMachine.FAILED, 1, "Khách hẹn giao lại vào ngày mai")
        );

        for (SeedOrder s : seeds) {
            if (!orderRepository.existsByTrackingCodeIgnoreCase(s.trackingCode)) {
                ShippingFeeCalculator.FeeCalculationResult fee = ShippingFeeCalculator.calculate(
                        s.senderDistrict, s.receiverDistrict, s.weightGram, null, s.l, s.w, s.h
                );
                Order o = new Order();
                o.setTrackingCode(s.trackingCode);
                o.setCustomerCode(s.customerCode);
                o.setCustomerName(s.customerName);
                o.setSenderName(s.customerName);
                o.setSenderPhone(s.senderPhone);
                o.setSenderAddress(s.senderAddress);
                o.setSenderDistrict(s.senderDistrict);
                o.setReceiverName(s.receiverName);
                o.setReceiverPhone(s.receiverPhone);
                o.setReceiverAddress(s.receiverAddress);
                o.setReceiverDistrict(s.receiverDistrict);
                o.setItemName(s.itemName);
                o.setActualWeightGram(fee.actualWeightGram());
                o.setLengthCm(s.l);
                o.setWidthCm(s.w);
                o.setHeightCm(s.h);
                o.setVolumetricWeightGram(fee.volumetricWeightGram());
                o.setChargeableWeightGram(fee.chargeableWeightGram());
                o.setDistanceKm(fee.distanceKm());
                o.setShippingFee(fee.shippingFee());
                o.setCodAmount(s.codAmount);
                o.setNote(s.note);
                o.setHubCode(s.hubCode);
                o.setAssignedShipperCode(s.shipperCode);
                o.setOrderStatus(s.status);
                o.setDeliveryAttempts(s.attempts);
                o.setFailReason(s.failReason);
                orderRepository.save(o);
            }
        }
    }

    private record SeedOrder(
            String trackingCode, String customerCode, String customerName, String senderPhone,
            String senderAddress, String senderDistrict, String receiverName, String receiverPhone,
            String receiverAddress, String receiverDistrict, String itemName, int weightGram,
            double l, double w, double h, long codAmount, String note, String hubCode,
            String shipperCode, String status, int attempts, String failReason
    ) {}
}
