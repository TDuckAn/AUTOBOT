using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Admin;
using AutoWashPro.BLL.DTOs.Booking;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface IPromotionService
{
    Task<Result<PagedResultDto<PromotionDto>>> GetPromotionsAsync(bool includeInactive, int page, int pageSize);
    Task<Result<PromotionDto>> GetPromotionAsync(Guid promotionId);
    Task<Result<PromotionDto>> CreatePromotionAsync(CreatePromotionDto request);
    Task<Result<PromotionDto>> UpdatePromotionAsync(Guid promotionId, CreatePromotionDto request);
    Task<Result<bool>> DeletePromotionAsync(Guid promotionId);
    Task<Result<bool>> ValidatePromotionEligibilityAsync(Guid promotionId, Guid customerId, DateTime scheduledAt);
}
