# AutoWash Pro — Master Build Plan
> **Stack:** React + ASP.NET Core 9 Web API + SQL Server + EF Core 9  
> **Claude:** Plans each phase, reviews decisions, resolves ambiguity  
> **Codex:** Implements each phase following CODEX.md  
> **Copilot:** Assists in-editor following AGENT.md  
> **Context files:** CLAUDE.md · CODEX.md · AGENT.md (load at session start to restore context)

---

## SECTION 1 — Analysis

### 🔴 Critical (Bad — will cause bugs if not fixed before build)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| C1 | `BOOKING.created_by` FK targets `SYSTEM_USER` but customer self-bookings have no SYSTEM_USER record → NOT NULL constraint impossible | SYSTEM_SPEC §2.2, BR-04 | Make `created_by` **nullable UUID**. Null = customer self-booking. Non-null = staff walk-in user_id |
| C2 | SRS v2/v3 say walk-ins use "Guest Customer record"; SYSTEM_SPEC says `customer_id = NULL`. Conflict. | SRS v2 §6.4 vs SYSTEM_SPEC BR-04 | **Follow SYSTEM_SPEC**: `customer_id = NULL` for walk-ins. Guest Customer GUID is reporting-only, never a FK target on actual bookings |
| C3 | Capacity check is check-then-insert → TOCTOU race: two concurrent requests both pass the check, both insert, capacity exceeded | SYSTEM_SPEC Flow 1 Step 4 | Wrap availability check + insert in `IsolationLevel.Serializable` transaction to block phantom reads |
| C4 | FR-LE-05: notify customers 30 days before point expiry. Monthly job on the 1st cannot catch points expiring mid-month after the job already ran | SYSTEM_SPEC Phase A | Add a **second daily/weekly job** (or a pre-expiry scan at month N-1) that queries `POINTS_LEDGER WHERE type='Earn' AND expiry_date BETWEEN NOW AND NOW+30d` and creates notifications |
| C5 | FreeWash promotion discount computed as late override (Flow 3 Step E) after `final_price` already calculated. BonusPoints reward type also not factored into discount. Results in incorrect final_price calculation path | SYSTEM_SPEC Flow 3 §3-4 | Resolve `promoDiscount` upfront: `Discount→reward_value`, `FreeWash→base_price`, `BonusPoints→0`. Remove Step E override. Compute `final_price` once |
| C6 | `BookingStatus.Pending` defined but never set — both flows create with `Confirmed` immediately. Dead code creates confusion | SYSTEM_SPEC §2.3 | **Remove `Pending`** from enum. Use only: `Confirmed`, `Completed`, `Cancelled` |

### 🟡 Fixable (Incorrect but not immediately breaking)

| # | Issue | Fix |
|---|-------|-----|
| F1 | `SERVICE_PRICING` missing `is_active` and `created_at` — inconsistent with all other tables | Add both fields |
| F2 | Member tier seed has no explicit `min_visits_per_month=0`, `min_spend_per_month=0` — tier review fallback logic depends on this | Seed Member with explicit zeros |
| F3 | Background job can run twice if server restarts on the 1st mid-execution | Track last-run month in DB (`SYSTEM_CONFIG` kv table or static field + persistent flag); skip if already ran this month |
| F4 | CORS origin `http://localhost:5173` hardcoded in Program.cs | Read from `appsettings.json → Cors:AllowedOrigins` array |
| F5 | No pagination on `GET /admin/bookings`, `GET /admin/customers`, `GET /customers/me/...` list endpoints | Add `?page=1&pageSize=20` query params; default pageSize=20 |

### 🟢 Improvements (Enhancement beyond spec — implement if time permits)

| # | Improvement |
|---|------------|
| I1 | Add `updated_at` to `BOOKING` and `PROMOTION` for basic audit trail |
| I2 | `PointValueInVND` (1 pt = 100 VND) configurable via appsettings; consider adding to a `SYSTEM_CONFIG` table for runtime admin update |
| I3 | JWT refresh token endpoint to avoid 24h re-login |
| I4 | Add `FluentValidation` for DTO validation instead of DataAnnotations |
| I5 | Swagger grouping by tag (Customer / Admin / Auth) for cleaner API docs |

### ✅ Good — Keep As-Is

