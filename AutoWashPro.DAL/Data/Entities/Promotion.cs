using AutoWashPro.DAL.Data.Entities.Enums;

namespace AutoWashPro.DAL.Data.Entities;

public class Promotion
{
    public Guid PromotionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public Guid MinTierId { get; set; }
    public Guid? MaxTierId { get; set; }
    public RewardType RewardType { get; set; }
    public decimal RewardValue { get; set; }
    public bool IsStackable { get; set; }
    public int? UsageLimitPerCustomer { get; set; }
    public int? TotalUsageLimit { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public TierConfig MinTier { get; set; } = null!;
    public TierConfig? MaxTier { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<PromotionUsage> Usages { get; set; } = new List<PromotionUsage>();
}
