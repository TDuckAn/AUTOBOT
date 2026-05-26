namespace AutoWashPro.DAL.Data.Entities;

public class VoucherRedemptionRule
{
    public Guid VoucherRuleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PointCost { get; set; }
    public decimal DiscountAmount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public ICollection<CustomerVoucher> CustomerVouchers { get; set; } = new List<CustomerVoucher>();
}
