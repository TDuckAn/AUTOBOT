# AutoWash Pro Database Guide

Use this file to generate SQL Server seed/test data for the AutoWash Pro API.

## Database

- Provider: SQL Server
- Database name: `AutoWashPro`
- ORM: EF Core 9 code-first
- Important convention: enum columns are stored as strings, not integers.
- Date/time convention: use UTC `datetime2` values for `CreatedAt`, `UpdatedAt`, `ScheduledAt`, `ExpectedEndAt`, `CompletedAt`.
- Date-only columns use SQL `date`.

## Seeded Tier IDs

These rows already exist in `TierConfigs`.

| Tier | TierId | Rank | BookingWindowDays | MinVisitsPerMonth | MinSpendPerMonth | PointsPerWash |
|---|---|---:|---:|---:|---:|---:|
| Member | `11111111-1111-1111-1111-111111111111` | 1 | 7 | 0 | 0 | 5 |
| Silver | `22222222-2222-2222-2222-222222222222` | 2 | 10 | 3 | 150000 | 8 |
| Gold | `33333333-3333-3333-3333-333333333333` | 3 | 12 | 6 | 300000 | 12 |
| Platinum | `44444444-4444-4444-4444-444444444444` | 4 | 14 | 10 | 500000 | 20 |

## Reserved Guest Customer

This row already exists:

- `CustomerId`: `00000000-0000-0000-0000-000000000001`
- `FullName`: `Guest Customer`
- `PhoneNumber`: `WALK-IN`

Do not link real walk-in bookings to this customer. Real walk-ins should use `Bookings.CustomerId = NULL`.

## Enums

Store these exact string values:

- `BookingStatus`: `Confirmed`, `Completed`, `Cancelled`
- `LedgerEntryType`: `Earn`, `Redeem`, `Expire`
- `RewardType`: `Discount`, `BonusPoints`, `FreeWash`
- `NotificationType`: `PointsExpiry`, `TierChange`, `Promotion`, `BookingUpdate`
- `SystemUserRole`: `Admin`, `Staff`

## Tables

### TierConfigs

Already seeded. You can update but normally do not insert more unless testing tier configuration.

- `TierId` uniqueidentifier PK
- `TierName` nvarchar(50), unique
- `RankOrder` int, unique
- `BookingWindowDays` int
- `MinVisitsPerMonth` int
- `MinSpendPerMonth` decimal(18,2)
- `PointsPerWash` int
- `PerksDescription` nvarchar(500), nullable
- `UpdatedAt` datetime2

### Customers

- `CustomerId` uniqueidentifier PK
- `FullName` nvarchar(150)
- `PhoneNumber` nvarchar(30), unique
- `PasswordHash` nvarchar(255), BCrypt hash
- `TierId` uniqueidentifier FK to `TierConfigs.TierId`
- `PointsBalance` int
- `CreatedAt` datetime2
- `UpdatedAt` datetime2

Notes:
- Do not use `PhoneNumber = WALK-IN` except for the reserved guest row.
- For login-capable generated customers, create a BCrypt hash for a known password.

### Vehicles

- `VehicleId` uniqueidentifier PK
- `CustomerId` uniqueidentifier FK to `Customers.CustomerId`
- `LicensePlate` nvarchar(30), unique
- `VehicleType` nvarchar(50), examples: `Scooter`, `Manual`, `Sedan`, `SUV`
- `Brand` nvarchar(100), nullable
- `CreatedAt` datetime2

### Services

- `ServiceId` uniqueidentifier PK
- `Name` nvarchar(120)
- `Description` nvarchar(500), nullable
- `IsActive` bit
- `CreatedAt` datetime2

### ServicePricings

- `PricingId` uniqueidentifier PK
- `ServiceId` uniqueidentifier FK to `Services.ServiceId`
- `VehicleType` nvarchar(50)
- `Price` decimal(18,2)
- `DurationMinutes` int
- `IsActive` bit
- `CreatedAt` datetime2

Constraint:
- `DurationMinutes > 0`
- `DurationMinutes` must be a multiple of 30.

### SystemUsers

- `UserId` uniqueidentifier PK
- `FullName` nvarchar(150)
- `Email` nvarchar(255), unique
- `PasswordHash` nvarchar(255), BCrypt hash
- `Role` nvarchar(30): `Admin` or `Staff`
- `CreatedAt` datetime2

Notes:
- Generate at least one `Admin` and one `Staff` account for API testing.

### Promotions

- `PromotionId` uniqueidentifier PK
- `Name` nvarchar(120)
- `Description` nvarchar(500), nullable
- `StartDate` date
- `EndDate` date
- `MinTierId` uniqueidentifier FK to `TierConfigs.TierId`
- `RewardType` nvarchar(30): `Discount`, `BonusPoints`, `FreeWash`
- `RewardValue` decimal(18,2)
- `IsActive` bit
- `CreatedAt` datetime2

Notes:
- `Discount`: `RewardValue` is VND discount amount.
- `BonusPoints`: `RewardValue` is point count.
- `FreeWash`: discount equals booking base price; `RewardValue` can be `0`.
- `StartDate` must be on or before `EndDate`.

