using System.Security.Claims;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Authorize(Policy = "CustomerOnly")]
[Route("api/bookings")]
public class BookingController(
    IBookingService bookingService,
    ILogger<BookingController> logger) : ControllerBase
{
    private readonly IBookingService _bookingService = bookingService;
    private readonly ILogger<BookingController> _logger = logger;

    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability([FromQuery] AvailabilityRequestDto request)
    {
        var result = await _bookingService.GetAvailabilityAsync(request.Date, request.PricingId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBooking(CreateBookingRequestDto request)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _bookingService.CreateBookingAsync(customerId.Value, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        _logger.LogInformation("Customer {CustomerId} created booking {BookingId}.", customerId, result.Value!.BookingId);
        return Ok(result.Value);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelBooking(Guid id)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _bookingService.CancelBookingAsync(customerId.Value, id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyBookings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _bookingService.GetCustomerBookingsAsync(customerId.Value, page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    private Guid? GetPrincipalId()
    {
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("principal_id");

        return Guid.TryParse(rawId, out var principalId) ? principalId : null;
    }
}
