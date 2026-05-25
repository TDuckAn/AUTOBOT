namespace AutoWashPro.API.Common.Extensions;

public static class DateTimeExtensions
{
    public static DateTime RoundDownToSlot(this DateTime dateTime, int slotDurationMinutes = 30)
    {
        if (slotDurationMinutes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(slotDurationMinutes), "Slot duration must be positive.");
        }

        var ticksPerSlot = TimeSpan.FromMinutes(slotDurationMinutes).Ticks;
        return new DateTime(dateTime.Ticks - dateTime.Ticks % ticksPerSlot, dateTime.Kind);
    }
}
