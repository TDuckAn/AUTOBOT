# AGENT.md — AutoWash Pro Copilot Quick Reference
> GitHub Copilot (Student): Load this as context. Use patterns below for all suggestions.  
> Full specs: AGENTS.md · Full plan: PLAN.md · Planning decisions: CLAUDE.md

---

## Project at a Glance
- **AutoWash Pro** — motorbike wash management: loyalty tiers, advance booking, walk-in support
- **Stack:** ASP.NET Core 9 Web API · EF Core 9 · SQL Server · JWT Bearer · React 18 + Vite 5
- **Architecture:** 3-layer backend monolith — API Controllers → BLL Services → DAL Data; Staff/Admin frontend in `AutoWashPro.Web`
- **Pattern:** Services return `Result<T>` (never throw for business errors)

---

## Entities Quick Reference

| Entity | PK | Key Nullables | Key Constraints |
|--------|-----|--------------|----------------|
| `Customer` | `CustomerId` | — | `PhoneNumber` UNIQUE |
| `Vehicle` | `VehicleId` | `Brand` | `LicensePlate` UNIQUE |
| `Service` | `ServiceId` | `Description` | — |
| `ServicePricing` | `PricingId` | — | `DurationMinutes` % 30 == 0 |
| `Booking` | `BookingId` | `CustomerId`✱ `VehicleId`✱ `PromotionId` `CreatedBy`✱ `WalkinPhone` `WalkinLicensePlate` `PerksApplied` `CancelReason` `CompletedAt` | `ExpectedEndAt` = backend-computed |
| `PointsLedger` | `EntryId` | `BookingId` `Note` | Append-only, never UPDATE/DELETE |
| `TierConfig` | `TierId` | `PerksDescription` | Seeded, immutable at runtime |
| `Promotion` | `PromotionId` | `Description` | DateOnly start/end |
| `SystemUser` | `UserId` | — | `Email` UNIQUE |
| `Notification` | `NotificationId` | — | — |

✱ = walk-in bookings: `CustomerId=null`, `VehicleId=null`, `CreatedBy`=staff UserId

---

## Enums (stored as string in DB)
```csharp
enum BookingStatus    { Confirmed, Completed, Cancelled }   // NO Pending
enum LedgerEntryType  { Earn, Redeem, Expire }
enum RewardType       { Discount, BonusPoints, FreeWash }
enum NotificationType { PointsExpiry, TierChange, Promotion, BookingUpdate }
enum SystemUserRole   { Admin, Staff }
```

---

## Service Layer Pattern
```csharp
public async Task<Result<BookingResponseDto>> CreateBookingAsync(
    CreateBookingRequestDto dto, Guid customerId)
{
    // 1. Load deps → return Result.Fail("...") if not found
    // 2. Validate business rules → return Result.Fail("...") if violated
    // 3. Persist inside transaction
    // 4. return Result.Ok(dto);
}
```

---

## Capacity Check (critical — always Serializable)
```csharp
await using var tx = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable);
var count = await _db.Bookings
    .Where(b => b.Status != BookingStatus.Cancelled
             && b.ScheduledAt < expectedEndAt
             && b.ExpectedEndAt > scheduledAt)
    .CountAsync();
if (count >= _maxCapacity) return Result.Fail("Slot fully booked.");
// INSERT booking here, then:
await tx.CommitAsync();
```

---

## Auth Claims Pattern
```csharp
// JWT claims:
// Customer token: ClaimTypes.NameIdentifier = customerId, ClaimTypes.Role = "Customer"
// SystemUser token: ClaimTypes.NameIdentifier = userId, ClaimTypes.Role = "Admin" | "Staff"

// Extract in controller:
var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
```

---

## Controller Pattern
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "CustomerOnly")]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingController> _logger;

    public BookingController(IBookingService bookingService, ILogger<BookingController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequestDto dto)
    {
        var customerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _bookingService.CreateBookingAsync(dto, customerId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
```

---

## Pagination Pattern (all list endpoints)
```csharp
// Query param: ?page=1&pageSize=20
public async Task<Result<PagedResult<T>>> GetPagedAsync(int page = 1, int pageSize = 20)
{
    var query = _db.SomeTable.AsQueryable();
    var total = await query.CountAsync();
    var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    return Result.Ok(new PagedResult<T> { Items = items, Total = total, Page = page, PageSize = pageSize });
}
```

---

## DateTimeExtensions
```csharp
// Round down to nearest 30-min slot
public static DateTime RoundDownToSlot(this DateTime dt, int slotMinutes = 30)
    => new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour,
                    (dt.Minute / slotMinutes) * slotMinutes, 0, dt.Kind);
```

---

## Checkout Price Calculation (unified — no late override)
```csharp
decimal promoDiscount = promotion?.RewardType switch {
    RewardType.Discount   => promotion.RewardValue,
    RewardType.FreeWash   => basePrice,
    RewardType.BonusPoints => 0m,
    _ => 0m
};
decimal pointsDiscount = pointsToRedeem * _pointValueInVND;
decimal finalPrice = Math.Max(0m, basePrice - promoDiscount - pointsDiscount);
```

---

## Points Ledger — Append-Only Writes
```csharp
// Earn
_db.PointsLedger.Add(new PointsLedger {
    CustomerId = customerId, BookingId = bookingId,
    Type = LedgerEntryType.Earn, Points = pointsEarned,
    ExpiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(12)),
    Note = $"Earned from booking {bookingId}", CreatedAt = DateTime.UtcNow
});

