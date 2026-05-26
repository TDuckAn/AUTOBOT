using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Admin;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class PromotionService(
    AppDbContext db,
    ILogger<PromotionService> logger) : IPromotionService
{
    private const int MaxPageSize = 100;
    private readonly AppDbContext _db = db;
    private readonly ILogger<PromotionService> _logger = logger;

    public async Task<Result<PagedResultDto<PromotionDto>>> GetPromotionsAsync(bool includeInactive, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var query = _db.Promotions
            .AsNoTracking()
            .Include(promotion => promotion.MinTier)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(promotion => promotion.IsActive);
        }

        var totalCount = await query.CountAsync();
        var promotions = await query
            .OrderByDescending(promotion => promotion.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(promotion => ToDto(promotion))
            .ToListAsync();

        return Result<PagedResultDto<PromotionDto>>.Ok(new PagedResultDto<PromotionDto>
        {
            Items = promotions,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        });
    }

    public async Task<Result<PromotionDto>> GetPromotionAsync(Guid promotionId)
    {
        var promotion = await _db.Promotions
            .AsNoTracking()
            .Include(entity => entity.MinTier)
            .SingleOrDefaultAsync(entity => entity.PromotionId == promotionId);

        return promotion is null
            ? Result<PromotionDto>.Fail("Promotion was not found.")
            : Result<PromotionDto>.Ok(ToDto(promotion));
    }

    public async Task<Result<PromotionDto>> CreatePromotionAsync(CreatePromotionDto request)
    {
        var validationError = await ValidatePromotionRequestAsync(request);
        if (validationError is not null)
        {
            return Result<PromotionDto>.Fail(validationError);
        }

        var promotion = new Promotion
        {
            PromotionId = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = NormalizeOptionalText(request.Description),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MinTierId = request.MinTierId,
            RewardType = request.RewardType,
            RewardValue = request.RewardValue,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.Promotions.Add(promotion);
        await _db.SaveChangesAsync();

        promotion.MinTier = (await _db.TierConfigs.FindAsync(promotion.MinTierId))!;
        _logger.LogInformation("Created promotion {PromotionId}.", promotion.PromotionId);
        return Result<PromotionDto>.Ok(ToDto(promotion));
    }

    public async Task<Result<PromotionDto>> UpdatePromotionAsync(Guid promotionId, CreatePromotionDto request)
    {
        var promotion = await _db.Promotions
            .Include(entity => entity.MinTier)
            .SingleOrDefaultAsync(entity => entity.PromotionId == promotionId);

        if (promotion is null)
        {
            return Result<PromotionDto>.Fail("Promotion was not found.");
        }

        var validationError = await ValidatePromotionRequestAsync(request);
        if (validationError is not null)
        {
            return Result<PromotionDto>.Fail(validationError);
        }

        promotion.Name = request.Name.Trim();
        promotion.Description = NormalizeOptionalText(request.Description);
        promotion.StartDate = request.StartDate;
        promotion.EndDate = request.EndDate;
        promotion.MinTierId = request.MinTierId;
        promotion.RewardType = request.RewardType;
        promotion.RewardValue = request.RewardValue;
        promotion.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        promotion.MinTier = (await _db.TierConfigs.FindAsync(promotion.MinTierId))!;

        _logger.LogInformation("Updated promotion {PromotionId}.", promotion.PromotionId);
        return Result<PromotionDto>.Ok(ToDto(promotion));
    }

    public async Task<Result<bool>> DeletePromotionAsync(Guid promotionId)
    {
        var promotion = await _db.Promotions.SingleOrDefaultAsync(entity => entity.PromotionId == promotionId);
        if (promotion is null)
        {
            return Result<bool>.Fail("Promotion was not found.");
        }

        var hasBookings = await _db.Bookings.AnyAsync(booking => booking.PromotionId == promotionId);
        if (hasBookings)
        {
            promotion.IsActive = false;
        }
        else
        {
            _db.Promotions.Remove(promotion);
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Deleted or deactivated promotion {PromotionId}.", promotionId);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> ValidatePromotionEligibilityAsync(Guid promotionId, Guid customerId, DateTime scheduledAt)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);

        if (customer is null)
        {
            return Result<bool>.Fail("Customer was not found.");
        }

        var scheduledDate = DateOnly.FromDateTime(scheduledAt);
        var promotion = await _db.Promotions
            .AsNoTracking()
            .Include(entity => entity.MinTier)
            .SingleOrDefaultAsync(entity => entity.PromotionId == promotionId);

        if (promotion is null || !promotion.IsActive)
        {
            return Result<bool>.Fail("Promotion was not found.");
        }

        if (promotion.StartDate > scheduledDate || promotion.EndDate < scheduledDate)
        {
            return Result<bool>.Fail("Promotion is outside its active date range.");
        }

        if (promotion.MinTier.RankOrder > customer.TierConfig.RankOrder)
        {
            return Result<bool>.Fail("Customer tier is not eligible for this promotion.");
        }

        return Result<bool>.Ok(true);
    }

    private async Task<string?> ValidatePromotionRequestAsync(CreatePromotionDto request)
    {
        if (request.StartDate > request.EndDate)
        {
            return "Start date must be on or before end date.";
        }

        var minTierExists = await _db.TierConfigs.AnyAsync(tier => tier.TierId == request.MinTierId);
        if (!minTierExists)
        {
            return "Minimum tier was not found.";
        }

        if (request.RewardType != RewardType.FreeWash && request.RewardValue <= 0)
        {
            return "Reward value must be greater than zero.";
        }

        return null;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static PromotionDto ToDto(Promotion promotion)
    {
        return new PromotionDto
        {
            PromotionId = promotion.PromotionId,
            Name = promotion.Name,
            Description = promotion.Description,
            StartDate = promotion.StartDate,
            EndDate = promotion.EndDate,
            MinTierId = promotion.MinTierId,
            MinTierName = promotion.MinTier.TierName,
            RewardType = promotion.RewardType,
            RewardValue = promotion.RewardValue,
            IsActive = promotion.IsActive,
            CreatedAt = promotion.CreatedAt
        };
    }
}
