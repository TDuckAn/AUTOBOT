namespace AutoWashPro.BLL.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string Role { get; set; } = string.Empty;
    public Guid PrincipalId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
}
