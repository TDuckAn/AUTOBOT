using AutoWashPro.API.Common;
using AutoWashPro.API.DTOs.Customer;

namespace AutoWashPro.API.Services.Interfaces;

public interface ILoyaltyService
{
    Task<Result<LoyaltyStatusDto>> GetLoyaltyStatusAsync(Guid customerId);
    Task<Result<bool>> ValidateRedemptionAsync(Guid customerId, int pointsToRedeem);
}
