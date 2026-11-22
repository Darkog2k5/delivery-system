using MongoDB.Bson;
using MongoDB.Driver;
using TrackingService.Models;

namespace TrackingService.Repositories;

public class MongoTrackingRepository : ITrackingRepository
{
    private readonly IMongoCollection<TrackingReadModel> _readModels;
    private readonly IMongoCollection<TrackingEventDocument> _events;
    private readonly IMongoCollection<NotificationDocument> _notifications;

    public MongoTrackingRepository(string connectionString, string databaseName)
    {
        var client = new MongoClient(connectionString);
        var db = client.GetDatabase(databaseName);
        _readModels = db.GetCollection<TrackingReadModel>("tracking_read_models");
        _events = db.GetCollection<TrackingEventDocument>("tracking_events");
        _notifications = db.GetCollection<NotificationDocument>("notifications");
    }

    public async Task EnsureIndexesAsync()
    {
        var nullIdFilter = new BsonDocument("_id", BsonNull.Value);
        await _readModels.DeleteManyAsync(nullIdFilter);
        await _events.DeleteManyAsync(nullIdFilter);
        await _notifications.DeleteManyAsync(nullIdFilter);

        var codeIndex = new CreateIndexModel<TrackingReadModel>(
            Builders<TrackingReadModel>.IndexKeys.Ascending(x => x.TrackingCode),
            new CreateIndexOptions { Unique = true }
        );
        await _readModels.Indexes.CreateOneAsync(codeIndex);
    }

    public async Task<TrackingReadModel?> GetByTrackingCodeAsync(string trackingCode)
    {
        var normalized = trackingCode.Trim().ToUpperInvariant();
        return await _readModels.Find(x => x.TrackingCode == normalized).FirstOrDefaultAsync();
    }

    public async Task<List<TrackingReadModel>> GetRecentAsync(int limit = 20)
    {
        return await _readModels.Find(_ => true)
            .SortByDescending(x => x.UpdatedAt)
            .Limit(limit)
            .ToListAsync();
    }

    public async Task UpsertReadModelAsync(TrackingReadModel model)
    {
        model.TrackingCode = model.TrackingCode.Trim().ToUpperInvariant();
        var existing = await GetByTrackingCodeAsync(model.TrackingCode);
        if (existing != null && !string.IsNullOrEmpty(existing.MongoId))
        {
            model.MongoId = existing.MongoId;
        }
        else if (string.IsNullOrEmpty(model.MongoId))
        {
            model.MongoId = ObjectId.GenerateNewId().ToString();
        }
        await _readModels.ReplaceOneAsync(
            x => x.TrackingCode == model.TrackingCode,
            model,
            new ReplaceOptions { IsUpsert = true }
        );
    }

    public async Task<bool> EventExistsAsync(string eventId)
    {
        if (string.IsNullOrWhiteSpace(eventId)) return false;
        return await _events.Find(x => x.EventId == eventId).AnyAsync();
    }

    public async Task AppendEventAsync(TrackingEventDocument evt)
    {
        await _events.InsertOneAsync(evt);
    }

    public async Task InsertNotificationAsync(NotificationDocument notification)
    {
        await _notifications.InsertOneAsync(notification);
    }

    public async Task<List<NotificationDocument>> GetNotificationsByUserAsync(string userCode)
    {
        return await _notifications.Find(x => x.TargetUserCode == userCode)
            .SortByDescending(x => x.CreatedAt)
            .Limit(50)
            .ToListAsync();
    }
}
