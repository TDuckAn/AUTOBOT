using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Controllers.Admin;

[ApiController]
[Authorize(Policy = "AdminOnly")]
[Route("api/admin/reports")]
public class AdminReportController(
    AppDbContext db,
    IConfiguration configuration,
    ILogger<AdminReportController> logger) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<AdminReportController> _logger = logger;

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateOnly? date = null)
    {
        var reportDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var dayStart = reportDate.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);

        var completedBookings = _db.Bookings
            .AsNoTracking()
            .Where(booking =>
                booking.CompletedAt >= dayStart
                && booking.CompletedAt < dayEnd
                && booking.Status == BookingStatus.Completed);

        var washVolume = await completedBookings.CountAsync();
        var revenue = await completedBookings.SumAsync(booking => booking.FinalPrice);
        var activeCustomers = await completedBookings
            .Where(booking => booking.CustomerId.HasValue)
            .Select(booking => booking.CustomerId)
            .Distinct()
            .CountAsync();

        var utilisation = await CalculateSlotUtilisationAsync(dayStart, dayEnd);

        _logger.LogDebug("Generated summary report for {ReportDate}.", reportDate);
        return Ok(new ReportSummaryDto
        {
            Date = reportDate,
            DailyWashVolume = washVolume,
            Revenue = revenue,
            ActiveCustomers = activeCustomers,
            SlotUtilisationPercent = utilisation
        });
    }

    [HttpGet("tier-review")]
    public async Task<IActionResult> GetTierReview()
    {
        var distribution = await _db.TierConfigs
            .AsNoTracking()
            .OrderBy(tier => tier.RankOrder)
            .Select(tier => new TierDistributionDto
            {
                TierId = tier.TierId,
                TierName = tier.TierName,
                RankOrder = tier.RankOrder,
                CustomerCount = tier.Customers.Count
            })
            .ToListAsync();

        return Ok(new TierReviewReportDto
        {
            GeneratedAt = DateTime.UtcNow,
            Note = "Tier change history is not persisted until the Phase 6 maintenance job is implemented.",
            TierDistribution = distribution
        });
    }

    private async Task<decimal> CalculateSlotUtilisationAsync(DateTime dayStart, DateTime dayEnd)
    {
        var slotDurationMinutes = _configuration.GetValue("BookingSettings:SlotDurationMinutes", 30);
        var maxCapacityPerSlot = _configuration.GetValue("BookingSettings:MaxCapacityPerSlot", 4);
        if (slotDurationMinutes <= 0 || maxCapacityPerSlot <= 0)
        {
            return 0;
        }

        var totalSlots = (int)((dayEnd - dayStart).TotalMinutes / slotDurationMinutes);
        var denominator = totalSlots * maxCapacityPerSlot;
        if (denominator == 0)
        {
            return 0;
        }

        var usedCapacity = 0;
        for (var slotStart = dayStart; slotStart < dayEnd; slotStart = slotStart.AddMinutes(slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(slotDurationMinutes);
            usedCapacity += await _db.Bookings.CountAsync(booking =>
                booking.Status != BookingStatus.Cancelled
                && booking.ScheduledAt < slotEnd
                && booking.ExpectedEndAt > slotStart);
        }

        return Math.Round((decimal)usedCapacity / denominator * 100m, 2);
    }
}
