namespace AutoWashPro.BLL.DTOs.Customer;

public class VehicleDto
{
    public Guid VehicleId { get; set; }
    public Guid CustomerId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public DateTime CreatedAt { get; set; }
}
