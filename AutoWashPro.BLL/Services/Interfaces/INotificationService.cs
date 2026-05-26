using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Customer;

namespace AutoWashPro.BLL.Services.Interfaces;

public interface INotificationService
{
    Task<Result<NotificationDto>> CreateNotificationAsync(
        Guid customerId,
        string title,
        string message,
        NotificationType type);
}
