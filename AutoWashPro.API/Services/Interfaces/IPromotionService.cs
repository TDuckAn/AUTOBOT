using AutoWashPro.API.Common;
using AutoWashPro.API.DTOs.Admin;
using AutoWashPro.API.DTOs.Booking;

namespace AutoWashPro.API.Services.Interfaces;

public interface IPromotionService
{
    Task<Result<PagedResultDto<PromotionDto>>> GetPromotionsAsync(bool includeInactive, int page, int pageSize);
    Task<Result<PromotionDto>> GetPromotionAsync(Guid promotionId);
    Task<Result<PromotionDto>> CreatePromotionAsync(CreatePromotionDto request);
    Task<Result<PromotionDto>> UpdatePromotionAsync(Guid promotionId, CreatePromotionDto request);
    Task<Result<bool>> DeletePromotionAsync(Guid promotionId);
    Task<Result<bool>> ValidatePromotionEligibilityAsync(Guid promotionId, Guid customerId, DateTime scheduledAt);
}
