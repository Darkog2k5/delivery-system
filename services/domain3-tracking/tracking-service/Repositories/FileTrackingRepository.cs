using System.Text.Json;
using TrackingService.Models;

namespace TrackingService.Repositories;

/// <summary>
/// Thread-safe JSON file-backed CQRS repository for standalone local mode without Docker/MongoDB.
/// </summary>
public class FileTrackingRepository : ITrackingRepository
{
    private readonly string _filePath;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private FileStoreState _state = new();

    private class FileStoreState
    {
        public Dictionary<string, TrackingReadModel> ReadModels { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public List<TrackingEventDocument> Events { get; set; } = new();
        public List<NotificationDocument> Notifications { get; set; } = new();
    }

    public FileTrackingRepository(string directoryPath)
    {
        Directory.CreateDirectory(directoryPath);
        _filePath = Path.Combine(directoryPath, "tracking_db.json");
        if (File.Exists(_filePath))
        {
            var json = File.ReadAllText(_filePath);
            var loaded = JsonSerializer.Deserialize<FileStoreState>(json);
            if (loaded != null)
            {
                _state = loaded;
            }
        }
    }

    public Task EnsureIndexesAsync() => Task.CompletedTask;

    public async Task<TrackingReadModel?> GetByTrackingCodeAsync(string trackingCode)
    {
        await _lock.WaitAsync();
        try
        {
            var key = trackingCode.Trim().ToUpperInvariant();
            return _state.ReadModels.TryGetValue(key, out var model) ? Clone(model) : null;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<List<TrackingReadModel>> GetRecentAsync(int limit = 20)
    {
        await _lock.WaitAsync();
        try
        {
            return _state.ReadModels.Values
                .OrderByDescending(x => x.UpdatedAt)
                .Take(limit)
                .Select(Clone)
                .ToList();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task UpsertReadModelAsync(TrackingReadModel model)
    {
        await _lock.WaitAsync();
        try
        {
            var key = model.TrackingCode.Trim().ToUpperInvariant();
            model.TrackingCode = key;
            _state.ReadModels[key] = Clone(model);
            await PersistAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> EventExistsAsync(string eventId)
    {
        if (string.IsNullOrWhiteSpace(eventId)) return false;
        await _lock.WaitAsync();
        try
        {
            return _state.Events.Any(e => e.EventId == eventId);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task AppendEventAsync(TrackingEventDocument evt)
    {
        await _lock.WaitAsync();
        try
        {
            _state.Events.Add(evt);
            await PersistAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task InsertNotificationAsync(NotificationDocument notification)
    {
        await _lock.WaitAsync();
        try
        {
            _state.Notifications.Add(notification);
            await PersistAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<List<NotificationDocument>> GetNotificationsByUserAsync(string userCode)
    {
        await _lock.WaitAsync();
        try
        {
            return _state.Notifications
                .Where(n => string.Equals(n.TargetUserCode, userCode, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToList();
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task PersistAsync()
    {
        var json = JsonSerializer.Serialize(_state, new JsonSerializerOptions { WriteIndented = false });
        await File.WriteAllTextAsync(_filePath, json);
    }

    private static TrackingReadModel Clone(TrackingReadModel src)
    {
        var json = JsonSerializer.Serialize(src);
        return JsonSerializer.Deserialize<TrackingReadModel>(json)!;
    }
}
