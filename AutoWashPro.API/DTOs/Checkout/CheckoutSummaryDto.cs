namespace AutoWashPro.API.DTOs.Checkout;

public class CheckoutSummaryDto
{
    public Guid BookingId { get; set; }
    public Guid? CustomerId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal PromotionDiscount { get; set; }
    public decimal PointsDiscount { get; set; }
    public decimal FinalPrice { get; set; }
    public int PointsRedeemed { get; set; }
    public int PointsEarned { get; set; }
    public int? NewPointsBalance { get; set; }
    public DateTime CompletedAt { get; set; }
}
