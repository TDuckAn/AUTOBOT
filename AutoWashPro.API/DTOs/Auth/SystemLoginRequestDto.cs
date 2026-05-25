using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.API.DTOs.Auth;

public class SystemLoginRequestDto
{
    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
