using System.Reflection;
using System.Text;
using AutoWashPro.API.Data;
using AutoWashPro.API.Data.Entities;
using AutoWashPro.API.Data.Entities.Enums;
using AutoWashPro.API.Jobs;
using AutoWashPro.API.Middleware;
using AutoWashPro.API.Services;
using AutoWashPro.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

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

var jwtSecret = builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"]
    ?? throw new InvalidOperationException("JwtSettings:Issuer is not configured.");
var jwtAudience = builder.Configuration["JwtSettings:Audience"]
    ?? throw new InvalidOperationException("JwtSettings:Audience is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Staff", "Admin"));
    options.AddPolicy("CustomerOnly", policy => policy.RequireRole("Customer"));
});

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IServiceCatalogService, ServiceCatalogService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ICheckoutService, CheckoutService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddHostedService<MonthlyMaintenanceJob>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AutoWash Pro API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a JWT Bearer token."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            []
        }
    });

    options.TagActionsBy(api =>
    {
        var controllerName = api.ActionDescriptor.RouteValues["controller"];
        return [controllerName ?? "Default"];
    });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
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
