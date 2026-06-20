using AutoWashPro.DAL.Data.Entities.Enums;

namespace AutoWashPro.DAL.Data.Entities;

public class PointsLedger
{
    public Guid EntryId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? BookingId { get; set; }
    public LedgerEntryType Type { get; set; }
    public int Points { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool NearExpiryNotified { get; set; }
    public Customer Customer { get; set; } = null!;
    public Booking? Booking { get; set; }
}
