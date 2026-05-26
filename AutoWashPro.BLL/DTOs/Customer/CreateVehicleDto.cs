using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Customer;

public class CreateVehicleDto
{
    [Required]
    [MaxLength(30)]
    public string LicensePlate { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string VehicleType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Brand { get; set; }
}