// Redeem (negative)
_db.PointsLedger.Add(new PointsLedger {
    Type = LedgerEntryType.Redeem, Points = -pointsToRedeem, ...
});

// NEVER: _db.PointsLedger.Update(...) or _db.PointsLedger.Remove(...)
```

---

## Notification Creation (fire-and-forget inside transaction)
```csharp
if (booking.CustomerId.HasValue)
{
    _db.Notifications.Add(new Notification {
        CustomerId = booking.CustomerId.Value,
        Type = NotificationType.BookingUpdate,
        Title = "Wash Complete!",
        Message = $"You earned {pointsEarned} points. Balance: {newBalance}.",
        CreatedAt = DateTime.UtcNow
    });
}
```

---

## Walk-in Booking Key Logic
```csharp
// Attempt customer lookup by phone
var existing = await _db.Customers
    .FirstOrDefaultAsync(c => c.PhoneNumber == dto.WalkInPhone);

Guid? customerId = existing?.CustomerId;  // null if no match

// Walk-in booking must have walkin fields
if (!customerId.HasValue)
{
    booking.WalkinPhone = dto.WalkInPhone;
    booking.WalkinLicensePlate = dto.WalkInLicensePlate;
}
booking.CreatedBy = staffUserId;  // always set for walk-ins
```

---

## Authorization Policies (reference)
| Policy | Roles | Used on |
|--------|-------|---------|
| `CustomerOnly` | Customer | Customer booking, profile, loyalty |
| `StaffOrAdmin` | Staff, Admin | Walk-in, complete, booking queue |
| `AdminOnly` | Admin | Tier config, promotions, reports, service CRUD |

---

## Frontend Quick Reference (AutoWashPro.Web)

```js
// API calls — import from src/api/<domain>.js, all go through axios client with Bearer header
import { getQueue, completeBooking } from '../api/bookings.js'
import { unwrapPaged, getApiError } from '../api/client.js'   // unwrapPaged → items[]

// Auth — JWT in localStorage, role claim is the full MS URI
import { getRole, setToken, clearToken, isAuthenticated } from '../hooks/useAuth.js'
// Roles: 'Staff' | 'Admin'  (exact strings)

// Formatting
import { formatVND, formatVNDShort, formatTime } from '../utils/format.js'
```

CSS uses `.aw-*` classes from `src/styles/design-system.css` — **no Tailwind**.
Key classes: `.aw-btn[-primary|-green|-ghost|-danger|-sm|-lg]` · `.aw-input` · `.aw-card` · `.aw-table` · `.aw-badge[-green|-blue|-amber|-neutral]` · `.aw-tier-badge .aw-tier-[dong|bac|vang|platinum]`

CSS vars: `--primary` (ocean teal) · `--green` · `--gold` · `--danger` · `--sidebar-bg` (#111318) · `--ink-900/700/500/400` · `--border` · `--surface`

---

## Files to Create Per Phase
- **Ph 0:** All entity files + AppDbContext + Result.cs + AppConstants.cs + DateTimeExtensions.cs + appsettings.json + Program.cs skeleton
- **Ph 1:** AuthController + AuthService + ExceptionHandlingMiddleware + JWT config in Program.cs
- **Ph 2:** ServiceController + AdminServiceController + ServiceCatalogService + service DTOs
- **Ph 3:** BookingController + AdminBookingController + BookingService + booking DTOs
- **Ph 4:** CheckoutController + CheckoutService + CustomerController + LoyaltyService + NotificationService + customer/checkout DTOs
- **Ph 5:** Admin controllers (Customer, Promotion, Tier, Report) + PromotionService + admin DTOs
- **Ph 6:** MonthlyMaintenanceJob + RequestLoggingMiddleware
- **Ph 7:** Pagination audit + Swagger config + input validation + CORS from config
- **Ph 9:** `AutoWashPro.Web` Vite app + staff/admin login, queue, walk-in, dashboard, services, promotions, tiers, customers
