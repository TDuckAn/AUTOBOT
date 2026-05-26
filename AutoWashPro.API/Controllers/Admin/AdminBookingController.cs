using System.Security.Claims;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = "StaffOrAdmin")]
[Route("api/admin/bookings")]
public class AdminBookingController(
    IBookingService bookingService,
    ILogger<AdminBookingController> logger) : ControllerBase
{
    private readonly IBookingService _bookingService = bookingService;
    private readonly ILogger<AdminBookingController> _logger = logger;

    [HttpPost("walk-in")]
    public async Task<IActionResult> CreateWalkInBooking(CreateWalkInBookingRequestDto request)
    {
        var systemUserId = GetPrincipalId();
        if (systemUserId is null)
        {
            return Unauthorized();
        }

        var result = await _bookingService.CreateWalkInBookingAsync(systemUserId.Value, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        _logger.LogInformation("System user {SystemUserId} created walk-in booking {BookingId}.", systemUserId, result.Value!.BookingId);
        return Ok(result.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetBookings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DateOnly? date = null,
        [FromQuery] BookingStatus? status = null,
        [FromQuery] Guid? customerId = null)
    {
        var result = await _bookingService.GetAdminBookingsAsync(page, pageSize, date, status, customerId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue(
        [FromQuery] DateOnly? date = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _bookingService.GetDailyQueueAsync(date ?? DateOnly.FromDateTime(DateTime.UtcNow), page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    private Guid? GetPrincipalId()
    {
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("principal_id");

        return Guid.TryParse(rawId, out var principalId) ? principalId : null;
    }
}
