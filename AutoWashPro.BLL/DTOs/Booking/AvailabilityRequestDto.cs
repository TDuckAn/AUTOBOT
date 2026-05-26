using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Booking;

public class AvailabilityRequestDto
{
    [Required]
    public DateTime Date { get; set; }

    [Required]
    public Guid PricingId { get; set; }
}
