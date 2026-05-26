namespace AutoWashPro.BLL.DTOs.Voucher;

public class CustomerVoucherDto
{
    public Guid VoucherId { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public DateTime RedeemedAt { get; set; }
    public bool IsUsed { get; set; }
}
