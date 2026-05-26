using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Auth;

public class CustomerLoginRequestDto
{
    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
