using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.API.DTOs.Booking;

public class CreateWalkInBookingRequestDto
{
    [Required]
    public Guid PricingId { get; set; }

    public Guid? PromotionId { get; set; }

    [Required]
    public DateTime ScheduledAt { get; set; }

    [Required]
    [MaxLength(30)]
    public string WalkinPhone { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string WalkinLicensePlate { get; set; } = string.Empty;
}