- Single monolith (correct for 10-week timeline)  
- EF Core Code-First, no raw SQL except documented performance queries  
- `Result<T>` pattern — services never throw for business rule violations  
- Append-only `POINTS_LEDGER` (BR-09)  
- Time-range overlap query for capacity (not slot counting)  
- Business rules enforced at **Service layer**, not controller  
- `IConfiguration` injection in `BookingService` for slot/capacity values  

---

## SECTION 2 — Finalized Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Project type | Single ASP.NET Core Web API project | 10-week timeline; clean layer separation allows future extraction |
| ORM | EF Core 9 Code-First | Migrations managed; no raw SQL except performance-critical queries |
| Auth | JWT Bearer, 1440 min expiry | Stateless; two token types: Customer + SYSTEM_USER |
| Capacity locking | `IsolationLevel.Serializable` transaction | Prevents phantom reads during concurrent booking |
| Walk-in FK | `customer_id = NULL` (not Guest Customer GUID) | SYSTEM_SPEC is authoritative over SRS |
| `created_by` | Nullable FK → SYSTEM_USER | NULL = customer self-booking; non-null = staff created it |
| Points ledger | Append-only; balance cached in CUSTOMER.points_balance | Ledger is source of truth; cached field for fast reads |
| Background job | `BackgroundService` (IHostedService) | Simple, no extra dependencies; Hangfire only if complexity grows |
| Service pricing | Separate `SERVICE_PRICING` table | Supports different price/duration per vehicle type (v3 model) |
| Enum storage | Store as `string` via `.HasConversion<string>()` | Readable in DB; matches SYSTEM_SPEC §2.3 |

---

## SECTION 3 — Build Phases

> Each phase must produce **compilable, runnable code** before moving on.  
> Codex implements each phase in sequence. Claude reviews at each phase boundary.

---

### Phase 0 — Foundation
**Goal:** Empty DB schema with all tables, relationships, seeding. No business logic.

**Tasks:**
- [ ] Scaffold solution: `dotnet new webapi -n AutoWashPro.API`
- [ ] Add NuGet packages (EF Core SqlServer, EF Core Tools, JwtBearer, BCrypt.Net-Next, Swashbuckle)
- [ ] Create all entity classes in `Data/Entities/` (10 entities + 5 enums) — see CODEX.md §Entities
- [ ] Create `AppDbContext` with all `DbSet<>` and fluent configuration
- [ ] Configure relationships, nullable constraints, unique indexes, enum string conversions
- [ ] Apply fixes: C1 (`created_by` nullable), F1 (SERVICE_PRICING fields), F2 (Member seed zeros), C6 (remove Pending)
- [ ] Seed: TIER_CONFIG (4 rows), Guest Customer record, Default Admin from env vars
- [ ] Create `Common/Result.cs`, `Common/AppConstants.cs`, `Common/Extensions/DateTimeExtensions.cs`
- [ ] Create `appsettings.json` structure (see CODEX.md §Config)
- [ ] Create `Program.cs` skeleton (DbContext only, no auth yet)
- [ ] `dotnet ef migrations add InitialCreate && dotnet ef database update`

**Deliverable:** Database created with correct schema. `dotnet run` starts without error.

---

### Phase 1 — Authentication
**Goal:** Both user types can log in and receive JWT. Protected endpoints return 401.

**Tasks:**
- [ ] Configure JWT in `Program.cs` (read from appsettings)
- [ ] Add authorization policies: `AdminOnly`, `StaffOrAdmin`, `CustomerOnly`
- [ ] `AuthService`: BCrypt password hash/verify, JWT generation with role claim
- [ ] `POST /api/auth/customer/register` — validate unique phone, hash password, assign Member tier
- [ ] `POST /api/auth/customer/login` — phone + password → JWT with role=Customer
- [ ] `POST /api/auth/system/login` — email + password → JWT with role=Admin or Staff
- [ ] `ExceptionHandlingMiddleware` (RFC 7807 ProblemDetails) — add to pipeline
- [ ] Wire CORS from config (Fix F4)

**Deliverable:** Can register customer, login both user types, receive JWT. Protected endpoints reject without token.

---

### Phase 2 — Service Catalogue
**Goal:** Admin can manage services/pricing. Public can list them.

