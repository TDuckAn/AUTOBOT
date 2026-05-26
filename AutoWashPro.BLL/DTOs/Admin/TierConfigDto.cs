using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Admin;

public class TierConfigDto
{
    public Guid TierId { get; set; }

    [Required]
    [MaxLength(50)]
    public string TierName { get; set; } = string.Empty;

    [Range(1, 100)]
    public int RankOrder { get; set; }

    [Range(0, 365)]
    public int BookingWindowDays { get; set; }

    [Range(0, int.MaxValue)]
    public int MinVisitsPerMonth { get; set; }

    [Range(0, 9999999999999999)]
    public decimal MinSpendPerMonth { get; set; }

    [Range(0, int.MaxValue)]
    public int PointsPerWash { get; set; }

    [MaxLength(500)]
    public string? PerksDescription { get; set; }

    public DateTime UpdatedAt { get; set; }
}
