using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace TrackingService.Models;

public record ApiResponse<T>(
    [property: JsonPropertyName("status")] int Status,
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("data")] T Data
)
{
    public static ApiResponse<T> Ok(T data, string message = "Success") => new(200, message, data);
    public static ApiResponse<T> Error(int status, string message, T data) => new(status, message, data);
}

public class TrackingTimelineItem
{
    public string EventId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ActorCode { get; set; } = string.Empty;
    public string? HubCode { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

public class TrackingReadModel
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonIgnore]
    public string? MongoId { get; set; } = ObjectId.GenerateNewId().ToString();

    public string TrackingCode { get; set; } = string.Empty;
    public string CustomerCode { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderDistrict { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverDistrict { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public long CodAmount { get; set; }
    public long ShippingFee { get; set; }
    public string CurrentStatus { get; set; } = string.Empty;
    public string HubCode { get; set; } = string.Empty;
    public string? AssignedShipperCode { get; set; }
    public string? AssignedShipperName { get; set; }
    public int DeliveryAttempts { get; set; }
    public string? FailReason { get; set; }
    public string? ProofImageUrl { get; set; }
    public string? ReceiverSignature { get; set; }
    public List<TrackingTimelineItem> Timeline { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class TrackingEventDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonIgnore]
    public string? MongoId { get; set; } = ObjectId.GenerateNewId().ToString();

    public string EventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string TrackingCode { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ActorCode { get; set; } = string.Empty;
    public string? HubCode { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

public class NotificationDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonIgnore]
    public string? MongoId { get; set; } = ObjectId.GenerateNewId().ToString();

    public string NotificationId { get; set; } = Guid.NewGuid().ToString("N");
    public string TargetUserCode { get; set; } = string.Empty;
    public string TrackingCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TrackingEventInput
{
    public string? EventId { get; set; }
    public string? EventType { get; set; }
    public string TrackingCode { get; set; } = string.Empty;
    public string? CustomerCode { get; set; }
    public string? CustomerName { get; set; }
    public string? SenderName { get; set; }
    public string? SenderDistrict { get; set; }
    public string? ReceiverName { get; set; }
    public string? ReceiverDistrict { get; set; }
    public string? ItemName { get; set; }
    public long? CodAmount { get; set; }
    public long? ShippingFee { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string? HubCode { get; set; }
    public string? AssignedShipperCode { get; set; }
    public string? AssignedShipperName { get; set; }
    public int? DeliveryAttempts { get; set; }
    public string? FailReason { get; set; }
    public string? ProofImageUrl { get; set; }
    public string? ReceiverSignature { get; set; }
    public string? Location { get; set; }
    public string? Description { get; set; }
    public string? ActorCode { get; set; }
    public DateTime? OccurredAt { get; set; }
}

public record PublicTrackingSummary(
    string TrackingCode,
    string CurrentStatus,
    string SenderDistrict,
    string ReceiverDistrict,
    string ItemName,
    DateTime UpdatedAt
);
