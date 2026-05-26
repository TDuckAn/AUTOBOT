namespace AutoWashPro.DAL.Data.Entities;

public class Vehicle
{
    public Guid VehicleId { get; set; }
    public Guid CustomerId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public DateTime CreatedAt { get; set; }
    public Customer Customer { get; set; } = null!;
}
