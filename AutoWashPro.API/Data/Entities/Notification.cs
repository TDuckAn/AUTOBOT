using AutoWashPro.API.Data.Entities.Enums;

namespace AutoWashPro.API.Data.Entities;

public class Notification
{
    public Guid NotificationId { get; set; }
    public Guid CustomerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public Customer Customer { get; set; } = null!;
}
