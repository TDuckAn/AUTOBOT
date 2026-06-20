using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Voucher;

public class CreateVoucherRuleDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Point cost must be at least 1.")]
    public int PointCost { get; set; }

    [Range(1, double.MaxValue, ErrorMessage = "Discount amount must be at least 1.")]
    public decimal DiscountAmount { get; set; }

    public bool IsActive { get; set; } = true;
}
