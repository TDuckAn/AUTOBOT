using System.Data;
using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Checkout;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class CheckoutService(
    AppDbContext db,
    IConfiguration configuration,
    INotificationService notificationService,
    ILogger<CheckoutService> logger) : ICheckoutService
{
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _configuration = configuration;
    private readonly INotificationService _notificationService = notificationService;
    private readonly ILogger<CheckoutService> _logger = logger;
    private readonly int _pointValueInVnd = configuration.GetValue("BookingSettings:PointValueInVND", 100);

    public async Task<Result<CheckoutSummaryDto>> CompleteBookingAsync(Guid bookingId, CompleteBookingRequestDto request)
    {
        if (request.PointsToRedeem < 0)
        {
            return Result<CheckoutSummaryDto>.Fail("Points to redeem cannot be negative.");
        }

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var booking = await _db.Bookings
            .Include(entity => entity.Customer)
            .ThenInclude(customer => customer!.TierConfig)
            .Include(entity => entity.Pricing)
            .ThenInclude(pricing => pricing.Service)
            .Include(entity => entity.Promotion)
            .Include(entity => entity.Voucher)
            .SingleOrDefaultAsync(entity => entity.BookingId == bookingId);

        if (booking is null)
        {
            return Result<CheckoutSummaryDto>.Fail("Booking was not found.");
        }

        if (booking.Status != BookingStatus.Confirmed)
        {
            return Result<CheckoutSummaryDto>.Fail("Only confirmed bookings can be completed.");
        }

        var promotionId = request.PromotionId ?? booking.PromotionId;
        var promotion = promotionId.HasValue
            ? await GetUsablePromotionAsync(promotionId.Value, booking.Customer, booking.ScheduledAt)
            : null;

        if (promotionId.HasValue && promotion is null)
        {
            return Result<CheckoutSummaryDto>.Fail("Promotion is not valid for this booking.");
        }

        // BR (db-review 3.4): enforce promotion usage limits for registered customers.
        if (promotion is not null && booking.CustomerId is Guid promoCustomerId)
        {
            var usageError = await ValidatePromotionUsageLimitsAsync(promotion, promoCustomerId, booking.BookingId);
            if (usageError is not null)
            {
                return Result<CheckoutSummaryDto>.Fail(usageError);
            }
        }

        // db-review 3.1/3.2: resolve the voucher the customer wants to apply.
        var voucherId = request.VoucherId ?? booking.VoucherId;
        CustomerVoucher? voucher = null;
        if (voucherId.HasValue)
        {
            voucher = await GetUsableVoucherAsync(voucherId.Value, booking.CustomerId, booking.BookingId);
            if (voucher is null)
            {
                return Result<CheckoutSummaryDto>.Fail("Voucher is not valid for this booking.");
            }

            // db-review 3.3: a voucher can only stack with a stackable promotion.
            if (promotion is not null && !promotion.IsStackable)
            {
                return Result<CheckoutSummaryDto>.Fail("Voucher cannot be combined with this promotion.");
            }
        }

        var basePrice = booking.BasePrice > 0 ? booking.BasePrice : booking.Pricing.Price;
        var promoDiscount = CalculatePromotionDiscount(promotion, basePrice);
        // db-review 3.3: BasePrice -> Promotion -> Voucher, each capped at the remaining amount.
        var voucherDiscount = voucher is null ? 0m : Math.Min(voucher.DiscountAmount, Math.Max(0, basePrice - promoDiscount));
        var pointsDiscount = CalculatePointsDiscount(request.PointsToRedeem);
        var pointsEarned = CalculatePointsEarned(booking.Customer?.TierConfig, promotion);

        if (booking.CustomerId is null && request.PointsToRedeem > 0)
        {
            return Result<CheckoutSummaryDto>.Fail("Walk-in bookings without a customer cannot redeem points.");
        }

        if (booking.Customer is not null && request.PointsToRedeem > booking.Customer.PointsBalance)
        {
            return Result<CheckoutSummaryDto>.Fail("Insufficient points balance.");
        }

        var finalPrice = Math.Max(0, basePrice - promoDiscount - voucherDiscount - pointsDiscount);
        var completedAt = DateTime.UtcNow;

        booking.PromotionId = promotion?.PromotionId;
        booking.VoucherId = voucher?.VoucherId;
        booking.BasePrice = basePrice;
        booking.FinalPrice = finalPrice;
        booking.PointsRedeemed = request.PointsToRedeem;
        booking.PointsEarned = pointsEarned;
        booking.CompletedAt = completedAt;
        booking.Status = BookingStatus.Completed;
        booking.PerksApplied = promotion is null ? null : $"{promotion.RewardType}:{promotion.RewardValue}";

        // db-review 3.2: stamp the voucher with the booking that consumed it.
        if (voucher is not null)
        {
            voucher.IsUsed = true;
            voucher.UsedInBookingId = booking.BookingId;
        }

        // db-review 3.4: record promotion usage for registered customers.
        if (promotion is not null && booking.CustomerId is Guid usageCustomerId)
        {
            _db.PromotionUsages.Add(new PromotionUsage
            {
                UsageId = Guid.NewGuid(),
                PromotionId = promotion.PromotionId,
                CustomerId = usageCustomerId,
                BookingId = booking.BookingId,
                CreatedAt = completedAt
            });
        }

        int? newPointsBalance = null;
        if (booking.Customer is not null)
        {
            if (request.PointsToRedeem > 0)
            {
                _db.PointsLedgers.Add(new PointsLedger
                {
                    EntryId = Guid.NewGuid(),
                    CustomerId = booking.Customer.CustomerId,
                    BookingId = booking.BookingId,
                    Type = LedgerEntryType.Redeem,
                    Points = -request.PointsToRedeem,
                    ExpiryDate = DateOnly.FromDateTime(completedAt),
                    Note = "Redeemed at checkout",
                    CreatedAt = completedAt,
                    NearExpiryNotified = false
                });
            }

            if (pointsEarned > 0)
            {
                _db.PointsLedgers.Add(new PointsLedger
                {
                    EntryId = Guid.NewGuid(),
                    CustomerId = booking.Customer.CustomerId,
                    BookingId = booking.BookingId,
                    Type = LedgerEntryType.Earn,
                    Points = pointsEarned,
                    ExpiryDate = DateOnly.FromDateTime(completedAt.AddMonths(12)),
                    Note = "Earned from completed booking",
                    CreatedAt = completedAt,
                    NearExpiryNotified = false
                });
            }

            booking.Customer.PointsBalance = booking.Customer.PointsBalance - request.PointsToRedeem + pointsEarned;
            booking.Customer.UpdatedAt = completedAt;
            newPointsBalance = booking.Customer.PointsBalance;
        }

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        if (booking.CustomerId.HasValue)
        {
            await _notificationService.CreateNotificationAsync(
                booking.CustomerId.Value,
                "Booking completed",
                $"Your booking is completed. You earned {pointsEarned} points.",
                NotificationType.BookingUpdate);
        }

        _logger.LogInformation("Completed booking {BookingId}.", booking.BookingId);
        return Result<CheckoutSummaryDto>.Ok(new CheckoutSummaryDto
        {
            BookingId = booking.BookingId,
            CustomerId = booking.CustomerId,
            BasePrice = basePrice,
            PromotionDiscount = promoDiscount,
            VoucherDiscount = voucherDiscount,
            VoucherId = voucher?.VoucherId,
            PointsDiscount = pointsDiscount,
            FinalPrice = finalPrice,
            PointsRedeemed = request.PointsToRedeem,
            PointsEarned = pointsEarned,
            NewPointsBalance = newPointsBalance,
            CompletedAt = completedAt
        });
    }

    private async Task<Promotion?> GetUsablePromotionAsync(Guid promotionId, Customer? customer, DateTime scheduledAt)
    {
        var scheduledDate = DateOnly.FromDateTime(scheduledAt);
        var promotion = await _db.Promotions
            .Include(entity => entity.MinTier)
            .Include(entity => entity.MaxTier)
            .SingleOrDefaultAsync(entity =>
                entity.PromotionId == promotionId
                && entity.IsActive
                && entity.StartDate <= scheduledDate
                && entity.EndDate >= scheduledDate);

        if (promotion is null)
        {
            return null;
        }

        var customerRank = customer?.TierConfig.RankOrder ?? 1;
        if (promotion.MinTier.RankOrder > customerRank)
        {
            return null;
        }

        // db-review 3.4: optional upper tier bound.
        if (promotion.MaxTier is not null && promotion.MaxTier.RankOrder < customerRank)
        {
            return null;
        }

        return promotion;
    }

    private async Task<string?> ValidatePromotionUsageLimitsAsync(Promotion promotion, Guid customerId, Guid bookingId)
    {
        var usageSummary = await _db.Bookings
            .AsNoTracking()
            .Where(booking =>
                booking.PromotionId == promotion.PromotionId
                && booking.Status != BookingStatus.Cancelled
                && booking.BookingId != bookingId)
            .GroupBy(_ => 1)
            .Select(group => new
            {
                TotalUsage = group.Count(),
                CustomerUsage = group.Count(booking => booking.CustomerId == customerId)
            })
            .SingleOrDefaultAsync();

        if (promotion.UsageLimitPerCustomer is int perCustomer
            && (usageSummary?.CustomerUsage ?? 0) >= perCustomer)
        {
            return "You have reached the usage limit for this promotion.";
        }

        if (promotion.TotalUsageLimit is int total
            && (usageSummary?.TotalUsage ?? 0) >= total)
        {
            return "This promotion has reached its total redemption limit.";
        }

        return null;
    }

    private async Task<CustomerVoucher?> GetUsableVoucherAsync(Guid voucherId, Guid? customerId, Guid bookingId)
    {
        if (customerId is null)
        {
            return null;
        }

        var reservedByOtherBooking = await _db.Bookings.AnyAsync(booking =>
            booking.VoucherId == voucherId
            && booking.BookingId != bookingId
            && booking.Status != BookingStatus.Cancelled);

        if (reservedByOtherBooking)
        {
            return null;
        }

        return await _db.CustomerVouchers.SingleOrDefaultAsync(voucher =>
            voucher.VoucherId == voucherId
            && voucher.CustomerId == customerId
            && (!voucher.IsUsed || voucher.UsedInBookingId == bookingId));
    }

    private static decimal CalculatePromotionDiscount(Promotion? promotion, decimal basePrice)
    {
        return promotion?.RewardType switch
        {
            RewardType.Discount => promotion.RewardValue,
            RewardType.FreeWash => basePrice,
            RewardType.BonusPoints => 0m,
            _ => 0m
        };
    }

    private decimal CalculatePointsDiscount(int pointsToRedeem)
    {
        return pointsToRedeem * _pointValueInVnd;
    }

    private static int CalculatePointsEarned(TierConfig? tier, Promotion? promotion)
    {
        if (tier is null)
        {
            return 0;
        }

        var bonusPoints = promotion?.RewardType == RewardType.BonusPoints
            ? (int)promotion.RewardValue
            : 0;

        return tier.PointsPerWash + bonusPoints;
    }
}
