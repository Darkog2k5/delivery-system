using TrackingService.Models;

namespace TrackingService.Repositories;

public interface ITrackingRepository
{
    Task EnsureIndexesAsync();
    Task<TrackingReadModel?> GetByTrackingCodeAsync(string trackingCode);
    Task<List<TrackingReadModel>> GetRecentAsync(int limit = 20);
    Task UpsertReadModelAsync(TrackingReadModel model);
    Task<bool> EventExistsAsync(string eventId);
    Task AppendEventAsync(TrackingEventDocument evt);
    Task InsertNotificationAsync(NotificationDocument notification);
    Task<List<NotificationDocument>> GetNotificationsByUserAsync(string userCode);
}
