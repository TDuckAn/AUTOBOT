using AutoWashPro.API.Common;
using AutoWashPro.API.Data.Entities.Enums;
using AutoWashPro.API.DTOs.Booking;

namespace AutoWashPro.API.Services.Interfaces;

public interface IBookingService
{
    Task<Result<bool>> CheckSlotAvailabilityAsync(DateTime scheduledAt, Guid pricingId);
    Task<Result<IReadOnlyList<AvailabilitySlotDto>>> GetAvailabilityAsync(DateTime date, Guid pricingId);
    Task<Result<BookingResponseDto>> CreateBookingAsync(Guid customerId, CreateBookingRequestDto request);
    Task<Result<BookingResponseDto>> CreateWalkInBookingAsync(Guid systemUserId, CreateWalkInBookingRequestDto request);
    Task<Result<bool>> CancelBookingAsync(Guid customerId, Guid bookingId);
    Task<Result<PagedResultDto<BookingResponseDto>>> GetCustomerBookingsAsync(Guid customerId, int page, int pageSize);
    Task<Result<PagedResultDto<BookingResponseDto>>> GetAdminBookingsAsync(
        int page,
        int pageSize,
        DateOnly? date,
        BookingStatus? status,
        Guid? customerId);
    Task<Result<PagedResultDto<BookingResponseDto>>> GetDailyQueueAsync(DateOnly date, int page, int pageSize);
}
