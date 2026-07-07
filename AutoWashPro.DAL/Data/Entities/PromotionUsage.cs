namespace AutoWashPro.DAL.Data.Entities;

public class PromotionUsage
{
    public Guid UsageId { get; set; }
    public Guid PromotionId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid BookingId { get; set; }
    public DateTime CreatedAt { get; set; }
    public Promotion Promotion { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public Booking Booking { get; set; } = null!;
}
