using System.ComponentModel.DataAnnotations;
using AutoWashPro.API.Data.Entities.Enums;

namespace AutoWashPro.API.DTOs.Admin;

public class CreatePromotionDto
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    [Required]
    public Guid MinTierId { get; set; }

    [Required]
    public RewardType RewardType { get; set; }

    [Range(0, 9999999999999999)]
    public decimal RewardValue { get; set; }

    public bool IsActive { get; set; } = true;
}
