namespace AutoWashPro.BLL.DTOs.Service;

public class ServicePricingDto
{
    public Guid PricingId { get; set; }
    public Guid ServiceId { get; set; }
    public Guid VehicleTypeId { get; set; }
    public string VehicleTypeName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationMinutes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
