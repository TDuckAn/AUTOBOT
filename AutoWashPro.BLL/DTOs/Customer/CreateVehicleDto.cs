using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Customer;

public class CreateVehicleDto
{
    [Required]
    [MaxLength(30)]
    public string LicensePlate { get; set; } = string.Empty;

    [Required]
    public Guid VehicleTypeId { get; set; }

    [MaxLength(100)]
    public string? Brand { get; set; }
}
