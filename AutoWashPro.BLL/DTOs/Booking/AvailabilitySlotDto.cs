namespace AutoWashPro.BLL.DTOs.Booking;

public class AvailabilitySlotDto
{
    public DateTime ScheduledAt { get; set; }
    public DateTime ExpectedEndAt { get; set; }
    public bool IsAvailable { get; set; }
    public int RemainingCapacity { get; set; }
}
