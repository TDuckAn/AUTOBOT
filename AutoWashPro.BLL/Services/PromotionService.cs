using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.Common.Extensions;
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
    private readonly AppDbContext _db = db;
    private readonly ILogger<PromotionService> _logger = logger;

    public async Task<Result<PagedResultDto<PromotionDto>>> GetPromotionsAsync(bool includeInactive, int page, int pageSize)
    {
        var query = _db.Promotions
            .AsNoTracking()
            .Include(promotion => promotion.MinTier)
            .Include(promotion => promotion.MaxTier)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(promotion => promotion.IsActive);
        }

        var ordered = query.OrderByDescending(promotion => promotion.CreatedAt);
        return Result<PagedResultDto<PromotionDto>>.Ok(await ordered.ToPagedResultAsync(page, pageSize, ToDto));
    }

    public async Task<Result<PagedResultDto<PromotionDto>>> GetAvailablePromotionsAsync(Guid customerId, int page, int pageSize)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);

        if (customer is null)
        {
            return Result<PagedResultDto<PromotionDto>>.Fail("Customer was not found.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var baseQuery = _db.Promotions
            .AsNoTracking()
            .Include(promotion => promotion.MinTier)
            .Include(promotion => promotion.MaxTier)
            .Where(promotion =>
                promotion.IsActive
                && promotion.StartDate <= today
                && promotion.EndDate >= today
                && promotion.MinTier.RankOrder <= customer.TierConfig.RankOrder
                && (promotion.MaxTierId == null || promotion.MaxTier!.RankOrder >= customer.TierConfig.RankOrder));

        var usageStats = await _db.Bookings
            .AsNoTracking()
            .Where(booking =>
                booking.PromotionId != null
                && booking.Status != BookingStatus.Cancelled)
            .GroupBy(booking => booking.PromotionId!.Value)
            .Select(group => new
            {
                PromotionId = group.Key,
                TotalUsage = group.Count(),
                CustomerUsage = group.Count(booking => booking.CustomerId == customerId)
            })
            .ToDictionaryAsync(item => item.PromotionId);

        var promotions = await baseQuery
            .OrderByDescending(promotion => promotion.CreatedAt)
            .ToListAsync();

        var filtered = promotions
            .Where(promotion =>
            {
                if (!usageStats.TryGetValue(promotion.PromotionId, out var usage))
                {
                    return true;
                }

                if (promotion.UsageLimitPerCustomer.HasValue && usage.CustomerUsage >= promotion.UsageLimitPerCustomer.Value)
                {
                    return false;
                }

                if (promotion.TotalUsageLimit.HasValue && usage.TotalUsage >= promotion.TotalUsageLimit.Value)
                {
                    return false;
                }

                return true;
            })
            .ToList();

        var totalCount = filtered.Count;
        var items = filtered
            .Skip(Math.Max(0, (page - 1) * pageSize))
            .Take(pageSize)
            .Select(ToDto)
            .ToList();

        return Result<PagedResultDto<PromotionDto>>.Ok(new PagedResultDto<PromotionDto>
        {
            Items = items,
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
            .Include(entity => entity.MaxTier)
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
            MaxTierId = request.MaxTierId,
            RewardType = request.RewardType,
            RewardValue = request.RewardValue,
            IsStackable = request.IsStackable,
            UsageLimitPerCustomer = request.UsageLimitPerCustomer,
            TotalUsageLimit = request.TotalUsageLimit,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.Promotions.Add(promotion);
        await _db.SaveChangesAsync();

        promotion.MinTier = (await _db.TierConfigs.FindAsync(promotion.MinTierId))!;
        promotion.MaxTier = promotion.MaxTierId.HasValue
            ? await _db.TierConfigs.FindAsync(promotion.MaxTierId.Value)
            : null;
        _logger.LogInformation("Created promotion {PromotionId}.", promotion.PromotionId);
        return Result<PromotionDto>.Ok(ToDto(promotion));
    }

    public async Task<Result<PromotionDto>> UpdatePromotionAsync(Guid promotionId, CreatePromotionDto request)
    {
        var promotion = await _db.Promotions
            .Include(entity => entity.MinTier)
            .Include(entity => entity.MaxTier)
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
        promotion.MaxTierId = request.MaxTierId;
        promotion.RewardType = request.RewardType;
        promotion.RewardValue = request.RewardValue;
        promotion.IsStackable = request.IsStackable;
        promotion.UsageLimitPerCustomer = request.UsageLimitPerCustomer;
        promotion.TotalUsageLimit = request.TotalUsageLimit;
        promotion.IsActive = request.IsActive;

        await _db.SaveChangesAsync();
        promotion.MinTier = (await _db.TierConfigs.FindAsync(promotion.MinTierId))!;
        promotion.MaxTier = promotion.MaxTierId.HasValue
            ? await _db.TierConfigs.FindAsync(promotion.MaxTierId.Value)
            : null;

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

        if (promotion.MaxTierId.HasValue)
        {
            var maxTier = await _db.TierConfigs
                .AsNoTracking()
                .SingleOrDefaultAsync(tier => tier.TierId == promotion.MaxTierId.Value);
            if (maxTier is not null && maxTier.RankOrder < customer.TierConfig.RankOrder)
            {
                return Result<bool>.Fail("Customer tier is not eligible for this promotion.");
            }
        }

        var usageSummary = await _db.Bookings
            .AsNoTracking()
            .Where(booking =>
                booking.PromotionId == promotionId
                && booking.Status != BookingStatus.Cancelled)
            .GroupBy(_ => 1)
            .Select(group => new
            {
                TotalUsage = group.Count(),
                CustomerUsage = group.Count(booking => booking.CustomerId == customerId)
            })
            .SingleOrDefaultAsync();

        if (promotion.UsageLimitPerCustomer.HasValue
            && (usageSummary?.CustomerUsage ?? 0) >= promotion.UsageLimitPerCustomer.Value)
        {
            return Result<bool>.Fail("You have reached the usage limit for this promotion.");
        }

        if (promotion.TotalUsageLimit.HasValue
            && (usageSummary?.TotalUsage ?? 0) >= promotion.TotalUsageLimit.Value)
        {
            return Result<bool>.Fail("This promotion has reached its total redemption limit.");
        }

        return Result<bool>.Ok(true);
    }

    private async Task<string?> ValidatePromotionRequestAsync(CreatePromotionDto request)
    {
        if (request.StartDate > request.EndDate)
        {
            return "Start date must be on or before end date.";
        }

        var minTier = await _db.TierConfigs.AsNoTracking().SingleOrDefaultAsync(tier => tier.TierId == request.MinTierId);
        if (minTier is null)
        {
            return "Minimum tier was not found.";
        }

        if (request.MaxTierId.HasValue)
        {
            var maxTier = await _db.TierConfigs.AsNoTracking().SingleOrDefaultAsync(tier => tier.TierId == request.MaxTierId.Value);
            if (maxTier is null)
            {
                return "Maximum tier was not found.";
            }

            if (maxTier.RankOrder < minTier.RankOrder)
            {
                return "Maximum tier must rank at or above the minimum tier.";
            }
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
            MaxTierId = promotion.MaxTierId,
            MaxTierName = promotion.MaxTier?.TierName,
            RewardType = promotion.RewardType,
            RewardValue = promotion.RewardValue,
            IsStackable = promotion.IsStackable,
            UsageLimitPerCustomer = promotion.UsageLimitPerCustomer,
            TotalUsageLimit = promotion.TotalUsageLimit,
            IsActive = promotion.IsActive,
            CreatedAt = promotion.CreatedAt
        };
    }
}
