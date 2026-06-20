using System.Security.Claims;
using AutoWashPro.BLL.DTOs.Customer;
using AutoWashPro.BLL.DTOs.Voucher;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Authorize(Policy = "CustomerOnly")]
[Route("api/customers/me")]
public class CustomerController(
    ICustomerService customerService,
    ILoyaltyService loyaltyService,
    IVoucherService voucherService,
    ILogger<CustomerController> logger) : ControllerBase
{
    private readonly ICustomerService _customerService = customerService;
    private readonly ILoyaltyService _loyaltyService = loyaltyService;
    private readonly IVoucherService _voucherService = voucherService;
    private readonly ILogger<CustomerController> _logger = logger;

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _customerService.GetProfileAsync(customerId.Value);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile(UpdateCustomerProfileDto request)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _customerService.UpdateProfileAsync(customerId.Value, request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("vehicles")]
    public async Task<IActionResult> GetVehicles([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _customerService.GetVehiclesAsync(customerId.Value, page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("vehicles")]
    public async Task<IActionResult> AddVehicle(CreateVehicleDto request)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _customerService.AddVehicleAsync(customerId.Value, request);
        if (!result.IsSuccess)
        {
            return BadRequest(result.Error);
        }

        _logger.LogInformation("Customer {CustomerId} added vehicle {VehicleId}.", customerId, result.Value!.VehicleId);
        return Ok(result.Value);
    }

    [HttpDelete("vehicles/{id:guid}")]
    public async Task<IActionResult> DeleteVehicle(Guid id)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _customerService.DeleteVehicleAsync(customerId.Value, id);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpGet("loyalty")]
    public async Task<IActionResult> GetLoyalty()
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _loyaltyService.GetLoyaltyStatusAsync(customerId.Value);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var customerId = GetPrincipalId();
        if (customerId is null)
        {
            return Unauthorized();
        }

        var result = await _customerService.GetNotificationsAsync(customerId.Value, page, pageSize);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("vouchers")]
    public async Task<IActionResult> GetMyVouchers()
    {
        var customerId = GetPrincipalId();
        if (customerId is null) return Unauthorized();
        var vouchers = await _voucherService.GetCustomerVouchersAsync(customerId.Value);
        return Ok(vouchers);
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> RedeemVoucher(RedeemVoucherRequestDto request)
    {
        var customerId = GetPrincipalId();
        if (customerId is null) return Unauthorized();
        var result = await _voucherService.RedeemAsync(customerId.Value, request.VoucherRuleId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    private Guid? GetPrincipalId()
    {
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("principal_id");

        return Guid.TryParse(rawId, out var principalId) ? principalId : null;
    }
}