**Tasks:**
- [ ] `ServiceCatalogService`: list active services, get pricing by service, CRUD
- [ ] `GET /api/services` — list all active services (public, no auth)
- [ ] `GET /api/services/{id}/pricing` — list pricing variants by vehicle type (public)
- [ ] `POST /api/admin/services` — create service (AdminOnly)
- [ ] `PUT /api/admin/services/{id}` — update (AdminOnly)
- [ ] `POST /api/admin/services/{id}/pricing` — add pricing variant (AdminOnly)
- [ ] `PUT /api/admin/services/{id}/pricing/{pricingId}` — update pricing (AdminOnly)
- [ ] DTOs: `ServiceDto`, `ServicePricingDto`, `CreateServiceDto`, `CreatePricingDto`

**Deliverable:** Services and pricing manageable via API. Public endpoints return active services.

---

### Phase 3 — Booking Engine
**Goal:** Customers can check availability and book. Staff can create walk-ins. Customers can cancel.

**Tasks:**
- [ ] `DateTimeExtensions.RoundDownToSlot()` — snap timestamp to nearest 30-min boundary
- [ ] `BookingService.CheckSlotAvailabilityAsync()` — overlap query inside Serializable transaction (Fix C3)
- [ ] `GET /api/bookings/availability?date=&pricingId=` — return available slots array (CustomerOnly)
- [ ] `BookingService.CreateBookingAsync()` — Flow 1 full implementation (BR-01 through BR-08)
- [ ] `POST /api/bookings` — customer advance booking (CustomerOnly)
- [ ] `BookingService.CreateWalkInBookingAsync()` — Flow 2 full implementation (BR-04; C2: customer_id=NULL if no match)
- [ ] `POST /api/admin/bookings/walk-in` — staff walk-in booking (StaffOrAdmin)
- [ ] `DELETE /api/bookings/{id}` — customer cancels own booking (CustomerOnly)
- [ ] `GET /api/bookings/me` — customer's own bookings with pagination (Fix F5, CustomerOnly)
- [ ] `GET /api/admin/bookings` — all bookings with filters + pagination (StaffOrAdmin)
- [ ] `GET /api/admin/bookings/queue` — daily queue sorted by slot then tier rank (StaffOrAdmin)
- [ ] DTOs: `CreateBookingRequestDto`, `CreateWalkInBookingRequestDto`, `BookingResponseDto`, `AvailabilityRequestDto`

**Deliverable:** Full booking lifecycle working. Capacity enforced. Walk-in path functional.

---

### Phase 4 — Checkout & Loyalty
**Goal:** Staff can complete bookings. Points awarded/redeemed correctly. Customers see loyalty status.

**Tasks:**
- [ ] `CheckoutService.CompleteBookingAsync()` — Flow 3 with Fix C5 (FreeWash discount unified)
- [ ] `POST /api/admin/bookings/{id}/complete` — complete + reward engine (StaffOrAdmin)
- [ ] `LoyaltyService`: points balance, tier status, redemption validation
- [ ] `NotificationService`: create notification records (used by checkout + later by background job)
- [ ] `CustomerService`: profile CRUD, vehicle CRUD
- [ ] `GET /api/customers/me` — profile + tier (CustomerOnly)
- [ ] `PUT /api/customers/me` — update profile (CustomerOnly)
- [ ] `GET /api/customers/me/vehicles` — list (CustomerOnly)
- [ ] `POST /api/customers/me/vehicles` — add vehicle (CustomerOnly)
- [ ] `DELETE /api/customers/me/vehicles/{id}` — remove vehicle (CustomerOnly)
- [ ] `GET /api/customers/me/loyalty` — points balance + tier + ledger history (CustomerOnly)
- [ ] `GET /api/customers/me/notifications` — paginated notifications (CustomerOnly)
- [ ] DTOs: `CompleteBookingRequestDto`, `CheckoutSummaryDto`, `CustomerProfileDto`, `LoyaltyStatusDto`

**Deliverable:** Booking completion awards points correctly. Redemption at checkout works. Customer can view loyalty dashboard.

---

### Phase 5 — Admin Configuration & Reports
**Goal:** Admin can configure tiers/promotions. Dashboard shows operational data.

