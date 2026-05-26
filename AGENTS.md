# CODEX.md — AutoWash Pro Implementation Guide
> Load this file before implementing any phase.  
> Do not deviate from specs below. Resolve conflicts by reading SYSTEM_SPEC.md, then CLAUDE.md.  
> Implement one phase at a time. Code must compile before moving to the next phase.

---

## Stack
| Layer | Tech |
|-------|------|
| Runtime | .NET 9 / C# |
| Framework | ASP.NET Core Web API with API / BLL / DAL projects (no microservices) |
| ORM | EF Core 9.0, Code-First, SqlServer provider |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| Password | BCrypt.Net-Next v4 |
| Docs | Swashbuckle.AspNetCore v6 |
| DB | SQL Server (local dev) or PostgreSQL (swap provider only) |

### NuGet Packages
```xml
<!-- AutoWashPro.DAL -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="9.*" />

<!-- AutoWashPro.BLL -->
<PackageReference Include="BCrypt.Net-Next" Version="4.*" />
<PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.*" />
<FrameworkReference Include="Microsoft.AspNetCore.App" />

<!-- AutoWashPro.API -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="9.*" PrivateAssets="all" />
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.*" />
```

---

## Folder Structure (exact - do not add folders not listed here)
```
AutoWashPro.DAL/
|-- Data/
|   |-- AppDbContext.cs
|   |-- Entities/
|   |   |-- Customer.cs
|   |   |-- Vehicle.cs
|   |   |-- Service.cs
|   |   |-- ServicePricing.cs
|   |   |-- Booking.cs
|   |   |-- PointsLedger.cs
|   |   |-- TierConfig.cs
|   |   |-- Promotion.cs
|   |   |-- SystemUser.cs
|   |   |-- Notification.cs
|   |   |-- SystemConfig.cs
|   |   `-- Enums/
|   |       |-- BookingStatus.cs       (Confirmed, Completed, Cancelled - NO Pending)
|   |       |-- LedgerEntryType.cs     (Earn, Redeem, Expire)
|   |       |-- RewardType.cs          (Discount, BonusPoints, FreeWash)
|   |       |-- NotificationType.cs    (PointsExpiry, TierChange, Promotion, BookingUpdate)
|   |       `-- SystemUserRole.cs      (Admin, Staff)
|   `-- Migrations/                    (auto-generated, never hand-edit)
`-- AutoWashPro.DAL.csproj

AutoWashPro.BLL/
|-- Services/
|   |-- Interfaces/
|   |   |-- IAuthService.cs
|   |   |-- IBookingService.cs
|   |   |-- ICheckoutService.cs
|   |   |-- ICustomerService.cs
|   |   |-- ILoyaltyService.cs
|   |   |-- INotificationService.cs
|   |   |-- IPromotionService.cs
|   |   `-- IServiceCatalogService.cs
|   |-- AuthService.cs
|   |-- BookingService.cs
|   |-- CheckoutService.cs
|   |-- CustomerService.cs
|   |-- LoyaltyService.cs
|   |-- NotificationService.cs
|   |-- PromotionService.cs
|   `-- ServiceCatalogService.cs
|-- DTOs/
|   |-- Auth/
|   |-- Booking/
|   |-- Checkout/
|   |-- Customer/
|   |-- Service/
|   `-- Admin/
|-- Common/
|   |-- Result.cs
|   |-- AppConstants.cs
|   `-- Extensions/
|       `-- DateTimeExtensions.cs
`-- AutoWashPro.BLL.csproj

AutoWashPro.API/
|-- Controllers/
|   |-- AuthController.cs
|   |-- BookingController.cs
|   |-- CheckoutController.cs          (admin-facing)
|   |-- CustomerController.cs
|   |-- ServiceController.cs           (public)
|   `-- Admin/
|       |-- AdminBookingController.cs
|       |-- AdminCustomerController.cs
|       |-- AdminPromotionController.cs
|       |-- AdminReportController.cs
|       |-- AdminServiceController.cs
|       `-- AdminTierController.cs
|-- Jobs/
|   `-- MonthlyMaintenanceJob.cs
|-- Middleware/
|   |-- ExceptionHandlingMiddleware.cs
|   `-- RequestLoggingMiddleware.cs
|-- appsettings.json
|-- appsettings.Development.json
|-- appsettings.Production.json
|-- Program.cs
|-- AutoWashPro.API.csproj
`-- AutoWashPro.API.sln
```

---

## Entity Specifications

### Customer
```csharp
public Guid CustomerId { get; set; }        // PK
public string FullName { get; set; }
public string PhoneNumber { get; set; }     // UNIQUE
public string PasswordHash { get; set; }
public Guid TierId { get; set; }            // FK → TierConfig
public int PointsBalance { get; set; }      // denormalized cache
public DateTime CreatedAt { get; set; }
public DateTime UpdatedAt { get; set; }
public TierConfig TierConfig { get; set; }  // nav
public ICollection<Vehicle> Vehicles { get; set; }
public ICollection<Booking> Bookings { get; set; }
public ICollection<PointsLedger> LedgerEntries { get; set; }
public ICollection<Notification> Notifications { get; set; }
```

### Vehicle
```csharp
public Guid VehicleId { get; set; }         // PK
public Guid CustomerId { get; set; }        // FK → Customer
public string LicensePlate { get; set; }    // UNIQUE
public string VehicleType { get; set; }     // "Scooter" | "Manual" | etc.
public string? Brand { get; set; }
public DateTime CreatedAt { get; set; }
```

### Service
```csharp
public Guid ServiceId { get; set; }         // PK
public string Name { get; set; }
public string? Description { get; set; }
public bool IsActive { get; set; }
public DateTime CreatedAt { get; set; }
public ICollection<ServicePricing> Pricings { get; set; }
```

### ServicePricing  ← ADDED is_active + created_at (Fix F1)
```csharp
public Guid PricingId { get; set; }         // PK
public Guid ServiceId { get; set; }         // FK → Service
public string VehicleType { get; set; }
public decimal Price { get; set; }
public int DurationMinutes { get; set; }    // must be multiple of 30
public bool IsActive { get; set; }          // FIX F1
public DateTime CreatedAt { get; set; }     // FIX F1
public Service Service { get; set; }        // nav
```

### Booking
```csharp
public Guid BookingId { get; set; }         // PK
public Guid? CustomerId { get; set; }       // NULLABLE — null for walk-ins (C2 fix)
public Guid? VehicleId { get; set; }        // NULLABLE — null for walk-ins
public Guid PricingId { get; set; }         // FK → ServicePricing
public Guid? PromotionId { get; set; }      // NULLABLE
public Guid? CreatedBy { get; set; }        // NULLABLE FK → SystemUser (C1 fix); null = customer self-booked
public DateTime ScheduledAt { get; set; }
public DateTime ExpectedEndAt { get; set; } // = ScheduledAt + DurationMinutes (BR-02)
public DateTime? CompletedAt { get; set; }
public BookingStatus Status { get; set; }   // Confirmed | Completed | Cancelled (no Pending, C6 fix)
public int PointsEarned { get; set; }
public int PointsRedeemed { get; set; }
public string? PerksApplied { get; set; }
public string? CancelReason { get; set; }
public string? WalkinPhone { get; set; }    // required if CustomerId is null
public string? WalkinLicensePlate { get; set; } // required if CustomerId is null
public decimal BasePrice { get; set; }
public decimal FinalPrice { get; set; }
public DateTime CreatedAt { get; set; }
// navs
public Customer? Customer { get; set; }
public Vehicle? Vehicle { get; set; }
public ServicePricing Pricing { get; set; }
public Promotion? Promotion { get; set; }
public SystemUser? CreatedByUser { get; set; }
```

### PointsLedger
```csharp
public Guid EntryId { get; set; }           // PK
public Guid CustomerId { get; set; }        // FK → Customer
public Guid? BookingId { get; set; }        // NULLABLE (expiry entries have no booking)
public LedgerEntryType Type { get; set; }   // Earn | Redeem | Expire
public int Points { get; set; }             // positive = earned; negative = spent/expired
public DateOnly ExpiryDate { get; set; }    // 12 months from created_at for Earn entries
public string? Note { get; set; }
public DateTime CreatedAt { get; set; }
public bool NearExpiryNotified { get; set; } // tracks whether 30d warning was sent (C4 fix)
```

### TierConfig
```csharp
public Guid TierId { get; set; }            // PK
public string TierName { get; set; }        // Member | Silver | Gold | Platinum
public int RankOrder { get; set; }          // 1=Member, 2=Silver, 3=Gold, 4=Platinum
public int BookingWindowDays { get; set; }
public int MinVisitsPerMonth { get; set; }
public decimal MinSpendPerMonth { get; set; }
public int PointsPerWash { get; set; }
public string? PerksDescription { get; set; }
public DateTime UpdatedAt { get; set; }
```

### Promotion
```csharp
public Guid PromotionId { get; set; }       // PK
public string Name { get; set; }
public string? Description { get; set; }
public DateOnly StartDate { get; set; }
public DateOnly EndDate { get; set; }
public Guid MinTierId { get; set; }         // FK → TierConfig
public RewardType RewardType { get; set; }
public decimal RewardValue { get; set; }
public bool IsActive { get; set; }
public DateTime CreatedAt { get; set; }
public TierConfig MinTier { get; set; }     // nav
```

### SystemUser
```csharp
public Guid UserId { get; set; }            // PK
public string FullName { get; set; }
public string Email { get; set; }           // UNIQUE
public string PasswordHash { get; set; }
public SystemUserRole Role { get; set; }    // Admin | Staff
public DateTime CreatedAt { get; set; }
```

### Notification
```csharp
public Guid NotificationId { get; set; }    // PK
public Guid CustomerId { get; set; }        // FK → Customer
public string Title { get; set; }
public string Message { get; set; }
public NotificationType Type { get; set; }
public bool IsRead { get; set; }
public DateTime CreatedAt { get; set; }
public Customer Customer { get; set; }      // nav
```

---

## EF Core Configuration Rules
- All enums: `.HasConversion<string>()` — store as string, not int
- `PhoneNumber` on Customer: `.HasIndex(c => c.PhoneNumber).IsUnique()`
- `LicensePlate` on Vehicle: `.HasIndex(v => v.LicensePlate).IsUnique()`
- `Email` on SystemUser: `.HasIndex(u => u.Email).IsUnique()`
- `Booking.CustomerId`: `.IsRequired(false)` — nullable FK
- `Booking.VehicleId`: `.IsRequired(false)` — nullable FK
- `Booking.CreatedBy`: `.IsRequired(false)` — nullable FK
- `Booking.PromotionId`: `.IsRequired(false)` — nullable FK
- `decimal` columns: `.HasPrecision(18, 2)`
- All `CreatedAt` / `UpdatedAt`: set default in EF or in constructor
- Cascade delete: default ON DELETE NO ACTION for optional FKs (walk-in nullables)

### EF Core Migration Commands
Run from `AutoWashPro.API/` because the startup project owns `Program.cs` and appsettings:

```sh
dotnet ef migrations add <MigrationName> --project ../AutoWashPro.DAL/AutoWashPro.DAL.csproj --startup-project AutoWashPro.API.csproj
dotnet ef database update --project ../AutoWashPro.DAL/AutoWashPro.DAL.csproj --startup-project AutoWashPro.API.csproj
```

---

## appsettings.json Structure
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=AutoWashPro;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "SecretKey": "SET_VIA_ENV_VAR_AUTOWASH_JWT_SECRET",
    "Issuer": "AutoWashPro.API",
    "Audience": "AutoWashPro.Client",
    "ExpiryMinutes": 1440
  },
  "BookingSettings": {
    "SlotDurationMinutes": 30,
    "MaxCapacityPerSlot": 4,
    "PointValueInVND": 100
  },
  "SeedSettings": {
    "DefaultAdminEmail": "SET_VIA_ENV_VAR",
    "DefaultAdminPassword": "SET_VIA_ENV_VAR"
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173" ]
  }
}
```

