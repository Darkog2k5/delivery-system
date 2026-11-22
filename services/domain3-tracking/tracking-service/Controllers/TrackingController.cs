using Microsoft.AspNetCore.Mvc;
using TrackingService.Models;
using TrackingService.Repositories;
using TrackingService.Services;

namespace TrackingService.Controllers;

[ApiController]
[Route("api/tracking")]
public class TrackingController : ControllerBase
{
    private readonly ITrackingRepository _repo;
    private readonly TrackingProjectorService _projector;

    public TrackingController(ITrackingRepository repo, TrackingProjectorService projector)
    {
        _repo = repo;
        _projector = projector;
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(ApiResponse<object>.Ok(new { service = "tracking-service", status = "UP" }));
    }

    [HttpGet("recent/public")]
    public async Task<IActionResult> GetRecentPublic()
    {
        var items = await _repo.GetRecentAsync(12);
        var summaries = items.Select(x => new PublicTrackingSummary(
            x.TrackingCode,
            x.CurrentStatus,
            x.SenderDistrict,
            x.ReceiverDistrict,
            x.ItemName,
            x.UpdatedAt
        )).ToList();
        return Ok(ApiResponse<List<PublicTrackingSummary>>.Ok(summaries));
    }

    [HttpGet("{trackingCode}")]
    public async Task<IActionResult> TrackByCode(string trackingCode)
    {
        var model = await _repo.GetByTrackingCodeAsync(trackingCode);
        if (model == null)
        {
            return NotFound(ApiResponse<object>.Error(
                404,
                $"Không tìm thấy thông tin vận đơn '{trackingCode}'",
                new { errorCode = "ERR_TRACKING_NOT_FOUND", trackingCode }
            ));
        }
        return Ok(ApiResponse<TrackingReadModel>.Ok(model));
    }

    [HttpPost("internal/events")]
    public async Task<IActionResult> ReceiveInternalEvent([FromBody] TrackingEventInput input)
    {
        await _projector.ApplyEventAsync(input);
        return Ok(ApiResponse<object>.Ok(new { synced = true }));
    }
}

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ITrackingRepository _repo;

    public NotificationsController(ITrackingRepository repo)
    {
        _repo = repo;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyNotifications(
        [FromHeader(Name = "X-User-Code")] string? headerUserCode,
        [FromQuery] string? userCode)
    {
        var target = !string.IsNullOrWhiteSpace(headerUserCode) ? headerUserCode : (userCode ?? "SHOP_01");
        var list = await _repo.GetNotificationsByUserAsync(target);
        return Ok(ApiResponse<List<NotificationDocument>>.Ok(list));
    }
}
