using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Customer;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface ILoyaltyService
{
    Task<Result<LoyaltyStatusDto>> GetLoyaltyStatusAsync(Guid customerId);
    Task<Result<bool>> ValidateRedemptionAsync(Guid customerId, int pointsToRedeem);
}
