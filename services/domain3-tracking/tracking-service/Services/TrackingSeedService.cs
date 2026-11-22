using TrackingService.Models;
using TrackingService.Repositories;

namespace TrackingService.Services;

public class TrackingSeedService
{
    private readonly ITrackingRepository _repo;

    public TrackingSeedService(ITrackingRepository repo)
    {
        _repo = repo;
    }

    public async Task SeedAsync()
    {
        await _repo.EnsureIndexesAsync();
        var now = DateTime.UtcNow;
        var seeds = new List<TrackingReadModel>
        {
            new()
            {
                TrackingCode = "SPX20260501089",
                CustomerCode = "SHOP_01",
                SenderName = "Shop Thời Trang Sài Gòn",
                SenderDistrict = "Quận 1",
                ReceiverName = "Nguyễn Thị Mai",
                ReceiverDistrict = "TP. Thủ Đức",
                ItemName = "Áo khoác Denim Unisex",
                CodAmount = 350000,
                ShippingFee = 60000,
                CurrentStatus = "IN_TRANSIT",
                HubCode = "HUB-TD",
                AssignedShipperCode = "SHIPPER_01",
                AssignedShipperName = "Nguyễn Văn Tài",
                CreatedAt = now.AddHours(-12),
                UpdatedAt = now.AddHours(-2),
                Timeline = new List<TrackingTimelineItem>
                {
                    new() { EventId = "seed-089-4", Status = "IN_TRANSIT", Title = "Đang luân chuyển qua trạm trung chuyển", Description = "Đơn hàng đã đến Trạm Trung Chuyển TP. Thủ Đức (HUB-TD)", Location = "HUB-TD", ActorCode = "HUB-TD", HubCode = "HUB-TD", OccurredAt = now.AddHours(-2) },
                    new() { EventId = "seed-089-3", Status = "PICKED_UP", Title = "Shipper đã lấy hàng thành công", Description = "Tài xế Nguyễn Văn Tài (SHIPPER_01) đã nhận kiện hàng từ Shop Thời Trang Sài Gòn", Location = "120 Lê Lợi, Quận 1", ActorCode = "SHIPPER_01", HubCode = "HUB-Q1", OccurredAt = now.AddHours(-6) },
                    new() { EventId = "seed-089-2", Status = "WAITING_FOR_PICKUP", Title = "Đã điều phối tài xế chờ lấy hàng", Description = "Điều phối viên đã gán tài xế Nguyễn Văn Tài (SHIPPER_01)", Location = "HUB-Q1", ActorCode = "ADMIN_01", HubCode = "HUB-Q1", OccurredAt = now.AddHours(-9) },
                    new() { EventId = "seed-089-1", Status = "CREATED", Title = "Đơn hàng đã được tạo", Description = "Shop Thời Trang Sài Gòn khởi tạo vận đơn SPX20260501089", Location = "Quận 1", ActorCode = "SHOP_01", HubCode = "HUB-Q1", OccurredAt = now.AddHours(-12) }
                }
            },
            BuildSimpleSeed("SPX20260501001", "SHOP_01", "Shop Thời Trang Sài Gòn", "Quận 1", "Lê Văn Hùng", "Quận 7", "Giày Sneaker Thể Thao", 450000, 35000, "CREATED", "HUB-Q1", null, null, 0, null, now.AddHours(-5)),
            BuildSimpleSeed("SPX20260501002", "SHOP_02", "Cửa Hàng Điện Tử Minh Anh", "Quận Tân Bình", "Phạm Thị Hoa", "Quận Gò Vấp", "Tai nghe Bluetooth Pro", 280000, 32500, "CREATED", "HUB-TB", null, null, 0, null, now.AddHours(-4)),
            BuildSimpleSeed("SPX20260501003", "SHOP_01", "Shop Thời Trang Sài Gòn", "Quận 1", "Trần Quốc Bảo", "Quận Bình Thạnh", "Set Quần Áo Công Sở", 520000, 27500, "WAITING_FOR_PICKUP", "HUB-Q1", "SHIPPER_01", "Nguyễn Văn Tài", 0, null, now.AddHours(-3)),
            BuildSimpleSeed("SPX20260501004", "SHOP_03", "Mỹ Phẩm Lan Chi", "Quận 3", "Võ Minh Tâm", "Quận 10", "Bộ Dưỡng Da Chống Nắng", 190000, 22500, "WAITING_FOR_PICKUP", "HUB-Q1", "SHIPPER_01", "Nguyễn Văn Tài", 0, null, now.AddHours(-3)),
            BuildSimpleSeed("SPX20260501005", "SHOP_02", "Cửa Hàng Điện Tử Minh Anh", "Quận Tân Bình", "Ngô Thị Lan", "TP. Thủ Đức", "Bàn phím Cơ Không Dây", 1200000, 75000, "PICKED_UP", "HUB-TB", "SHIPPER_02", "Trần Minh Tuấn", 0, null, now.AddHours(-2)),
            BuildSimpleSeed("SPX20260501006", "SHOP_04", "Gia Dụng Phú Quý", "Quận Bình Thạnh", "Đặng Hữu Nghĩa", "Quận 1", "Ấm Siêu Tốc Inox 304", 640000, 27500, "OUT_FOR_DELIVERY", "HUB-Q1", "SHIPPER_01", "Nguyễn Văn Tài", 0, null, now.AddHours(-1)),
            BuildSimpleSeed("SPX20260501007", "SHOP_05", "Nhà Sách Tri Thức", "Quận 5", "Huỳnh Ngọc Ánh", "Quận 1", "Bộ Sách Thiết Kế Hệ Thống", 310000, 32500, "OUT_FOR_DELIVERY", "HUB-Q1", "SHIPPER_01", "Nguyễn Văn Tài", 0, null, now.AddHours(-1)),
            BuildSimpleSeed("SPX20260501008", "SHOP_01", "Shop Thời Trang Sài Gòn", "Quận 1", "Bùi Thanh Tùng", "Quận 3", "Túi Đeo Chéo Da PU", 250000, 15000, "DELIVERED", "HUB-Q1", "SHIPPER_03", "Lê Hoàng Nam", 1, null, now.AddHours(-8)),
            BuildSimpleSeed("SPX20260501009", "SHOP_03", "Mỹ Phẩm Lan Chi", "Quận Phú Nhuận", "Trương Mỹ Linh", "Quận 7", "Nước Hoa Cao Cấp 50ml", 420000, 50000, "FAILED", "HUB-BT", "SHIPPER_02", "Trần Minh Tuấn", 1, "Khách hẹn giao lại vào ngày mai", now.AddHours(-6))
        };

        foreach (var item in seeds)
        {
            if (await _repo.GetByTrackingCodeAsync(item.TrackingCode) == null)
            {
                await _repo.UpsertReadModelAsync(item);
            }
        }
    }

