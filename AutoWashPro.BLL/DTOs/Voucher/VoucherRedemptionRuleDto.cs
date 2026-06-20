namespace AutoWashPro.BLL.DTOs.Voucher;

public class VoucherRedemptionRuleDto
{
    public Guid VoucherRuleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PointCost { get; set; }
    public decimal DiscountAmount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
