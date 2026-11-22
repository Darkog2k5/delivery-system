using TrackingService.Models;
using TrackingService.Repositories;
using TrackingService.Services;
using Xunit;

namespace TrackingService.Tests;

public class TrackingProjectorTests
{
    [Fact]
    public async Task ApplyEvent_UpdatesCqrsReadModelAndCreatesTimelineAndNotification()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "spx-tracking-test-" + Guid.NewGuid().ToString("N"));
        var repo = new FileTrackingRepository(tempDir);
        var seeder = new TrackingSeedService(repo);
        await seeder.SeedAsync();

        var seeded = await repo.GetByTrackingCodeAsync("SPX20260501089");
        Assert.NotNull(seeded);
        Assert.Equal("IN_TRANSIT", seeded!.CurrentStatus);
        Assert.True(seeded.Timeline.Count >= 4);

        var projector = new TrackingProjectorService(repo);
        await projector.ApplyEventAsync(new TrackingEventInput
        {
            EventId = "evt-test-1",
            EventType = "dispatch.status.updated",
            TrackingCode = "SPX20260501089",
            OrderStatus = "OUT_FOR_DELIVERY",
            Location = "TP. Thủ Đức",
            Description = "Shipper đang đi giao hàng",
            ActorCode = "SHIPPER_01"
        });

        var updated = await repo.GetByTrackingCodeAsync("SPX20260501089");
        Assert.NotNull(updated);
        Assert.Equal("OUT_FOR_DELIVERY", updated!.CurrentStatus);
        Assert.Equal("Shipper đang đi giao hàng", updated.Timeline.First().Description);

        var notifications = await repo.GetNotificationsByUserAsync("SHOP_01");
        Assert.NotEmpty(notifications);

        Directory.Delete(tempDir, true);
    }

    [Fact]
    public async Task MissingTrackingCode_ReturnsNull()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "spx-tracking-test-" + Guid.NewGuid().ToString("N"));
        var repo = new FileTrackingRepository(tempDir);
        var seeder = new TrackingSeedService(repo);
        await seeder.SeedAsync();

        var missing = await repo.GetByTrackingCodeAsync("SPX999");
        Assert.Null(missing);

        Directory.Delete(tempDir, true);
    }
}
