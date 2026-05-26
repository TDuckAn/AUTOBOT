using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Auth;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponseDto>> RegisterCustomerAsync(CustomerRegisterRequestDto request);
    Task<Result<AuthResponseDto>> LoginCustomerAsync(CustomerLoginRequestDto request);
    Task<Result<AuthResponseDto>> LoginSystemUserAsync(SystemLoginRequestDto request);
}
