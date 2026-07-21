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
    private static readonly TimeOnly BusinessStartTime = new(8, 0);
    private static readonly TimeOnly BusinessLastCustomerSlot = new(17, 0);
    private static readonly TimeOnly BusinessEndTime = new(17, 30);
    private static readonly TimeZoneInfo BusinessTimeZone = ResolveBusinessTimeZone();
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<BookingService> _logger = logger;
    private readonly int _slotDurationMinutes = configuration.GetValue("BookingSettings:SlotDurationMinutes", 30);
    private readonly int _maxCapacityPerSlot = configuration.GetValue("BookingSettings:MaxCapacityPerSlot", 4);

    public async Task<Result<bool>> CheckSlotAvailabilityAsync(Guid customerId, DateTime scheduledAt, Guid pricingId)
    {
        var validation = await ValidateCustomerScheduleAsync(customerId, pricingId, scheduledAt);
        if (!validation.IsSuccess)
        {
            return Result<bool>.Fail(validation.Error!);
        }

        var pricing = validation.Value!.Pricing;
        var slotStart = scheduledAt.RoundDownToSlot(_slotDurationMinutes);
        var slotEnd = slotStart.AddMinutes(pricing.DurationMinutes);

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var isAvailable = await IsRangeAvailableAsync(slotStart, slotEnd);
        await tx.CommitAsync();

        return Result<bool>.Ok(isAvailable);
    }

    public async Task<Result<IReadOnlyList<AvailabilitySlotDto>>> GetAvailabilityAsync(Guid customerId, DateTime date, Guid pricingId)
    {
        var customerValidation = await ValidateCustomerBookingDateAsync(customerId, date);
        if (!customerValidation.IsSuccess)
        {
            return Result<IReadOnlyList<AvailabilitySlotDto>>.Fail(customerValidation.Error!);
        }

        var pricing = await GetActivePricingAsync(pricingId);
        if (pricing is null)
        {
            return Result<IReadOnlyList<AvailabilitySlotDto>>.Fail("Active pricing was not found.");
        }

        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);
        var nowSlot = GetBusinessNow().RoundDownToSlot(_slotDurationMinutes);
        var slots = new List<AvailabilitySlotDto>();

        // Fetch the whole day's overlapping bookings once, then compute every slot's
        // capacity in memory (previously one COUNT query per sub-slot per slot).
        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var fetchEnd = dayEnd.AddMinutes(pricing.DurationMinutes);
        var dayBookings = await _db.Bookings
            .Where(booking =>
                booking.Status != BookingStatus.Cancelled
                && booking.ScheduledAt < fetchEnd
                && booking.ExpectedEndAt > dayStart)
            .Select(booking => new BookingInterval(booking.ScheduledAt, booking.ExpectedEndAt))
            .ToListAsync();
        await tx.CommitAsync();

        for (var slotStart = dayStart; slotStart < dayEnd; slotStart = slotStart.AddMinutes(_slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(pricing.DurationMinutes);
            if (!IsCustomerBookableRange(slotStart, slotEnd))
            {
                continue;
            }

            var remaining = Math.Max(0, _maxCapacityPerSlot - MaxConcurrency(dayBookings, slotStart, slotEnd));
            var isInFuture = slotStart >= nowSlot;
            slots.Add(new AvailabilitySlotDto
            {
                ScheduledAt = slotStart,
                ExpectedEndAt = slotEnd,
                RemainingCapacity = remaining,
                IsAvailable = isInFuture && remaining > 0
            });
        }

        return Result<IReadOnlyList<AvailabilitySlotDto>>.Ok(slots);
    }

    public async Task<Result<IReadOnlyList<AvailabilitySlotDto>>> GetWalkInAvailabilityAsync(DateTime date, Guid pricingId)
    {
        var bookingDate = DateOnly.FromDateTime(date);
        var today = GetBusinessToday();
        if (bookingDate != today)
        {
            return Result<IReadOnlyList<AvailabilitySlotDto>>.Fail("Walk-in bookings can only be scheduled for today.");
        }

        var pricing = await GetActivePricingAsync(pricingId);
        if (pricing is null)
        {
            return Result<IReadOnlyList<AvailabilitySlotDto>>.Fail("Active pricing was not found.");
        }

        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);
        var nowSlot = GetBusinessNow().RoundDownToSlot(_slotDurationMinutes);
        var slots = new List<AvailabilitySlotDto>();

        await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var fetchEnd = dayEnd.AddMinutes(pricing.DurationMinutes);
        var dayBookings = await _db.Bookings
            .Where(booking =>
                booking.Status != BookingStatus.Cancelled
                && booking.ScheduledAt < fetchEnd
                && booking.ExpectedEndAt > dayStart)
            .Select(booking => new BookingInterval(booking.ScheduledAt, booking.ExpectedEndAt))
            .ToListAsync();
        await tx.CommitAsync();

        for (var slotStart = dayStart; slotStart < dayEnd; slotStart = slotStart.AddMinutes(_slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(pricing.DurationMinutes);
            if (!IsCustomerBookableRange(slotStart, slotEnd))
            {
                continue;
            }

            var remaining = Math.Max(0, _maxCapacityPerSlot - MaxConcurrency(dayBookings, slotStart, slotEnd));
            var isInFuture = slotStart >= nowSlot;
            slots.Add(new AvailabilitySlotDto
            {
                ScheduledAt = slotStart,
                ExpectedEndAt = slotEnd,
                RemainingCapacity = remaining,
                IsAvailable = isInFuture && remaining > 0
            });
        }

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
        var promotion = request.PromotionId.HasValue
            ? await _db.Promotions.AsNoTracking().SingleOrDefaultAsync(entity => entity.PromotionId == request.PromotionId.Value)
            : null;
        var voucher = request.VoucherId.HasValue
            ? await _db.CustomerVouchers.AsNoTracking().SingleOrDefaultAsync(entity => entity.VoucherId == request.VoucherId.Value)
            : null;
        var finalPrice = CalculateBookingFinalPrice(pricing.Price, promotion, voucher);

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
            VoucherId = request.VoucherId,
            CreatedBy = null,
            ScheduledAt = scheduledAt,
            ExpectedEndAt = expectedEndAt,
            Status = BookingStatus.Confirmed,
            PointsEarned = 0,
            PointsRedeemed = 0,
            BasePrice = pricing.Price,
            FinalPrice = finalPrice,
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
        var promotion = request.PromotionId.HasValue
            ? await _db.Promotions.AsNoTracking().SingleOrDefaultAsync(entity => entity.PromotionId == request.PromotionId.Value)
            : null;
        var finalPrice = CalculateBookingFinalPrice(pricing.Price, promotion, null);

        var phone = request.WalkinPhone.Trim();
        var licensePlate = request.WalkinLicensePlate.Trim();
        if (string.IsNullOrWhiteSpace(phone) || string.IsNullOrWhiteSpace(licensePlate))
        {
            return Result<BookingResponseDto>.Fail("Walk-in phone and license plate are required.");
        }

        var today = GetBusinessToday();
        if (DateOnly.FromDateTime(scheduledAt) != today)
        {
            return Result<BookingResponseDto>.Fail("Walk-in bookings can only be scheduled for today.");
        }

        var nowSlot = GetBusinessNow().RoundDownToSlot(_slotDurationMinutes);
        if (scheduledAt < nowSlot)
        {
            return Result<BookingResponseDto>.Fail("Scheduled time must be in the future.");
        }

        if (!IsCustomerBookableRange(scheduledAt, expectedEndAt))
        {
            return Result<BookingResponseDto>.Fail("Bookings are only available from 08:00 to 17:30 within business hours.");
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
            FinalPrice = finalPrice,
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

        if (booking.ScheduledAt <= GetBusinessNow())
        {
            return Result<bool>.Fail("Past or active bookings cannot be cancelled.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelReason = "Cancelled by customer";
        // db-review 3.2: release the voucher selection so it can be reused (it is only consumed at checkout).
        booking.VoucherId = null;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Customer {CustomerId} cancelled booking {BookingId}.", customerId, bookingId);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<bool>> CancelBookingByStaffAsync(Guid systemUserId, Guid bookingId)
    {
        var systemUserExists = await _db.SystemUsers.AnyAsync(user => user.UserId == systemUserId);
        if (!systemUserExists)
        {
            return Result<bool>.Fail("System user was not found.");
        }

        var booking = await _db.Bookings.SingleOrDefaultAsync(entity => entity.BookingId == bookingId);
        if (booking is null)
        {
            return Result<bool>.Fail("Booking was not found.");
        }

        if (booking.Status != BookingStatus.Confirmed)
        {
            return Result<bool>.Fail("Only confirmed bookings can be cancelled.");
        }

        if (booking.ScheduledAt > GetBusinessNow())
        {
            return Result<bool>.Fail("Staff can only cancel bookings that have reached their scheduled time.");
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelReason = "Cancelled by staff due to customer no-show";
        booking.VoucherId = null;
        await _db.SaveChangesAsync();

        _logger.LogInformation("System user {SystemUserId} cancelled booking {BookingId}.", systemUserId, bookingId);
        return Result<bool>.Ok(true);
    }

    public async Task<Result<PagedResultDto<BookingResponseDto>>> GetCustomerBookingsAsync(Guid customerId, int page, int pageSize)
    {
        var query = _db.Bookings
            .AsNoTracking()
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.Service)
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.VehicleType)
            .Where(booking => booking.CustomerId == customerId)
            .OrderByDescending(booking => booking.ScheduledAt);

        return Result<PagedResultDto<BookingResponseDto>>.Ok(
            await query.ToPagedResultAsync(page, pageSize, ToBookingResponseDto));
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
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.VehicleType)
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
        return Result<PagedResultDto<BookingResponseDto>>.Ok(
            await query.ToPagedResultAsync(page, pageSize, ToBookingResponseDto));
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
            .Include(booking => booking.Pricing)
            .ThenInclude(pricing => pricing.VehicleType)
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

        var vehicle = await _db.Vehicles
            .AsNoTracking()
            .SingleOrDefaultAsync(entity => entity.VehicleId == request.VehicleId && entity.CustomerId == customerId);
        if (vehicle is null)
        {
            return Result<(ServicePricing, Customer)>.Fail("Vehicle was not found for this customer.");
        }

        if (vehicle.VehicleTypeId != pricing.VehicleTypeId)
        {
            return Result<(ServicePricing, Customer)>.Fail("Selected service package does not match the vehicle type.");
        }

        var expectedEndAt = scheduledAt.AddMinutes(pricing.DurationMinutes);
        var sameVehicleConflict = await _db.Bookings.AnyAsync(b =>
            b.VehicleId == request.VehicleId
            && b.Status == BookingStatus.Confirmed
            && b.ScheduledAt < expectedEndAt
            && b.ExpectedEndAt > scheduledAt);
        if (sameVehicleConflict)
        {
            return Result<(ServicePricing, Customer)>.Fail("Xe này đã có lịch đặt trùng giờ. Vui lòng chọn giờ khác.");
        }

        var nowSlot = GetBusinessNow().RoundDownToSlot(_slotDurationMinutes);
        if (scheduledAt < nowSlot)
        {
            return Result<(ServicePricing, Customer)>.Fail("Scheduled time must be in the future.");
        }

        if (!IsCustomerBookableRange(scheduledAt, expectedEndAt))
        {
            return Result<(ServicePricing, Customer)>.Fail("Bookings are only available from 08:00 to 17:30 within business hours.");
        }

        if (DateOnly.FromDateTime(scheduledAt) > GetBookingWindowEndDate(customer.TierConfig.BookingWindowDays))
        {
            return Result<(ServicePricing, Customer)>.Fail("Scheduled time exceeds the customer's booking window.");
        }

        if (request.PromotionId.HasValue && !await IsPromotionUsableAsync(request.PromotionId.Value, customer.CustomerId, customer.TierConfig.RankOrder, scheduledAt))
        {
            return Result<(ServicePricing, Customer)>.Fail("Promotion is not valid for this booking.");
        }

        if (request.PromotionId.HasValue && request.VoucherId.HasValue)
        {
            var promotionAllowsVoucher = await _db.Promotions.AnyAsync(promotion =>
                promotion.PromotionId == request.PromotionId.Value
                && promotion.IsStackable);
            if (!promotionAllowsVoucher)
            {
                return Result<(ServicePricing, Customer)>.Fail("Voucher cannot be combined with this promotion.");
            }
        }

        if (request.VoucherId.HasValue)
        {
            var voucherExistsAndUnused = await _db.CustomerVouchers.AnyAsync(voucher =>
                voucher.VoucherId == request.VoucherId.Value
                && voucher.CustomerId == customerId
                && !voucher.IsUsed);
            var voucherReservedByOtherBooking = await _db.Bookings.AnyAsync(booking =>
                booking.VoucherId == request.VoucherId.Value
                && booking.Status != BookingStatus.Cancelled);
            if (!voucherExistsAndUnused || voucherReservedByOtherBooking)
            {
                return Result<(ServicePricing, Customer)>.Fail("Voucher is not valid for this booking.");
            }
        }

        return Result<(ServicePricing, Customer)>.Ok((pricing, customer));
    }

    private async Task<Result<(ServicePricing Pricing, Customer Customer)>> ValidateCustomerScheduleAsync(
        Guid customerId,
        Guid pricingId,
        DateTime scheduledAt)
    {
        var pricing = await GetActivePricingAsync(pricingId);
        if (pricing is null)
        {
            return Result<(ServicePricing, Customer)>.Fail("Active pricing was not found.");
        }

        var customer = await _db.Customers
            .AsNoTracking()
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);
        if (customer is null)
        {
            return Result<(ServicePricing, Customer)>.Fail("Customer was not found.");
        }

        var slotStart = scheduledAt.RoundDownToSlot(_slotDurationMinutes);
        var nowSlot = GetBusinessNow().RoundDownToSlot(_slotDurationMinutes);
        if (slotStart < nowSlot)
        {
            return Result<(ServicePricing, Customer)>.Fail("Scheduled time must be in the future.");
        }

        var slotEnd = slotStart.AddMinutes(pricing.DurationMinutes);
        if (!IsCustomerBookableRange(slotStart, slotEnd))
        {
            return Result<(ServicePricing, Customer)>.Fail("Bookings are only available from 08:00 to 17:30 within business hours.");
        }

        if (DateOnly.FromDateTime(slotStart) > GetBookingWindowEndDate(customer.TierConfig.BookingWindowDays))
        {
            return Result<(ServicePricing, Customer)>.Fail("Scheduled time exceeds the customer's booking window.");
        }

        return Result<(ServicePricing, Customer)>.Ok((pricing, customer));
    }

    private async Task<Result<Customer>> ValidateCustomerBookingDateAsync(Guid customerId, DateTime date)
    {
        var customer = await _db.Customers
            .AsNoTracking()
            .Include(entity => entity.TierConfig)
            .SingleOrDefaultAsync(entity => entity.CustomerId == customerId);
        if (customer is null)
        {
            return Result<Customer>.Fail("Customer was not found.");
        }

        var bookingDate = DateOnly.FromDateTime(date);
        var today = GetBusinessToday();
        if (bookingDate < today)
        {
            return Result<Customer>.Fail("Scheduled time must be in the future.");
        }

        if (bookingDate > GetBookingWindowEndDate(customer.TierConfig.BookingWindowDays))
        {
            return Result<Customer>.Fail("Scheduled time exceeds the customer's booking window.");
        }

        return Result<Customer>.Ok(customer);
    }

    private async Task<ServicePricing?> GetActivePricingAsync(Guid pricingId)
    {
        return await _db.ServicePricings
            .Include(pricing => pricing.Service)
            .Include(pricing => pricing.VehicleType)
            .SingleOrDefaultAsync(pricing =>
                pricing.PricingId == pricingId
                && pricing.IsActive
                && pricing.Service.IsActive);
    }

    private async Task<bool> IsPromotionUsableAsync(Guid promotionId, Guid customerId, int customerTierRank, DateTime scheduledAt)
    {
        var scheduledDate = DateOnly.FromDateTime(scheduledAt);
        var promotion = await _db.Promotions
            .Include(promotion => promotion.MinTier)
            .Include(promotion => promotion.MaxTier)
            .SingleOrDefaultAsync(promotion =>
                promotion.PromotionId == promotionId
                && promotion.IsActive
                && promotion.StartDate <= scheduledDate
                && promotion.EndDate >= scheduledDate
                && promotion.MinTier.RankOrder <= customerTierRank
                && (promotion.MaxTierId == null || promotion.MaxTier!.RankOrder >= customerTierRank));

        if (promotion is null)
        {
            return false;
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
            return false;
        }

        if (promotion.TotalUsageLimit.HasValue
            && (usageSummary?.TotalUsage ?? 0) >= promotion.TotalUsageLimit.Value)
        {
            return false;
        }

        return true;
    }

    private static decimal CalculateBookingFinalPrice(decimal basePrice, Promotion? promotion, CustomerVoucher? voucher)
    {
        var promotionDiscount = CalculatePromotionDiscount(basePrice, promotion);
        var remainingAfterPromotion = Math.Max(0, basePrice - promotionDiscount);
        var voucherDiscount = voucher is null ? 0m : Math.Min(voucher.DiscountAmount, remainingAfterPromotion);
        return Math.Max(0, basePrice - promotionDiscount - voucherDiscount);
    }

    private static decimal CalculatePromotionDiscount(decimal basePrice, Promotion? promotion)
    {
        return promotion?.RewardType switch
        {
            RewardType.Discount => Math.Min(promotion.RewardValue, basePrice),
            RewardType.FreeWash => basePrice,
            RewardType.BonusPoints => 0m,
            _ => 0m
        };
    }

    private async Task<bool> IsRangeAvailableAsync(DateTime scheduledAt, DateTime expectedEndAt)
    {
        // Single query: fetch all non-cancelled bookings overlapping the requested range,
        // then evaluate per-sub-slot concurrency in memory (BR-01).
        var overlapping = await _db.Bookings
            .Where(booking =>
                booking.Status != BookingStatus.Cancelled
                && booking.ScheduledAt < expectedEndAt
                && booking.ExpectedEndAt > scheduledAt)
            .Select(booking => new BookingInterval(booking.ScheduledAt, booking.ExpectedEndAt))
            .ToListAsync();

        return MaxConcurrency(overlapping, scheduledAt, expectedEndAt) < _maxCapacityPerSlot;
    }

    // Maximum number of bookings concurrently occupying any 30-min sub-slot of [rangeStart, rangeEnd).
    private int MaxConcurrency(IReadOnlyList<BookingInterval> bookings, DateTime rangeStart, DateTime rangeEnd)
    {
        var max = 0;
        for (var slotStart = rangeStart; slotStart < rangeEnd; slotStart = slotStart.AddMinutes(_slotDurationMinutes))
        {
            var slotEnd = slotStart.AddMinutes(_slotDurationMinutes);
            var concurrent = bookings.Count(b => b.ScheduledAt < slotEnd && b.ExpectedEndAt > slotStart);
            if (concurrent > max)
            {
                max = concurrent;
            }
        }

        return max;
    }

    private readonly record struct BookingInterval(DateTime ScheduledAt, DateTime ExpectedEndAt);

    private static bool IsCustomerBookableRange(DateTime scheduledAt, DateTime expectedEndAt)
    {
        var startTime = TimeOnly.FromDateTime(scheduledAt);
        var endTime = TimeOnly.FromDateTime(expectedEndAt);
        return startTime >= BusinessStartTime
            && startTime <= BusinessLastCustomerSlot
            && endTime <= BusinessEndTime;
    }

    private static DateOnly GetBookingWindowEndDate(int bookingWindowDays)
    {
        return GetBusinessToday().AddDays(Math.Max(0, bookingWindowDays));
    }

    private static DateTime GetBusinessNow()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BusinessTimeZone);
    }

    private static DateOnly GetBusinessToday()
    {
        return DateOnly.FromDateTime(GetBusinessNow());
    }

    private static TimeZoneInfo ResolveBusinessTimeZone()
    {
        foreach (var timeZoneId in new[] { "SE Asia Standard Time", "Asia/Ho_Chi_Minh" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.Local;
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
            VehicleTypeName = booking.Pricing.VehicleType.Name,
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
