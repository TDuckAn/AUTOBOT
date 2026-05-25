namespace AutoWashPro.API.DTOs.Admin;

public class TierDistributionDto
{
    public Guid TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int RankOrder { get; set; }
    public int CustomerCount { get; set; }
}
