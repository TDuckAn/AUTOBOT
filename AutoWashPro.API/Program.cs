using AutoWashPro.API.Data;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.Data.Entities.Enums;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

var seedAdminEmail = builder.Configuration["SeedSettings:DefaultAdminEmail"];
var seedAdminPassword = builder.Configuration["SeedSettings:DefaultAdminPassword"];

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString)
        .UseSeeding((context, _) =>
        {
            SeedDefaultAdmin(context, seedAdminEmail, seedAdminPassword);
        })
        .UseAsyncSeeding(async (context, _, cancellationToken) =>
        {
            await SeedDefaultAdminAsync(context, seedAdminEmail, seedAdminPassword, cancellationToken);
        });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();

static bool HasUsableSeedAdminSettings(string? email, string? password)
{
    return !string.IsNullOrWhiteSpace(email)
        && !string.Equals(email, "SET_VIA_ENV_VAR", StringComparison.OrdinalIgnoreCase)
        && !string.IsNullOrWhiteSpace(password)
        && !string.Equals(password, "SET_VIA_ENV_VAR", StringComparison.OrdinalIgnoreCase);
}

static void SeedDefaultAdmin(DbContext context, string? email, string? password)
{
    if (!HasUsableSeedAdminSettings(email, password)
        || context.Set<SystemUser>().Any(user => user.Email == email))
    {
        return;
    }

    context.Set<SystemUser>().Add(CreateDefaultAdmin(email!, password!));
    context.SaveChanges();
}

static async Task SeedDefaultAdminAsync(
    DbContext context,
    string? email,
    string? password,
    CancellationToken cancellationToken)
{
    if (!HasUsableSeedAdminSettings(email, password)
        || await context.Set<SystemUser>().AnyAsync(user => user.Email == email, cancellationToken))
    {
        return;
    }

    context.Set<SystemUser>().Add(CreateDefaultAdmin(email!, password!));
    await context.SaveChangesAsync(cancellationToken);
}

static SystemUser CreateDefaultAdmin(string email, string password)
{
    return new SystemUser
    {
        UserId = Guid.NewGuid(),
        FullName = "Default Admin",
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
        Role = SystemUserRole.Admin,
        CreatedAt = DateTime.UtcNow
    };
}