---

## AppConstants.cs
```csharp
public static class AppConstants
{
    public static readonly Guid GuestCustomerGuid =
        Guid.Parse("00000000-0000-0000-0000-000000000001");
}
// NOTE: SlotDurationMinutes and MaxCapacityPerSlot are read from IConfiguration
// in BookingService constructor — NOT from AppConstants — so tests can override them.
```

---

## Result<T> Pattern
```csharp
// Common/Result.cs
public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Value { get; private set; }
    public string? Error { get; private set; }

    public static Result<T> Ok(T value) => new() { IsSuccess = true, Value = value };
    public static Result<T> Fail(string error) => new() { IsSuccess = false, Error = error };
}
// Controllers check result.IsSuccess; return Ok(result.Value) or BadRequest(result.Error)
```

---

## Program.cs Registration Order (must follow this order)
```csharp
// 1. DbContext
// 2. JWT Authentication
// 3. Authorization Policies (AdminOnly, StaffOrAdmin, CustomerOnly)
// 4. Scoped Services (all IXxxService → XxxService)
// 5. Hosted Service (MonthlyMaintenanceJob)
// 6. CORS (read origins from config)
// 7. Swagger
// --- app.Build() ---
// 8. ExceptionHandlingMiddleware   ← MUST BE FIRST
// 9. RequestLoggingMiddleware
// 10. app.UseCors()
// 11. app.UseAuthentication()
// 12. app.UseAuthorization()
// 13. app.MapControllers()
// 14. app.UseSwagger() / app.UseSwaggerUI()
```

