using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data;
using AutoWashPro.BLL.DTOs.Customer;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class LoyaltyService(
    AppDbContext db,
    ILogger<LoyaltyService> logger) : ILoyaltyService
{
    private const int DefaultLedgerPageSize = 50;
    private readonly AppDbContext _db = db;
    private readonly ILogger<LoyaltyService> _logger = logger;

    public async Task<Result<LoyaltyStatusDto>> GetLoyaltyStatusAsync(Guid customerId)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);

        if (customer is null)
        {
            return Result<LoyaltyStatusDto>.Fail("Customer was not found.");
        }

        var ledger = await _db.PointsLedgers
            .AsNoTracking()
            .Where(entry => entry.CustomerId == customerId)
            .OrderByDescending(entry => entry.CreatedAt)
            .Take(DefaultLedgerPageSize)
            .Select(entry => new LedgerEntryDto
            {
                EntryId = entry.EntryId,
                BookingId = entry.BookingId,
                Type = entry.Type,
                Points = entry.Points,
                ExpiryDate = entry.ExpiryDate,
                Note = entry.Note,
                CreatedAt = entry.CreatedAt
            })
            .ToListAsync();

        return Result<LoyaltyStatusDto>.Ok(new LoyaltyStatusDto
        {
            CustomerId = customer.CustomerId,
            PointsBalance = customer.PointsBalance,
            TierId = customer.TierId,
            TierName = customer.TierConfig.TierName,
            TierRank = customer.TierConfig.RankOrder,
            BookingWindowDays = customer.TierConfig.BookingWindowDays,
            PointsPerWash = customer.TierConfig.PointsPerWash,
            LedgerHistory = ledger
        });
    }

    public async Task<Result<bool>> ValidateRedemptionAsync(Guid customerId, int pointsToRedeem)
    {
        if (pointsToRedeem < 0)
        {
            return Result<bool>.Fail("Points to redeem cannot be negative.");
        }

        if (pointsToRedeem == 0)
        {
            return Result<bool>.Ok(true);
        }

        var customer = await _db.Customers.AsNoTracking().SingleOrDefaultAsync(entity => entity.CustomerId == customerId);
        if (customer is null)
        {
            return Result<bool>.Fail("Customer was not found.");
        }

        if (customer.PointsBalance < pointsToRedeem)
        {
            _logger.LogInformation("Customer {CustomerId} attempted to redeem more points than available.", customerId);
            return Result<bool>.Fail("Insufficient points balance.");
        }

        return Result<bool>.Ok(true);
    }
}
