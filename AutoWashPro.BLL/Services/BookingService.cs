using System.Data;
using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.Common.Extensions;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Booking;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class BookingService(
    AppDbContext db,
    IConfiguration configuration,
    ILogger<BookingService> logger) : IBookingService
{
    private const int MaxPageSize = 100;
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<BookingService> _logger = logger;
    private readonly int _slotDurationMinutes = configuration.GetValue("BookingSettings:SlotDurationMinutes", 30);
    private readonly int _maxCapacityPerSlot = configuration.GetValue("BookingSettings:MaxCapacityPerSlot", 4);

    public async Task<Result<bool>> CheckSlotAvailabilityAsync(DateTime scheduledAt, Guid pricingId)
    {
        var pricing = await GetActivePricingAsync(pricingId);
        if (pricing is null)
        {
            return Result<bool>.Fail("Active pricing was not found.");
        }

        var slotStart = scheduledAt.RoundDownToSlot(_slotDurationMinutes);
        var slotEnd = slotStart.AddMinutes(pricing.DurationMinutes);

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var isAvailable = await IsRangeAvailableAsync(slotStart, slotEnd);
        await tx.CommitAsync();

        return Result<bool>.Ok(isAvailable);
    }

    public async Task<Result<IReadOnlyList<AvailabilitySlotDto>>> GetAvailabilityAsync(DateTime date, Guid pricingId)
    {
        var pricing = await GetActivePricingAsync(pricingId);
        if (pricing is null)
        {
            return Result<IReadOnlyList<AvailabilitySlotDto>>.Fail("Active pricing was not found.");
        }

        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);
        var nowSlot = DateTime.UtcNow.RoundDownToSlot(_slotDurationMinutes);
        var slots = new List<AvailabilitySlotDto>();

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        for (var slotStart = dayStart; slotStart < dayEnd; slotStart = slotStart.AddMinutes(_slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(pricing.DurationMinutes);
            var remaining = await GetRemainingCapacityAsync(slotStart, slotEnd);
            var isInFuture = slotStart >= nowSlot;
            slots.Add(new AvailabilitySlotDto
            {
                ScheduledAt = slotStart,
                ExpectedEndAt = slotEnd,
                RemainingCapacity = remaining,
                IsAvailable = isInFuture && remaining > 0
            });
        }

        await tx.CommitAsync();
        return Result<IReadOnlyList<AvailabilitySlotDto>>.Ok(slots);
    }

    public async Task<Result<BookingResponseDto>> CreateBookingAsync(Guid customerId, CreateBookingRequestDto request)
    {
        var scheduledAt = request.ScheduledAt.RoundDownToSlot(_slotDurationMinutes);
        var validation = await ValidateCustomerBookingRequestAsync(customerId, request, scheduledAt);
        if (!validation.IsSuccess)
        {
            return Result<BookingResponseDto>.Fail(validation.Error!);
        }

        var pricing = validation.Value!.Pricing;
        var expectedEndAt = scheduledAt.AddMinutes(pricing.DurationMinutes);

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        if (!await IsRangeAvailableAsync(scheduledAt, expectedEndAt))
        {
            return Result<BookingResponseDto>.Fail("Selected slot is fully booked.");
        }

        var booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerId = customerId,
            VehicleId = request.VehicleId,
            PricingId = request.PricingId,
            PromotionId = request.PromotionId,
            CreatedBy = null,
            ScheduledAt = scheduledAt,
            ExpectedEndAt = expectedEndAt,
            Status = BookingStatus.Confirmed,
            PointsEarned = 0,
            PointsRedeemed = 0,
            BasePrice = pricing.Price,
            FinalPrice = pricing.Price,
            CreatedAt = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        _logger.LogInformation("Created customer booking {BookingId} for customer {CustomerId}.", booking.BookingId, customerId);
        booking.Pricing = pricing;
        return Result<BookingResponseDto>.Ok(ToBookingResponseDto(booking));
    }

    public async Task<Result<BookingResponseDto>> CreateWalkInBookingAsync(Guid systemUserId, CreateWalkInBookingRequestDto request)
    {
        var pricing = await GetActivePricingAsync(request.PricingId);
        if (pricing is null)
        {
            return Result<BookingResponseDto>.Fail("Active pricing was not found.");
        }

        var systemUserExists = await _db.SystemUsers.AnyAsync(user => user.UserId == systemUserId);
        if (!systemUserExists)
        {
            return Result<BookingResponseDto>.Fail("System user was not found.");
        }

        var scheduledAt = request.ScheduledAt.RoundDownToSlot(_slotDurationMinutes);
        var expectedEndAt = scheduledAt.AddMinutes(pricing.DurationMinutes);
        if (scheduledAt < DateTime.UtcNow.RoundDownToSlot(_slotDurationMinutes))
        {
            return Result<BookingResponseDto>.Fail("Scheduled time must be in the future.");
        }

        var phone = request.WalkinPhone.Trim();
        var licensePlate = request.WalkinLicensePlate.Trim();
        if (string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(licensePlate))
        {
            return Result<BookingResponseDto>.Fail("Walk-in phone and license plate are required.");
        }

        var matchedCustomer = await _db.Customers
            .Include(customer => customer.Vehicles)
            .SingleOrDefaultAsync(customer => customer.PhoneNumber == phone);

        var matchedVehicle = matchedCustomer?.Vehicles
            .SingleOrDefault(vehicle => vehicle.LicensePlate == licensePlate);

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        if (!await IsRangeAvailableAsync(scheduledAt, expectedEndAt))
        {
            return Result<BookingResponseDto>.Fail("Selected slot is fully booked.");
        }

        var booking = new Booking
        {
            BookingId = Guid.NewGuid(),
            CustomerId = matchedCustomer?.CustomerId,
            VehicleId = matchedVehicle?.VehicleId,
            PricingId = request.PricingId,
            PromotionId = request.PromotionId,
            CreatedBy = systemUserId,
            ScheduledAt = scheduledAt,
            ExpectedEndAt = expectedEndAt,
            Status = BookingStatus.Confirmed,
            PointsEarned = 0,
            PointsRedeemed = 0,
            WalkinPhone = phone,
            WalkinLicensePlate = licensePlate,
            BasePrice = pricing.Price,
            FinalPrice = pricing.Price,
            CreatedAt = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        _logger.LogInformation("Created walk-in booking {BookingId} by system user {SystemUserId}.", booking.BookingId, systemUserId);
        booking.Pricing = pricing;
        return Result<BookingResponseDto>.Ok(ToBookingResponseDto(booking));
    }

    public async Task<Result<bool>> CancelBookingAsync(Guid customerId, Guid bookingId)
    {
        var booking = await _db.Bookings.SingleOrDefaultAsync(entity =>
            entity.BookingId == bookingId && entity.CustomerId == customerId);

        if (booking is null)
        {
            return Result<bool>.Fail("Booking was not found.");
        }

        if (booking.Status != BookingStatus.Confirmed)
        {
            return Result<bool>.Fail("Only confirmed bookings can be cancelled.");
        }

        if (booking.ScheduledAt <= DateTime.UtcNow)
        {
            return Result<bool>.Fail("Past or active bookings cannot be cancelled.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelReason = "Cancelled by customer";
        await _db.SaveChangesAsync();

        _logger.LogInformation("Customer {CustomerId} cancelled booking {BookingId}.", customerId, bookingId);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<PagedResultDto<BookingResponseDto>>> GetCustomerBookingsAsync(Guid customerId, int page, int pageSize)
    {
        var query = _db.Bookings
            .AsNoTracking()
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.Service)
            .Where(booking => booking.CustomerId == customerId)
            .OrderByDescending(booking => booking.ScheduledAt);

        return Result<PagedResultDto<BookingResponseDto>>.Ok(await ToPagedResultAsync(query, page, pageSize));
    }

    public async Task<Result<PagedResultDto<BookingResponseDto>>> GetAdminBookingsAsync(
        int page,
        int pageSize,
        DateOnly? date,
        BookingStatus? status,
        Guid? customerId)
    {
        var query = _db.Bookings
            .AsNoTracking()
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.Service)
            .AsQueryable();

        if (date.HasValue)
        {
            var dayStart = date.Value.ToDateTime(TimeOnly.MinValue);
            var dayEnd = dayStart.AddDays(1);
            query = query.Where(booking => booking.ScheduledAt >= dayStart && booking.ScheduledAt < dayEnd);
        }

        if (status.HasValue)
        {
            query = query.Where(booking => booking.Status == status.Value);
        }

        if (customerId.HasValue)
        {
            query = query.Where(booking => booking.CustomerId == customerId.Value);
        }

        query = query.OrderByDescending(booking => booking.ScheduledAt);
        return Result<PagedResultDto<BookingResponseDto>>.Ok(await ToPagedResultAsync(query, page, pageSize));
    }

    public async Task<Result<PagedResultDto<BookingResponseDto>>> GetDailyQueueAsync(DateOnly date, int page, int pageSize)
    {
        var dayStart = date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var bookings = await _db.Bookings
            .AsNoTracking()
            .Include(booking => booking.Customer)
            .ThenInclude(customer => customer!.TierConfig)
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.Service)
            .Where(booking =>
                booking.ScheduledAt >= dayStart
                && booking.ScheduledAt < dayEnd
                && booking.Status == BookingStatus.Confirmed)
            .ToListAsync();

        var queue = bookings
            .OrderBy(booking => booking.ScheduledAt)
            .ThenByDescending(booking => booking.Customer?.TierConfig.RankOrder ?? 0)
            .ToList();

        var items = queue
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToBookingResponseDto)
            .ToList();

        return Result<PagedResultDto<BookingResponseDto>>.Ok(new PagedResultDto<BookingResponseDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = queue.Count
        });
    }

    private async Task<Result<(ServicePricing Pricing, Customer Customer)>> ValidateCustomerBookingRequestAsync(
        Guid customerId,
        CreateBookingRequestDto request,
        DateTime scheduledAt)
    {
        var pricing = await GetActivePricingAsync(request.PricingId);
        if (pricing is null)
        {
            return Result<(ServicePricing, Customer)>.Fail("Active pricing was not found.");
        }

        var customer = await _db.Customers
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);
        if (customer is null)
        {
            return Result<(ServicePricing, Customer)>.Fail("Customer was not found.");
        }

        var vehicleBelongsToCustomer = await _db.Vehicles.AnyAsync(vehicle =>
            vehicle.VehicleId == request.VehicleId && vehicle.CustomerId == customerId);
        if (!vehicleBelongsToCustomer)
        {
            return Result<(ServicePricing, Customer)>.Fail("Vehicle was not found for this customer.");
        }

        var nowSlot = DateTime.UtcNow.RoundDownToSlot(_slotDurationMinutes);
        if (scheduledAt < nowSlot)
        {
            return Result<(ServicePricing, Customer)>.Fail("Scheduled time must be in the future.");
        }

        if (scheduledAt > DateTime.UtcNow.AddDays(customer.TierConfig.BookingWindowDays))
        {
            return Result<(ServicePricing, Customer)>.Fail("Scheduled time exceeds the customer's booking window.");
        }

        if (request.PromotionId.HasValue && !await IsPromotionUsableAsync(request.PromotionId.Value, customer.TierConfig.RankOrder, scheduledAt))
        {
            return Result<(ServicePricing, Customer)>.Fail("Promotion is not valid for this booking.");
        }

        return Result<(ServicePricing, Customer)>.Ok((pricing, customer));
    }

    private async Task<ServicePricing?> GetActivePricingAsync(Guid pricingId)
    {
        return await _db.ServicePricings
            .Include(pricing => pricing.Service)
            .SingleOrDefaultAsync(pricing =>
                pricing.PricingId == pricingId
                && pricing.IsActive
                && pricing.Service.IsActive);
    }

    private async Task<bool> IsPromotionUsableAsync(Guid promotionId, int customerTierRank, DateTime scheduledAt)
    {
        var scheduledDate = DateOnly.FromDateTime(scheduledAt);
        return await _db.Promotions
            .Include(promotion => promotion.MinTier)
            .AnyAsync(promotion =>
                promotion.PromotionId == promotionId
                && promotion.IsActive
                && promotion.StartDate <= scheduledDate
                && promotion.EndDate >= scheduledDate
                && promotion.MinTier.RankOrder <= customerTierRank);
    }

    private async Task<bool> IsRangeAvailableAsync(DateTime scheduledAt, DateTime expectedEndAt)
    {
        var maxConcurrentBookings = 0;
        for (var slotStart = scheduledAt; slotStart < expectedEndAt; slotStart = slotStart.AddMinutes(_slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(_slotDurationMinutes);
            var overlappingBookings = await CountOverlappingBookingsAsync(slotStart, slotEnd);
            maxConcurrentBookings = Math.Max(maxConcurrentBookings, overlappingBookings);
        }

        return maxConcurrentBookings < _maxCapacityPerSlot;
    }

    private async Task<int> GetRemainingCapacityAsync(DateTime scheduledAt, DateTime expectedEndAt)
    {
        var minimumRemainingCapacity = _maxCapacityPerSlot;
        for (var slotStart = scheduledAt; slotStart < expectedEndAt; slotStart = slotStart.AddMinutes(_slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(_slotDurationMinutes);
            var overlappingBookings = await CountOverlappingBookingsAsync(slotStart, slotEnd);
            minimumRemainingCapacity = Math.Min(minimumRemainingCapacity, _maxCapacityPerSlot - overlappingBookings);
        }

        return Math.Max(0, minimumRemainingCapacity);
    }

    private async Task<int> CountOverlappingBookingsAsync(DateTime slotStart, DateTime slotEnd)
    {
        return await _db.Bookings.CountAsync(booking =>
            booking.Status != BookingStatus.Cancelled
            && booking.ScheduledAt < slotEnd
            && booking.ExpectedEndAt > slotStart);
    }

    private static async Task<PagedResultDto<BookingResponseDto>> ToPagedResultAsync(
        IQueryable<Booking> query,
        int page,
        int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(booking => ToBookingResponseDto(booking))
            .ToListAsync();

        return new PagedResultDto<BookingResponseDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    private static BookingResponseDto ToBookingResponseDto(Booking booking)
    {
        return new BookingResponseDto
        {
            BookingId = booking.BookingId,
            CustomerId = booking.CustomerId,
            VehicleId = booking.VehicleId,
            PricingId = booking.PricingId,
            PromotionId = booking.PromotionId,
            CreatedBy = booking.CreatedBy,
            ServiceName = booking.Pricing.Service.Name,
            VehicleType = booking.Pricing.VehicleType,
            ScheduledAt = booking.ScheduledAt,
            ExpectedEndAt = booking.ExpectedEndAt,
            CompletedAt = booking.CompletedAt,
            Status = booking.Status,
            PointsEarned = booking.PointsEarned,
            PointsRedeemed = booking.PointsRedeemed,
            PerksApplied = booking.PerksApplied,
            CancelReason = booking.CancelReason,
            WalkinPhone = booking.WalkinPhone,
            WalkinLicensePlate = booking.WalkinLicensePlate,
            BasePrice = booking.BasePrice,
            FinalPrice = booking.FinalPrice,
            CreatedAt = booking.CreatedAt
        };
    }
}