---

## Coding Conventions
- **Naming:** PascalCase classes/methods; camelCase locals; `_fieldName` for private fields
- **Async:** All DB operations async (`await`); method names end with `Async`
- **Services:** Return `Result<T>`; never throw for business violations; throw only for infra failures
- **Transactions:** `await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable)` for booking creation
- **Logging:** `ILogger<T>` injected via constructor on all services and controllers
- **DTOs:** Separate Request/Response DTOs — never expose entity classes directly
- **No raw SQL** except the capacity overlap query (use LINQ everywhere else)
- **No static state** — all configuration via `IConfiguration` injection

---

## Key Business Logic Reminders
1. `RoundDownToSlot(DateTime dt)` — snap to nearest 30-min boundary before any capacity check
2. Capacity check loop iterates each 30-min interval from `scheduledAt` to `expectedEndAt`
3. Walk-in: if phone matches existing Customer → set `CustomerId`; else `CustomerId = null`
4. Checkout discount: compute `promoDiscount` as: `Discount→rewardValue`, `FreeWash→basePrice`, `BonusPoints→0`. Then `finalPrice = Max(0, basePrice - promoDiscount - pointsDiscountValue)`
5. Points earned: `tierConfig.PointsPerWash + (promotion?.RewardType == BonusPoints ? promotion.RewardValue : 0)`
6. `POINTS_LEDGER` is append-only — never UPDATE or DELETE existing rows (BR-09)
7. Monthly job: Phase A (expiry) → Phase B (tier review). Both wrapped per-customer in separate transactions

