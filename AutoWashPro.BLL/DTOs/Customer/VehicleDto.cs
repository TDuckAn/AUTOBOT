namespace AutoWashPro.BLL.DTOs.Customer;

public class VehicleDto
{
    public Guid VehicleId { get; set; }
    public Guid CustomerId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public DateTime CreatedAt { get; set; }
}
