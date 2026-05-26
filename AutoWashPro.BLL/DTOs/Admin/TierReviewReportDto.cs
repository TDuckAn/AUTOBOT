namespace AutoWashPro.BLL.DTOs.Admin;

public class TierReviewReportDto
{
    public DateTime GeneratedAt { get; set; }
    public string Note { get; set; } = string.Empty;
    public IReadOnlyList<TierDistributionDto> TierDistribution { get; set; } = [];
}
