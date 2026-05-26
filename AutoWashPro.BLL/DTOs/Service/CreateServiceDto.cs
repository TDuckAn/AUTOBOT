using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Service;

public class CreateServiceDto
{
    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}
