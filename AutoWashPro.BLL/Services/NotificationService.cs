using AutoWashPro.BLL.Common;
using AutoWashPro.DAL.Data;
using AutoWashPro.DAL.Data.Entities;
using AutoWashPro.DAL.Data.Entities.Enums;
using AutoWashPro.BLL.DTOs.Customer;
using AutoWashPro.BLL.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.BLL.Services;

public class NotificationService(
    AppDbContext db,
    ILogger<NotificationService> logger) : INotificationService
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<NotificationService> _logger = logger;

    public async Task<Result<NotificationDto>> CreateNotificationAsync(
        Guid customerId,
        string title,
        string message,
        NotificationType type)
    {
        var customerExists = await _db.Customers.AnyAsync(customer => customer.CustomerId == customerId);
        if (!customerExists)
        {
            return Result<NotificationDto>.Fail("Customer was not found.");
        }

        var notification = new Notification
        {
            NotificationId = Guid.NewGuid(),
            CustomerId = customerId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created notification {NotificationId} for customer {CustomerId}.", notification.NotificationId, customerId);
        return Result<NotificationDto>.Ok(ToDto(notification));
    }

    internal static NotificationDto ToDto(Notification notification)
    {
        return new NotificationDto
        {
            NotificationId = notification.NotificationId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt
        };
    }
}
