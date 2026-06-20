using AutoWashPro.BLL.DTOs.Auth;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AutoWashPro.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService authService,
    ILogger<AuthController> logger) : ControllerBase
{
    private readonly IAuthService _authService = authService;
    private readonly ILogger<AuthController> _logger = logger;

    [HttpPost("customer/register")]
    public async Task<IActionResult> RegisterCustomer(CustomerRegisterRequestDto request)
    {
        _logger.LogInformation("Customer registration requested for phone ending {PhoneSuffix}.", GetPhoneSuffix(request.PhoneNumber));

        var result = await _authService.RegisterCustomerAsync(request);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("customer/login")]
    public async Task<IActionResult> LoginCustomer(CustomerLoginRequestDto request)
    {
        var result = await _authService.LoginCustomerAsync(request);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }

    [HttpPost("system/login")]
    public async Task<IActionResult> LoginSystemUser(SystemLoginRequestDto request)
    {
        var result = await _authService.LoginSystemUserAsync(request);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }

    private static string GetPhoneSuffix(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return "unknown";
        }

        var trimmed = phoneNumber.Trim();
        return trimmed.Length <= 4 ? trimmed : trimmed[^4..];
    }
}
