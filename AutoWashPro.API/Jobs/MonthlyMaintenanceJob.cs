using System.Collections.Concurrent;
using System.Data;
using AutoWashPro.API.Data;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Jobs;

public class MonthlyMaintenanceJob(
    IServiceScopeFactory scopeFactory,
    ILogger<MonthlyMaintenanceJob> logger) : BackgroundService
{
    private const string LastMonthlyRunKey = "maintenance:last-monthly-run";
    private static readonly ConcurrentDictionary<string, bool> InMemoryMonthlyRuns = new();
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
    private readonly ILogger<MonthlyMaintenanceJob> _logger = logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.WhenAll(
            RunNearExpiryLoopAsync(stoppingToken),
            RunMonthlyLoopAsync(stoppingToken));
    }

    private async Task RunNearExpiryLoopAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunNearExpiryScanAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Monthly maintenance worker failed.");
            }

            await Task.Delay(GetDelayToNextDailyScan(), stoppingToken);
        }
    }

    private async Task RunMonthlyLoopAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                if (today.Day == 1)
                {
                    await RunMonthlyMaintenanceIfNeededAsync(today, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Monthly maintenance run failed.");
            }

            var delay = GetDelayToNextMonthlyRun(DateTime.UtcNow);
            if (delay <= TimeSpan.Zero)
            {
                delay = TimeSpan.FromDays(1);
            }

            await Task.Delay(delay, stoppingToken);
        }
    }

    internal static TimeSpan GetDelayToNextMonthlyRun(DateTime utcNow)
    {
        var nextMonth = utcNow.Day == 1 && utcNow.TimeOfDay == TimeSpan.Zero
            ? new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc)
            : new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);

        if (utcNow.Day == 1 && utcNow.TimeOfDay > TimeSpan.Zero)
        {
            nextMonth = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
        }

        return nextMonth - utcNow;
    }

    private static TimeSpan GetDelayToNextDailyScan()
    {
        var now = DateTime.UtcNow;
        var nextMidnight = now.Date.AddDays(1);
        return nextMidnight - now;
    }

    private async Task RunMonthlyMaintenanceIfNeededAsync(DateOnly today, CancellationToken cancellationToken)
    {
        var runMonth = $"{today.Year:D4}-{today.Month:D2}";
        if (!InMemoryMonthlyRuns.TryAdd(runMonth, true))
        {
            _logger.LogInformation("Monthly maintenance already ran in memory for {RunMonth}.", runMonth);
            return;
        }

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var lastRun = await db.SystemConfigs.SingleOrDefaultAsync(config => config.Key == LastMonthlyRunKey, cancellationToken);
        if (lastRun?.Value == runMonth)
        {
            _logger.LogInformation("Monthly maintenance already persisted for {RunMonth}.", runMonth);
            return;
        }

        await RunPointExpiryAsync(db, today, runMonth, cancellationToken);
        await RunTierReviewAsync(db, today, cancellationToken);

        if (lastRun is null)
        {
            db.SystemConfigs.Add(new SystemConfig
            {
                Key = LastMonthlyRunKey,
                Value = runMonth,
                UpdatedAt = DateTime.UtcNow
            });
        }
        else
        {
            lastRun.Value = runMonth;
            lastRun.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Monthly maintenance completed for {RunMonth}.", runMonth);
    }

    private async Task RunPointExpiryAsync(
        AppDbContext db,
        DateOnly today,
        string runMonth,
        CancellationToken cancellationToken)
    {
        var customerIds = await db.Customers
            .Where(customer => customer.PhoneNumber != "WALK-IN")
            .Select(customer => customer.CustomerId)
            .ToListAsync(cancellationToken);

        foreach (var customerId in customerIds)
        {
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            var customer = await db.Customers.SingleOrDefaultAsync(entity => entity.CustomerId == customerId, cancellationToken);
            if (customer is null)
            {
                await tx.RollbackAsync(cancellationToken);
                continue;
            }

            var expiredEarnedPoints = await db.PointsLedgers
                .Where(entry =>
                    entry.CustomerId == customerId
                    && entry.Type == LedgerEntryType.Earn
                    && entry.ExpiryDate <= today)
                .SumAsync(entry => (int?)entry.Points, cancellationToken) ?? 0;

            var consumedPoints = await db.PointsLedgers
                .Where(entry =>
                    entry.CustomerId == customerId
                    && (entry.Type == LedgerEntryType.Redeem || entry.Type == LedgerEntryType.Expire))
                .SumAsync(entry => (int?)-entry.Points, cancellationToken) ?? 0;

            var pointsToExpire = Math.Min(customer.PointsBalance, Math.Max(0, expiredEarnedPoints - consumedPoints));
            if (pointsToExpire > 0)
            {
                var now = DateTime.UtcNow;
                db.PointsLedgers.Add(new PointsLedger
                {
                    EntryId = Guid.NewGuid(),
                    CustomerId = customerId,
                    BookingId = null,
                    Type = LedgerEntryType.Expire,
                    Points = -pointsToExpire,
                    ExpiryDate = today,
                    Note = $"Monthly expiry {runMonth}",
                    CreatedAt = now,
                    NearExpiryNotified = false
                });

                customer.PointsBalance -= pointsToExpire;
                customer.UpdatedAt = now;

                db.Notifications.Add(new Notification
                {
                    NotificationId = Guid.NewGuid(),
                    CustomerId = customerId,
                    Title = "Points expired",
                    Message = $"{pointsToExpire} points expired from your loyalty balance.",
                    Type = NotificationType.PointsExpiry,
                    IsRead = false,
                    CreatedAt = now
                });
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
    }

    private async Task RunTierReviewAsync(AppDbContext db, DateOnly today, CancellationToken cancellationToken)
    {
        var customerIds = await db.Customers
            .Where(customer => customer.PhoneNumber != "WALK-IN")
            .Select(customer => customer.CustomerId)
            .ToListAsync(cancellationToken);

        var tiers = await db.TierConfigs
            .OrderByDescending(tier => tier.RankOrder)
            .ToListAsync(cancellationToken);

        var reviewEnd = today.ToDateTime(TimeOnly.MinValue).AddDays(1);
        var reviewStart = reviewEnd.AddDays(-30);

        foreach (var customerId in customerIds)
        {
            await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            var customer = await db.Customers
                .Include(entity => entity.TierConfig)
                .SingleOrDefaultAsync(entity => entity.CustomerId == customerId, cancellationToken);
            if (customer is null)
            {
                await tx.RollbackAsync(cancellationToken);
                continue;
            }

            var completedBookings = db.Bookings.Where(booking =>
                booking.CustomerId == customerId
                && booking.Status == BookingStatus.Completed
                && booking.CompletedAt >= reviewStart
                && booking.CompletedAt < reviewEnd);

            var visitCount = await completedBookings.CountAsync(cancellationToken);
            var spend = await completedBookings.SumAsync(booking => (decimal?)booking.FinalPrice, cancellationToken) ?? 0m;
            var eligibleTier = tiers.First(tier =>
                visitCount >= tier.MinVisitsPerMonth
                && spend >= tier.MinSpendPerMonth);

            if (eligibleTier.TierId != customer.TierId)
            {
                var now = DateTime.UtcNow;
                var oldTier = customer.TierConfig.TierName;
                customer.TierId = eligibleTier.TierId;
                customer.TierConfig = eligibleTier;
                customer.UpdatedAt = now;

                db.Notifications.Add(new Notification
                {
                    NotificationId = Guid.NewGuid(),
                    CustomerId = customerId,
                    Title = "Tier updated",
                    Message = $"Your tier changed from {oldTier} to {eligibleTier.TierName}.",
                    Type = NotificationType.TierChange,
                    IsRead = false,
                    CreatedAt = now
                });
            }

            await db.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);
        }
    }

    private async Task RunNearExpiryScanAsync(CancellationToken cancellationToken)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var warningEnd = today.AddDays(30);

        var entries = await db.PointsLedgers
            .Include(entry => entry.Customer)
            .Where(entry =>
                entry.Type == LedgerEntryType.Earn
                && !entry.NearExpiryNotified
                && entry.ExpiryDate >= today
                && entry.ExpiryDate <= warningEnd
                && entry.Customer.PointsBalance > 0)
            .ToListAsync(cancellationToken);

        foreach (var entry in entries)
        {
            entry.NearExpiryNotified = true;
            db.Notifications.Add(new Notification
            {
                NotificationId = Guid.NewGuid(),
                CustomerId = entry.CustomerId,
                Title = "Points expiring soon",
                Message = $"{entry.Points} points are scheduled to expire on {entry.ExpiryDate:yyyy-MM-dd}.",
                Type = NotificationType.PointsExpiry,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (entries.Count > 0)
        {
            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Created {NotificationCount} near-expiry point notifications.", entries.Count);
        }
    }
}
