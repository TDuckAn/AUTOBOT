namespace AutoWashPro.DAL.Data.Entities;

public class VehicleType
{
    public Guid VehicleTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
}