    private static TrackingReadModel BuildSimpleSeed(
        string code, string cust, string sender, string senderDist, string receiver, string receiverDist,
        string item, long cod, long fee, string status, string hub, string? shipperCode, string? shipperName,
        int attempts, string? failReason, DateTime time)
    {
        var timeline = new List<TrackingTimelineItem>
        {
            new()
            {
                EventId = $"seed-{code}-latest",
                Status = status,
                Title = TrackingProjectorService.MapStatusTitle(status),
                Description = failReason != null ? $"Giao thất bại: {failReason}" : TrackingProjectorService.MapStatusTitle(status),
                Location = hub,
                ActorCode = shipperCode ?? cust,
                HubCode = hub,
                OccurredAt = time
            },
            new()
            {
                EventId = $"seed-{code}-created",
                Status = "CREATED",
                Title = "Đơn hàng đã được tạo",
                Description = $"{sender} khởi tạo vận đơn {code}",
                Location = senderDist,
                ActorCode = cust,
                HubCode = hub,
                OccurredAt = time.AddHours(-4)
            }
        };

        return new TrackingReadModel
        {
            TrackingCode = code,
            CustomerCode = cust,
            SenderName = sender,
            SenderDistrict = senderDist,
            ReceiverName = receiver,
            ReceiverDistrict = receiverDist,
            ItemName = item,
            CodAmount = cod,
            ShippingFee = fee,
            CurrentStatus = status,
            HubCode = hub,
            AssignedShipperCode = shipperCode,
            AssignedShipperName = shipperName,
            DeliveryAttempts = attempts,
            FailReason = failReason,
            CreatedAt = time.AddHours(-4),
            UpdatedAt = time,
            Timeline = timeline
        };
    }
}
