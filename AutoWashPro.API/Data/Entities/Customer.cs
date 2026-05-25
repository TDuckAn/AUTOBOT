namespace AutoWashPro.API.Data.Entities;

public class Customer
{
    public Guid CustomerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Guid TierId { get; set; }
    public int PointsBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public TierConfig TierConfig { get; set; } = null!;
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<PointsLedger> LedgerEntries { get; set; } = new List<PointsLedger>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
