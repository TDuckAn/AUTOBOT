using AutoWashPro.DAL.Data.Entities.Enums;

namespace AutoWashPro.BLL.DTOs.Booking;

public class BookingResponseDto
{
    public Guid BookingId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? VehicleId { get; set; }
    public Guid PricingId { get; set; }
    public Guid? PromotionId { get; set; }
    public Guid? CreatedBy { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
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
}
