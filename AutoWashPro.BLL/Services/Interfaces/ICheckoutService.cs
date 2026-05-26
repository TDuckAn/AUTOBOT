using AutoWashPro.BLL.Common;
using AutoWashPro.BLL.DTOs.Checkout;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface ICheckoutService
{
    Task<Result<CheckoutSummaryDto>> CompleteBookingAsync(Guid bookingId, CompleteBookingRequestDto request);
}