---

## Seed Data (Phase 0)
```csharp
// TIER_CONFIG — 4 rows, immutable
// Member:   rank=1, window=7,  visits=0, spend=0,    pts=5
// Silver:   rank=2, window=10, visits=3, spend=150000, pts=8
// Gold:     rank=3, window=12, visits=6, spend=300000, pts=12
// Platinum: rank=4, window=14, visits=10, spend=500000, pts=20

// Guest Customer — fixed GUID, phone="WALK-IN", tier=Member
// Do NOT link actual walk-in bookings to this record; it's a reporting placeholder.

// Default Admin — from SeedSettings env vars; role=Admin
```

---

## What NOT To Do
- Do NOT create microservices, message queues, or projects beyond `AutoWashPro.API`, `AutoWashPro.BLL`, and `AutoWashPro.DAL`
- Do NOT use `WidthType.PERCENTAGE` (Swagger-only concern — irrelevant here)
- Do NOT hard-code JWT secrets, admin passwords, or connection strings
- Do NOT use `BookingStatus.Pending` (removed by decision D3)
- Do NOT link walk-in bookings to Guest Customer GUID (decision D1/D2)
- Do NOT set `created_by` on customer self-bookings (decision D2)
- Do NOT write to `POINTS_LEDGER` with UPDATE or DELETE (BR-09)
- Do NOT trust `expected_end_at` from client requests (BR-02)
- Do NOT check capacity outside a Serializable transaction (decision D4)
- Do NOT reference `AppConstants.SlotDurationMinutes` inside `BookingService` — use `IConfiguration`
