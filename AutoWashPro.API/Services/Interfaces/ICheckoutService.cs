using AutoWashPro.API.Common;
using AutoWashPro.API.DTOs.Checkout;

namespace AutoWashPro.API.Services.Interfaces;

public interface ICheckoutService
{
    Task<Result<CheckoutSummaryDto>> CompleteBookingAsync(Guid bookingId, CompleteBookingRequestDto request);
}
