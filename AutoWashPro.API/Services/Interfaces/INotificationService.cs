using AutoWashPro.API.Common;
using AutoWashPro.API.Data.Entities.Enums;
using AutoWashPro.API.DTOs.Customer;

namespace AutoWashPro.API.Services.Interfaces;

public interface INotificationService
{
    Task<Result<NotificationDto>> CreateNotificationAsync(
        Guid customerId,
        string title,
        string message,
        NotificationType type);
}
