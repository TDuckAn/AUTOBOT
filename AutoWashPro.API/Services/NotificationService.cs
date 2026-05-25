using AutoWashPro.API.Common;
using AutoWashPro.API.Data;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.Data.Entities.Enums;
using AutoWashPro.API.DTOs.Customer;
using AutoWashPro.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AutoWashPro.API.Services;

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
