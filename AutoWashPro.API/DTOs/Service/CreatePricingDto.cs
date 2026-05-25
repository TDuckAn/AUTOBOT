using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.API.DTOs.Service;

public class CreatePricingDto
{
    [Required]
    [MaxLength(50)]
    public string VehicleType { get; set; } = string.Empty;

    [Range(0.01, 9999999999999999)]
    public decimal Price { get; set; }

    [Range(30, 1440)]
    public int DurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;
}
