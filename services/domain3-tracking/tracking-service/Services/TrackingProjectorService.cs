using TrackingService.Models;
using TrackingService.Repositories;

namespace TrackingService.Services;

public class TrackingProjectorService
{
    private readonly ITrackingRepository _repo;

    public TrackingProjectorService(ITrackingRepository repo)
    {
        _repo = repo;
    }

    public async Task ApplyEventAsync(TrackingEventInput input)
    {
        if (string.IsNullOrWhiteSpace(input.TrackingCode)) return;

        var eventId = string.IsNullOrWhiteSpace(input.EventId)
            ? $"evt-{Guid.NewGuid():N}"
            : input.EventId.Trim();

        if (await _repo.EventExistsAsync(eventId))
        {
            return;
        }

        var occurredAt = input.OccurredAt ?? DateTime.UtcNow;
        var trackingCode = input.TrackingCode.Trim().ToUpperInvariant();
        var model = await _repo.GetByTrackingCodeAsync(trackingCode);

        if (model == null)
        {
            model = new TrackingReadModel
            {
                TrackingCode = trackingCode,
                CustomerCode = input.CustomerCode ?? "SHOP_01",
                SenderName = input.SenderName ?? input.CustomerName ?? "Shop",
                SenderDistrict = input.SenderDistrict ?? "Quận 1",
                ReceiverName = input.ReceiverName ?? "Người nhận",
                ReceiverDistrict = input.ReceiverDistrict ?? "Quận 1",
                ItemName = input.ItemName ?? "Kiện hàng",
                CodAmount = input.CodAmount ?? 0,
                ShippingFee = input.ShippingFee ?? 0,
                CurrentStatus = string.IsNullOrWhiteSpace(input.OrderStatus) ? "CREATED" : input.OrderStatus,
                HubCode = input.HubCode ?? "HUB-Q1",
                CreatedAt = occurredAt,
                UpdatedAt = occurredAt,
                Timeline = new List<TrackingTimelineItem>()
            };
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(input.OrderStatus))
                model.CurrentStatus = input.OrderStatus;
            if (!string.IsNullOrWhiteSpace(input.HubCode))
                model.HubCode = input.HubCode;
            if (!string.IsNullOrWhiteSpace(input.AssignedShipperCode))
                model.AssignedShipperCode = input.AssignedShipperCode;
            if (!string.IsNullOrWhiteSpace(input.AssignedShipperName))
                model.AssignedShipperName = input.AssignedShipperName;
            if (input.DeliveryAttempts.HasValue)
                model.DeliveryAttempts = input.DeliveryAttempts.Value;
            if (input.FailReason != null)
                model.FailReason = input.FailReason;
            if (input.ProofImageUrl != null)
                model.ProofImageUrl = input.ProofImageUrl;
            if (input.ReceiverSignature != null)
                model.ReceiverSignature = input.ReceiverSignature;
            model.UpdatedAt = occurredAt;
        }

        var statusTitle = MapStatusTitle(model.CurrentStatus);
        var description = !string.IsNullOrWhiteSpace(input.Description)
            ? input.Description
            : $"Cập nhật trạng thái: {statusTitle}";
        var location = !string.IsNullOrWhiteSpace(input.Location)
            ? input.Location
            : model.HubCode;

        model.Timeline.Add(new TrackingTimelineItem
        {
            EventId = eventId,
            Status = model.CurrentStatus,
            Title = statusTitle,
            Description = description,
            Location = location,
            ActorCode = input.ActorCode ?? "SYSTEM",
            HubCode = model.HubCode,
            OccurredAt = occurredAt
        });

        model.Timeline = model.Timeline
            .OrderByDescending(t => t.OccurredAt)
            .ToList();

        await _repo.UpsertReadModelAsync(model);

        await _repo.AppendEventAsync(new TrackingEventDocument
        {
            EventId = eventId,
            EventType = input.EventType ?? "status.updated",
            TrackingCode = trackingCode,
            OrderStatus = model.CurrentStatus,
            Description = description,
            Location = location,
            ActorCode = input.ActorCode ?? "SYSTEM",
            HubCode = model.HubCode,
            OccurredAt = occurredAt
        });

        await _repo.InsertNotificationAsync(new NotificationDocument
        {
            TargetUserCode = model.CustomerCode,
            TrackingCode = trackingCode,
            Title = $"[{trackingCode}] {statusTitle}",
            Message = description,
            IsRead = false,
            CreatedAt = occurredAt
        });
    }

    public static string MapStatusTitle(string status) => status switch
    {
        "CREATED" => "Đơn hàng đã được tạo",
        "WAITING_FOR_PICKUP" => "Đã điều phối tài xế chờ lấy hàng",
        "PICKED_UP" => "Shipper đã lấy hàng thành công",
        "IN_TRANSIT" => "Đang luân chuyển qua trạm trung chuyển",
        "OUT_FOR_DELIVERY" => "Shipper đang giao hàng đến người nhận",
        "DELIVERED" => "Giao hàng thành công",
        "FAILED" => "Giao hàng không thành công",
        _ => status
    };
}
