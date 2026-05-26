using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Booking;

public class CreateBookingRequestDto
{
    [Required]
    public Guid VehicleId { get; set; }

    [Required]
    public Guid PricingId { get; set; }

    public Guid? PromotionId { get; set; }

    [Required]
    public DateTime ScheduledAt { get; set; }
}
