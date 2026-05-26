namespace AutoWashPro.BLL.DTOs.Admin;

public class ReportSummaryDto
{
    public DateOnly Date { get; set; }
    public int DailyWashVolume { get; set; }
    public decimal Revenue { get; set; }
    public int ActiveCustomers { get; set; }
    public decimal SlotUtilisationPercent { get; set; }
}
