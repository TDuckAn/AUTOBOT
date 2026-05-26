using AutoWashPro.BLL.DTOs.Checkout;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Authorize(Policy = "StaffOrAdmin")]
[Route("api/admin/bookings")]
public class CheckoutController(
    ICheckoutService checkoutService,
    ILogger<CheckoutController> logger) : ControllerBase
{
    private readonly ICheckoutService _checkoutService = checkoutService;
    private readonly ILogger<CheckoutController> _logger = logger;

    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> CompleteBooking(Guid id, CompleteBookingRequestDto request)
    {
        var result = await _checkoutService.CompleteBookingAsync(id, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        _logger.LogInformation("Completed booking {BookingId}.", id);
        return Ok(result.Value);
    }
}
