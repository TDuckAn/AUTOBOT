namespace AutoWashPro.DAL.Data.Entities;

public class CustomerVoucher
{
    public Guid VoucherId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid VoucherRuleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public DateTime RedeemedAt { get; set; }
    public bool IsUsed { get; set; }
    public Customer Customer { get; set; } = null!;
    public VoucherRedemptionRule VoucherRule { get; set; } = null!;
}
