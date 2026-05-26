namespace AutoWashPro.BLL.DTOs.Customer;

public class CustomerProfileDto
{
    public Guid CustomerId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid TierId { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int PointsBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
