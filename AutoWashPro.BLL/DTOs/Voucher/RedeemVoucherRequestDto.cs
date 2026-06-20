using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Voucher;

public class RedeemVoucherRequestDto
{
    [Required]
    public Guid VoucherRuleId { get; set; }
}
