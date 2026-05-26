using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.BLL.DTOs.Admin;

public class UpdateCustomerTierDto
{
    [Required]
    public Guid TierId { get; set; }
}
