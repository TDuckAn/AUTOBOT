using AutoWashPro.API.Data.Entities.Enums;

namespace AutoWashPro.API.Data.Entities;

public class Booking
{
    public Guid BookingId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? VehicleId { get; set; }
    public Guid PricingId { get; set; }
    public Guid? PromotionId { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTime ScheduledAt { get; set; }
    public DateTime ExpectedEndAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public BookingStatus Status { get; set; }
    public int PointsEarned { get; set; }
    public int PointsRedeemed { get; set; }
    public string? PerksApplied { get; set; }
    public string? CancelReason { get; set; }
    public string? WalkinPhone { get; set; }
    public string? WalkinLicensePlate { get; set; }
    public decimal BasePrice { get; set; }
    public decimal FinalPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public Customer? Customer { get; set; }
    public Vehicle? Vehicle { get; set; }
    public ServicePricing Pricing { get; set; } = null!;
    public Promotion? Promotion { get; set; }
    public SystemUser? CreatedByUser { get; set; }
    public ICollection<PointsLedger> LedgerEntries { get; set; } = new List<PointsLedger>();
}
