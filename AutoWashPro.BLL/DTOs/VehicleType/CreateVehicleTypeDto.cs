using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.VehicleType;

public class CreateVehicleTypeDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
