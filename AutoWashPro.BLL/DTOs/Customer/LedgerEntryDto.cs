using AutoWashPro.DAL.Data.Entities.Enums;

namespace AutoWashPro.BLL.DTOs.Customer;

public class LedgerEntryDto
{
    public Guid EntryId { get; set; }
    public Guid? BookingId { get; set; }
    public LedgerEntryType Type { get; set; }
    public int Points { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}