### Bookings

- `BookingId` uniqueidentifier PK
- `CustomerId` uniqueidentifier nullable FK to `Customers.CustomerId`
- `VehicleId` uniqueidentifier nullable FK to `Vehicles.VehicleId`
- `PricingId` uniqueidentifier FK to `ServicePricings.PricingId`
- `PromotionId` uniqueidentifier nullable FK to `Promotions.PromotionId`
- `CreatedBy` uniqueidentifier nullable FK to `SystemUsers.UserId`
- `ScheduledAt` datetime2
- `ExpectedEndAt` datetime2
- `CompletedAt` datetime2 nullable
- `Status` nvarchar(30): `Confirmed`, `Completed`, `Cancelled`
- `PointsEarned` int
- `PointsRedeemed` int
- `PerksApplied` nvarchar(500), nullable
- `CancelReason` nvarchar(500), nullable
- `WalkinPhone` nvarchar(30), nullable
- `WalkinLicensePlate` nvarchar(30), nullable
- `BasePrice` decimal(18,2)
- `FinalPrice` decimal(18,2)
- `CreatedAt` datetime2

Rules:
- `ExpectedEndAt = ScheduledAt + ServicePricings.DurationMinutes`.
- Customer self-booking: `CustomerId` set, `VehicleId` set, `CreatedBy = NULL`.
- Staff walk-in with matching customer: `CustomerId` may be set, `CreatedBy` set to staff/admin user.
- Anonymous walk-in: `CustomerId = NULL`, `VehicleId = NULL`, `CreatedBy` set, and both `WalkinPhone` and `WalkinLicensePlate` required.
- Do not use `Pending`.

Capacity rule:
- Max active overlapping bookings per 30-minute slot comes from config, default `4`.
- Ignore `Cancelled` bookings for capacity.

### PointsLedgers

Append-only ledger. Do not update or delete existing rows except `NearExpiryNotified`.

- `EntryId` uniqueidentifier PK
- `CustomerId` uniqueidentifier FK to `Customers.CustomerId`
- `BookingId` uniqueidentifier nullable FK to `Bookings.BookingId`
- `Type` nvarchar(30): `Earn`, `Redeem`, `Expire`
- `Points` int
- `ExpiryDate` date
- `Note` nvarchar(500), nullable
- `CreatedAt` datetime2
- `NearExpiryNotified` bit

Rules:
- `Earn`: `Points` positive, `ExpiryDate` usually `CreatedAt + 12 months`.
- `Redeem`: `Points` negative.
- `Expire`: `Points` negative, often `BookingId = NULL`.
- `Customers.PointsBalance` should equal the sum of ledger `Points` for that customer.

### Notifications

- `NotificationId` uniqueidentifier PK
- `CustomerId` uniqueidentifier FK to `Customers.CustomerId`
- `Title` nvarchar(150)
- `Message` nvarchar(1000)
- `Type` nvarchar(30): `PointsExpiry`, `TierChange`, `Promotion`, `BookingUpdate`
- `IsRead` bit
- `CreatedAt` datetime2

### SystemConfigs

Used by background jobs.

- `Key` nvarchar(120) PK
- `Value` nvarchar(500)
- `UpdatedAt` datetime2

Known key:
- `maintenance:last-monthly-run`, value format `yyyy-MM`, for example `2026-05`.

## Recommended Insert Order

1. Use existing `TierConfigs`.
2. Insert `SystemUsers`.
3. Insert `Customers`.
4. Insert `Vehicles`.
5. Insert `Services`.
6. Insert `ServicePricings`.
7. Insert `Promotions`.
8. Insert `Bookings`.
9. Insert `PointsLedgers`.
10. Update `Customers.PointsBalance` to match ledger totals.
11. Insert `Notifications`.
12. Optionally insert/update `SystemConfigs`.

## Recommended Test Dataset

Generate enough data for these cases:

- 1 admin user and 1 staff user with known passwords.
- 10-20 customers across Member, Silver, Gold, Platinum.
- 1-3 vehicles per customer.
- 3-5 active services.
- Pricing variants for each service and common vehicle type.
- Promotions:
  - one `Discount`
  - one `BonusPoints`
  - one `FreeWash`
  - one expired promotion
  - one inactive promotion
- Bookings:
  - future `Confirmed` bookings
  - past `Completed` bookings
  - `Cancelled` bookings
  - customer bookings
  - staff-created walk-in bookings with `CustomerId = NULL`
  - enough overlapping bookings to test capacity limit
- Ledger rows:
  - earned points expiring in 30 days
  - expired earn rows
  - redeem rows
  - expire rows
- Notifications of each type.

## Password Hashing

The API uses BCrypt.Net-Next. If generating accounts, hash a known password with BCrypt.

Example known test passwords:

- Admin: `Admin123!`
- Staff: `Staff123!`
- Customers: `Customer123!`

Store only the BCrypt hash in `PasswordHash`.
