using AutoWashPro.API.Data.Entities.Enums;

namespace AutoWashPro.API.Data.Entities;

public class SystemUser
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public SystemUserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<Booking> CreatedBookings { get; set; } = new List<Booking>();
}
