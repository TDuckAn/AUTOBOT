using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Customer;

public class UpdateCustomerProfileDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;
}
