using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoWashPro.API.Common;
using AutoWashPro.API.Data;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.DTOs.Auth;
using AutoWashPro.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AutoWashPro.API.Services;

public class AuthService(
    AppDbContext db,
    IConfiguration configuration,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _configuration = configuration;
    private readonly ILogger<AuthService> _logger = logger;

    public async Task<Result<AuthResponseDto>> RegisterCustomerAsync(CustomerRegisterRequestDto request)
    {
        var phoneNumber = request.PhoneNumber.Trim();

        if (string.Equals(phoneNumber, "WALK-IN", StringComparison.OrdinalIgnoreCase))
        {
            return Result<AuthResponseDto>.Fail("Phone number is reserved.");
        }

        var phoneExists = await _db.Customers.AnyAsync(customer => customer.PhoneNumber == phoneNumber);
        if (phoneExists)
        {
            return Result<AuthResponseDto>.Fail("Phone number is already registered.");
        }

        var memberTier = await _db.TierConfigs.SingleOrDefaultAsync(tier => tier.TierName == "Member");
        if (memberTier is null)
        {
            _logger.LogError("Member tier seed data is missing.");
            return Result<AuthResponseDto>.Fail("Registration is unavailable.");
        }

        var now = DateTime.UtcNow;
        var customer = new Customer
        {
            CustomerId = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            PhoneNumber = phoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            TierId = memberTier.TierId,
            PointsBalance = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return Result<AuthResponseDto>.Ok(CreateTokenResponse(
            customer.CustomerId,
            customer.FullName,
            "Customer"));
    }

    public async Task<Result<AuthResponseDto>> LoginCustomerAsync(CustomerLoginRequestDto request)
    {
        var phoneNumber = request.PhoneNumber.Trim();
        var customer = await _db.Customers.SingleOrDefaultAsync(entity => entity.PhoneNumber == phoneNumber);

        if (customer is null || !BCrypt.Net.BCrypt.Verify(request.Password, customer.PasswordHash))
        {
            return Result<AuthResponseDto>.Fail("Invalid phone number or password.");
        }

        return Result<AuthResponseDto>.Ok(CreateTokenResponse(
            customer.CustomerId,
            customer.FullName,
            "Customer"));
    }

    public async Task<Result<AuthResponseDto>> LoginSystemUserAsync(SystemLoginRequestDto request)
    {
        var email = request.Email.Trim();
        var user = await _db.SystemUsers.SingleOrDefaultAsync(entity => entity.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Result<AuthResponseDto>.Fail("Invalid email or password.");
        }

        var role = user.Role.ToString();
        return Result<AuthResponseDto>.Ok(CreateTokenResponse(user.UserId, user.FullName, role));
    }

    private AuthResponseDto CreateTokenResponse(Guid principalId, string displayName, string role)
    {
        var issuer = _configuration["JwtSettings:Issuer"]
            ?? throw new InvalidOperationException("JwtSettings:Issuer is not configured.");
        var audience = _configuration["JwtSettings:Audience"]
            ?? throw new InvalidOperationException("JwtSettings:Audience is not configured.");
        var secretKey = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
        var expiryMinutes = _configuration.GetValue<int>("JwtSettings:ExpiryMinutes");
        if (expiryMinutes <= 0)
        {
            expiryMinutes = 1440;
        }

        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, principalId.ToString()),
            new(ClaimTypes.NameIdentifier, principalId.ToString()),
            new(ClaimTypes.Name, displayName),
            new(ClaimTypes.Role, role),
            new("principal_id", principalId.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt,
            Role = role,
            PrincipalId = principalId,
            DisplayName = displayName
        };
    }
}
