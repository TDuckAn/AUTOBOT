namespace AutoWashPro.BLL.DTOs.VehicleType;

public class VehicleTypeDto
{
    public Guid VehicleTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