**Tasks:**
- [ ] `AdminTierController`: `GET /api/admin/tiers`, `PUT /api/admin/tiers/{id}` (AdminOnly)
- [ ] `AdminPromotionController`: full CRUD on PROMOTION (AdminOnly)
- [ ] `PromotionService`: validate promotion eligibility, date ranges
- [ ] `AdminCustomerController`: `GET /api/admin/customers` with filters + pagination, `PUT /api/admin/customers/{id}/tier` (AdminOnly)
- [ ] `AdminReportController`:
  - `GET /api/admin/reports/summary` — daily wash volume, revenue, active customers, slot utilisation
  - `GET /api/admin/reports/tier-review` — last monthly tier change log
- [ ] DTOs: `CreatePromotionDto`, `TierConfigDto`, `ReportSummaryDto`

**Deliverable:** Full admin configuration surface. Dashboard data accessible.

---

### Phase 6 — Background Jobs
**Goal:** Monthly maintenance runs automatically. Near-expiry notifications delivered.

**Tasks:**
- [ ] `MonthlyMaintenanceJob` (BackgroundService): calculates delay to next 1st of month
- [ ] **Phase A** — Point expiry: query expired POINTS_LEDGER entries, append Expire rows, update balances, create notifications
- [ ] **Phase B** — Tier review: per customer, compute 30-day rolling visits+spend, determine eligible tier, update if changed, notify
- [ ] Fix F3: track last-run month (in-memory + DB flag) to prevent double execution on restart
- [ ] Fix C4: add near-expiry scan — query `Earn` entries where `expiry_date BETWEEN NOW AND NOW+30d`, create `PointsExpiry` notification if not already sent this cycle
- [ ] Add `near_expiry_notified` boolean to `POINTS_LEDGER` OR check notification table for duplicate prevention

**Deliverable:** Monthly job runs correctly. Points expire. Tiers reviewed. 30-day warning notifications sent.

---

### Phase 7 — Quality & Polish
**Goal:** Production-ready: error handling, Swagger, pagination, security hardening.

**Tasks:**
- [ ] `RequestLoggingMiddleware` — log method, path, status, duration
- [ ] Ensure all list endpoints have pagination (Fix F5 — audit all GET list endpoints)
- [ ] Swagger: add `[SwaggerTag]` grouping, XML comments on controllers, Bearer token support in Swagger UI
- [ ] Input validation: add `[Required]`, `[MaxLength]` DataAnnotations on all DTOs; controller-level `ModelState` check or FluentValidation
- [ ] Verify CORS reads from config in all environments (Fix F4)
- [ ] `appsettings.Production.json` template with placeholder env vars
- [ ] Test all business rules end-to-end (BR-01 to BR-10) manually via Swagger
- [ ] Improvement I1: add `updated_at` to BOOKING and PROMOTION if time permits

**Deliverable:** Clean API documentation. All inputs validated. Error responses consistent RFC 7807 format.

---

## SECTION 4 — Supporting Files

| File | Purpose | Load when |
|------|---------|----------|
| `CLAUDE.md` | Planning context, decisions, issue tracker, phase status | Claude starts a new session |
| `CODEX.md` | Entity specs, conventions, patterns, EF config rules | Codex begins implementing a phase |
| `AGENT.md` | Quick codebase reference for in-editor autocomplete | Copilot is active in any source file |

---

## SECTION 5 — Phase Status Tracker

> Update this table as phases complete.

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Foundation | ✅ Completed | Initial schema migration applied to AutoWashPro database |
| 1 — Auth | ✅ Completed | JWT auth, role policies, customer/system login endpoints, exception middleware, and config-driven CORS implemented |
| 2 — Service Catalogue | ✅ Completed | Public catalogue reads and AdminOnly service/pricing management endpoints implemented |
| 3 — Booking Engine | ✅ Completed | Customer booking endpoints, staff walk-ins, availability, capacity checks, cancellation, pagination, and queue implemented |
| 4 — Checkout & Loyalty | ✅ Completed | Checkout completion, point ledger updates, loyalty/profile/vehicle/notification customer endpoints implemented |
| 5 — Admin Config & Reports | ✅ Completed | Admin tier/promotion/customer configuration and operational report endpoints implemented |
| 6 — Background Jobs | ✅ Completed | Monthly maintenance job, point expiry, tier review, persisted run flag, and near-expiry notifications implemented |
| 7 — Quality & Polish | ✅ Completed | Request logging, Swagger bearer docs, XML docs, pagination audit, production config template, and validation polish implemented |
