using AutoWashPro.API.Data.Entities.Enums;

namespace AutoWashPro.API.DTOs.Admin;

public class PromotionDto
{
    public Guid PromotionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public Guid MinTierId { get; set; }
    public string MinTierName { get; set; } = string.Empty;
    public RewardType RewardType { get; set; }
    public decimal RewardValue { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
