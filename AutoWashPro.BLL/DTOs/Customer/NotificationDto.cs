using AutoWashPro.DAL.Data.Entities.Enums;

namespace AutoWashPro.BLL.DTOs.Customer;

public class NotificationDto
{
    public Guid NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
