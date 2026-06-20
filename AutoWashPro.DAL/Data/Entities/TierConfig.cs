namespace AutoWashPro.DAL.Data.Entities;

public class TierConfig
{
    public Guid TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int RankOrder { get; set; }
    public int BookingWindowDays { get; set; }
    public int MinVisitsPerMonth { get; set; }
    public decimal MinSpendPerMonth { get; set; }
    public int PointsPerWash { get; set; }
    public string? PerksDescription { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
}
