namespace AutoWashPro.BLL.DTOs.Customer;

public class LoyaltyStatusDto
{
    public Guid CustomerId { get; set; }
    public int PointsBalance { get; set; }
    public Guid TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int TierRank { get; set; }
    public int BookingWindowDays { get; set; }
    public int PointsPerWash { get; set; }
    public IReadOnlyList<LedgerEntryDto> LedgerHistory { get; set; } = [];
}
