using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.API.DTOs.Checkout;

public class CompleteBookingRequestDto
{
    public Guid? PromotionId { get; set; }

    [Range(0, int.MaxValue)]
    public int PointsToRedeem { get; set; }
}
