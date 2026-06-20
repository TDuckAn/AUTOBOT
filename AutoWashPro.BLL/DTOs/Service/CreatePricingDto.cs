using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Service;

public class CreatePricingDto
{
    [Required]
    public Guid VehicleTypeId { get; set; }

    [Range(0.01, 9999999999999999)]
    public decimal Price { get; set; }

    [Range(1, 1440)]
    public int DurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;
}
