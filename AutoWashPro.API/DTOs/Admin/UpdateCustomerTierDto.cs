using System.ComponentModel.DataAnnotations;

namespace AutoWashPro.API.DTOs.Admin;

public class UpdateCustomerTierDto
{
    [Required]
    public Guid TierId { get; set; }
}
