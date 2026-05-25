using AutoWashPro.API.Common;
using AutoWashPro.API.DTOs.Auth;

namespace AutoWashPro.API.Services.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegisterCustomerAsync(CustomerRegisterRequestDto request);
    Task<Result<AuthResponseDto>> LoginCustomerAsync(CustomerLoginRequestDto request);
    Task<Result<AuthResponseDto>> LoginSystemUserAsync(SystemLoginRequestDto request);
}
