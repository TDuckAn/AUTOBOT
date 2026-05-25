namespace AutoWashPro.API.Data.Entities;

public class Service
{
    public Guid ServiceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<ServicePricing> Pricings { get; set; } = new List<ServicePricing>();
}
