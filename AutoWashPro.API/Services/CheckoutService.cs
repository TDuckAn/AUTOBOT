using System.Data;
using AutoWashPro.API.Common;
using AutoWashPro.API.Data;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.Data.Entities.Enums;
using AutoWashPro.API.DTOs.Checkout;
using AutoWashPro.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Services;

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

        var basePrice = booking.BasePrice > 0 ? booking.BasePrice : booking.Pricing.Price;
        var promoDiscount = CalculatePromotionDiscount(promotion, basePrice);
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

        var finalPrice = Math.Max(0, basePrice - promoDiscount - pointsDiscount);
        var completedAt = DateTime.UtcNow;

        booking.PromotionId = promotion?.PromotionId;
        booking.BasePrice = basePrice;
        booking.FinalPrice = finalPrice;
        booking.PointsRedeemed = request.PointsToRedeem;
        booking.PointsEarned = pointsEarned;
        booking.CompletedAt = completedAt;
        booking.Status = BookingStatus.Completed;
        booking.PerksApplied = promotion is null ? null : $"{promotion.RewardType}:{promotion.RewardValue}";

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
        return promotion.MinTier.RankOrder <= customerRank ? promotion : null;
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
