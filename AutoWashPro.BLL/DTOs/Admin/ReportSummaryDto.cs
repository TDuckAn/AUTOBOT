namespace AutoWashPro.BLL.DTOs.Admin;

public class ReportSummaryDto
{
    public DateOnly Date { get; set; }
    public int DailyWashVolume { get; set; }
    public decimal Revenue { get; set; }
    public int ActiveCustomers { get; set; }
    public decimal SlotUtilisationPercent { get; set; }
    public int RevenueYear { get; set; }
    public int RevenueQuarter { get; set; }
    public IList<int> AvailableRevenueYears { get; set; } = new List<int>();
    public IList<DailyRevenueDto> RevenueHistory { get; set; } = new List<DailyRevenueDto>();
}

public class DailyRevenueDto
{
    public string Day { get; set; } = string.Empty;
    public decimal Value { get; set; }
}
