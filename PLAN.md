# AutoWash Pro — Master Build Plan
> **Stack:** React + ASP.NET Core 9 Web API + SQL Server + EF Core 9  
> **Claude:** Plans each phase, reviews decisions, resolves ambiguity  
> **Codex:** Implements each phase following AGENTS.md  
> **Copilot:** Assists in-editor following AGENT.md  
> **Context files:** CLAUDE.md · AGENTS.md · AGENT.md (load at session start to restore context)

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

- 3-project solution: API (presentation) · BLL (business logic) · DAL (data access)  
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
| Project structure | 3-project solution: **AutoWashPro.DAL** (entities, DbContext, migrations) · **AutoWashPro.BLL** (services, interfaces, DTOs, common) · **AutoWashPro.API** (controllers, middleware, jobs, Program.cs) | Clear layer boundaries; API → BLL → DAL dependency chain |
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

### Phase 8 — 3-Layer Architecture Refactor

**Goal:** Break the monolithic `AutoWashPro.API` into three proper projects following a strict API → BLL → DAL dependency chain. All existing functionality must continue to work after the move.

#### Layer Responsibilities

| Project | Contains | References |
| --- | --- | --- |
| `AutoWashPro.DAL` | Entities, Enums, `AppDbContext`, Migrations | EF Core SqlServer, EF Core Tools |
| `AutoWashPro.BLL` | Services, Service Interfaces, DTOs, `Common/` (Result, AppConstants, Extensions) | DAL project, BCrypt.Net-Next |
| `AutoWashPro.API` | Controllers, Middleware, Jobs, `Program.cs`, `appsettings*.json` | BLL project, JwtBearer, Swashbuckle |

#### Tasks

##### Step 1 — Register both new projects in the solution

```sh
# Run from the directory containing AutoWashPro.API.sln
dotnet sln add ../AutoWashPro.BLL/AutoWashPro.BLL.csproj
dotnet sln add ../AutoWashPro.DAL/AutoWashPro.DAL.csproj
```

##### Step 2 — Add NuGet packages to the correct projects

- `AutoWashPro.DAL.csproj`: add `Microsoft.EntityFrameworkCore.SqlServer` v9.\*, `Microsoft.EntityFrameworkCore.Tools` v9.\*
- `AutoWashPro.BLL.csproj`: add `BCrypt.Net-Next` v4.\*
- `AutoWashPro.API.csproj`: keep `Microsoft.AspNetCore.Authentication.JwtBearer` v9.\*, `Swashbuckle.AspNetCore` v6.\*; **remove** EF Core packages and BCrypt (they live in DAL/BLL now)

##### Step 3 — Add project-to-project references

- `AutoWashPro.BLL.csproj`: `<ProjectReference Include="..\AutoWashPro.DAL\AutoWashPro.DAL.csproj" />`
- `AutoWashPro.API.csproj`: `<ProjectReference Include="..\AutoWashPro.BLL\AutoWashPro.BLL.csproj" />`
- DAL is transitively available in API through BLL — no direct API → DAL reference needed

##### Step 4 — Move files from API into DAL

Move the entire `Data/` folder into `AutoWashPro.DAL/`:

```text
AutoWashPro.DAL/
├── Data/
│   ├── AppDbContext.cs
│   ├── Entities/
│   │   ├── Customer.cs, Vehicle.cs, Service.cs, ServicePricing.cs
│   │   ├── Booking.cs, PointsLedger.cs, TierConfig.cs, Promotion.cs
│   │   ├── SystemUser.cs, Notification.cs, SystemConfig.cs
│   │   └── Enums/
│   │       ├── BookingStatus.cs, LedgerEntryType.cs, RewardType.cs
│   │       └── NotificationType.cs, SystemUserRole.cs
│   └── Migrations/     (all existing migration files)
```

Update all namespaces: `AutoWashPro.API.Data.*` → `AutoWashPro.DAL.Data.*`

##### Step 5 — Move files from API into BLL

Move `Services/`, `Common/`, and `DTOs/` into `AutoWashPro.BLL/`:

```text
AutoWashPro.BLL/
├── Services/
│   ├── Interfaces/   (all IXxxService.cs files)
│   └── (all XxxService.cs implementation files)
├── DTOs/
│   └── Auth/, Booking/, Checkout/, Customer/, Service/, Admin/
└── Common/
    ├── Result.cs, AppConstants.cs
    └── Extensions/DateTimeExtensions.cs
```

Update all namespaces:

- `AutoWashPro.API.Services.*` → `AutoWashPro.BLL.Services.*`
- `AutoWashPro.API.DTOs.*` → `AutoWashPro.BLL.DTOs.*`
- `AutoWashPro.API.Common.*` → `AutoWashPro.BLL.Common.*`

##### Step 6 — What stays in API (no move needed)

```text
AutoWashPro.API/
├── Controllers/       (all controllers — update using statements only)
├── Middleware/        (ExceptionHandlingMiddleware, RequestLoggingMiddleware)
├── Jobs/              (MonthlyMaintenanceJob — registered as IHostedService in API)
├── Program.cs         (update using statements; service registrations unchanged)
├── appsettings*.json
└── Properties/launchSettings.json
```

##### Step 7 — Update all `using` statements

Every file that previously referenced `AutoWashPro.API.Data`, `AutoWashPro.API.Services`, `AutoWashPro.API.DTOs`, or `AutoWashPro.API.Common` must be updated to the new namespaces. Affected files: all Controllers, Middleware, Jobs, and Program.cs.

##### Step 8 — Update EF Core migration commands

DbContext is now in DAL; startup project remains API. Run from inside `AutoWashPro.API/`:

```sh
dotnet ef migrations add <MigrationName> --project ../AutoWashPro.DAL/AutoWashPro.DAL.csproj --startup-project AutoWashPro.API.csproj
dotnet ef database update --project ../AutoWashPro.DAL/AutoWashPro.DAL.csproj --startup-project AutoWashPro.API.csproj
```

##### Step 9 — Delete placeholder files

- Delete `AutoWashPro.BLL/Class1.cs`
- Delete `AutoWashPro.DAL/Class1.cs`

##### Step 10 — Update AGENTS.md

- Replace the single-project folder structure with the 3-project layout above
- Remove the "Do NOT create additional projects" rule (it no longer applies)
- Update NuGet package section to show which packages belong to which project
- Update EF migration commands to use `--project` and `--startup-project` flags

##### Step 11 — Build and smoke test

```sh
dotnet build   # run from solution root — must have 0 errors, 3 projects built
dotnet run     # run from AutoWashPro.API/ — Swagger UI must load at /swagger
```

Verify at least one endpoint per layer is reachable (e.g., `GET /api/services` exercises the full API → BLL → DAL chain).

**Deliverable:** Solution builds cleanly with 3 projects. `dotnet run` starts without error. All 31 endpoints respond correctly. EF migration commands work with `--project`/`--startup-project` flags.

---

### Phase 9 — Frontend (Staff & Admin)

**Goal:** Working browser UI for the Staff and Admin roles, pixel-matched to the `design-prototype/` screens and wired to the live API at `http://localhost:5001/api`.

**Project location:** `AutoWashPro.Web/` at the solution root (sibling to `AutoWashPro.API/`).

**Reference files — read before implementing:**

- `design-prototype/index.html` — canvas layout; shows which screens exist and how they are framed
- `design-prototype/styles.css` — complete design system (CSS variables, component classes); copy this file, do not rewrite it
- `design-prototype/shared.jsx` — icon SVG paths, mock data shapes, `TierBadge`, `StatusPill`, `formatVND` — port these to React components/utils
- `design-prototype/staff-screens.jsx` — exact layout for all 3 Staff screens
- `design-prototype/admin-screens.jsx` — exact layout for all 6 Admin screens

**Tech choices (final — do not deviate):**

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | React 18 + Vite 5 | Matches design target |
| Routing | React Router v6 | Standard; `<ProtectedRoute>` pattern |
| HTTP | Axios | Interceptors for auth header + 401 redirect |
| CSS | Copy `design-prototype/styles.css` as-is | Design system already complete — no Tailwind needed |
| Component library | None — use `.aw-*` CSS classes from design system | Library would conflict with existing classes |
| Charts | Recharts | Admin dashboard bar + donut charts |
| JWT decode | `jwt-decode` v4 | Read role claim without an extra API call |
| Fonts | Google Fonts CDN in `index.html` | Be Vietnam Pro (300–800) + Geist Mono (400,500) |

**Folder structure:**

```text
AutoWashPro.Web/
├── src/
│   ├── api/
│   │   ├── client.js          ← axios instance + interceptors
│   │   ├── auth.js            ← login functions
│   │   ├── bookings.js        ← queue, complete, walk-in
│   │   ├── services.js        ← services + pricing CRUD
│   │   ├── promotions.js      ← promotions CRUD
│   │   ├── tiers.js           ← tiers read/update
│   │   ├── customers.js       ← customers list + tier override
│   │   └── reports.js         ← summary report
│   ├── components/
│   │   ├── icons.jsx          ← all Icons.* from shared.jsx (same SVG paths)
│   │   ├── badges.jsx         ← TierBadge, StatusPill
│   │   ├── layout/
│   │   │   ├── AdminShell.jsx ← dark sidebar + topbar (props: active, title, subtitle, children, headerActions)
│   │   │   └── StaffShell.jsx ← dark sidebar + nav (props: active, onChange, children, title, headerRight)
│   │   └── ProtectedRoute.jsx ← role-guard wrapper
│   ├── pages/
│   │   ├── staff/
│   │   │   ├── StaffLogin.jsx
│   │   │   ├── StaffQueue.jsx
│   │   │   └── StaffWalkin.jsx
│   │   └── admin/
│   │       ├── AdminLogin.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminServices.jsx
│   │       ├── AdminPromotions.jsx
│   │       ├── AdminTiers.jsx
│   │       └── AdminCustomers.jsx
│   ├── hooks/
│   │   └── useAuth.js         ← token read/write, role decode, isAuthenticated
│   ├── styles/
│   │   └── design-system.css  ← copied verbatim from design-prototype/styles.css
│   └── main.jsx               ← React root + router
├── index.html                 ← Google Fonts link tags here
├── vite.config.js
└── package.json
```

#### Implementation Steps

##### Task 1 — Scaffold and configure

```sh
# From solution root
npm create vite@latest AutoWashPro.Web -- --template react
cd AutoWashPro.Web
npm install react-router-dom axios jwt-decode recharts
```

- Copy `../design-prototype/styles.css` → `src/styles/design-system.css` (verbatim, no edits)
- Delete Vite default `src/index.css`, `src/App.css`, `src/App.jsx`, `src/assets/`
- `index.html`: add Google Fonts `<link>` for Be Vietnam Pro + Geist Mono; add `<title>AutoWash Pro</title>`
- `main.jsx`: import `./styles/design-system.css`; render `<RouterProvider>` with the route table

`vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5001' },
  },
})
```

##### Task 2 — API client (`src/api/client.js`)

```js
import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('aw_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('aw_token')
      const path = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/staff/login'
      window.location.href = path
    }
    return Promise.reject(err)
  }
)

export default client
```

##### Task 3 — Auth hook (`src/hooks/useAuth.js`)

```js
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'aw_token'
const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

export function getToken()       { return localStorage.getItem(TOKEN_KEY) }
export function setToken(jwt)    { localStorage.setItem(TOKEN_KEY, jwt) }
export function clearToken()     { localStorage.removeItem(TOKEN_KEY) }

export function getRole() {
  const t = getToken()
  if (!t) return null
  try { return jwtDecode(t)[ROLE_CLAIM] ?? null } catch { return null }
}

export function isAuthenticated() {
  const t = getToken()
  if (!t) return false
  try {
    const { exp } = jwtDecode(t)
    return Date.now() < exp * 1000
  } catch { return false }
}
```

##### Task 4 — Protected route (`src/components/ProtectedRoute.jsx`)

- Props: `{ role, children }` where `role` is `"Staff"` or `"Admin"`
- If `!isAuthenticated()` or `getRole() !== role`: redirect to `/staff/login` (Staff) or `/admin/login` (Admin)
- Otherwise render `children`

##### Task 5 — Router (`src/main.jsx`)

```text
/                    → <Navigate to="/staff/login" />
/staff/login         → <StaffLogin />
/staff/queue         → <ProtectedRoute role="Staff"><StaffQueue /></ProtectedRoute>
/staff/walkin        → <ProtectedRoute role="Staff"><StaffWalkin /></ProtectedRoute>
/admin/login         → <AdminLogin />
/admin/dashboard     → <ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>
/admin/services      → <ProtectedRoute role="Admin"><AdminServices /></ProtectedRoute>
/admin/promotions    → <ProtectedRoute role="Admin"><AdminPromotions /></ProtectedRoute>
/admin/tiers         → <ProtectedRoute role="Admin"><AdminTiers /></ProtectedRoute>
/admin/customers     → <ProtectedRoute role="Admin"><AdminCustomers /></ProtectedRoute>
```

##### Task 6 — Shared components

**`src/components/icons.jsx`** — port all `Icons.*` entries from `design-prototype/shared.jsx` verbatim. Export as named exports: `export const Icons = { Phone, Lock, User, ... }`.

**`src/components/badges.jsx`**:

- `TierBadge({ tier, size })` — renders `.aw-tier-badge .aw-tier-{dong|bac|vang|platinum}` span with star SVG. `tier` values: `"dong"`, `"bac"`, `"vang"`, `"platinum"`.
- `StatusPill({ status })` — renders colored dot + label for `upcoming | completed | cancelled | in-progress | queued | active | expired`

**`src/components/layout/AdminShell.jsx`** — dark sidebar with:

- Logo (Droplet icon + "AutoWash Pro" + "QUẢN TRỊ")
- Nav items: Tổng quan, Dịch vụ & giá, Khuyến mãi, Hạng thành viên, Khách hàng, Báo cáo (bottom: Cài đặt, Đăng xuất)
- Active item determined by `active` prop; click calls `useNavigate`
- Top content area with `title`, `subtitle`, `headerActions` slot
- `clearToken()` + navigate to `/admin/login` on logout

**`src/components/layout/StaffShell.jsx`** — dark sidebar with:

- Logo (Droplet icon + "AutoWash" + "NHÂN VIÊN")
- Nav: Hàng chờ (badge = live queue count), Khách vãng lai, Lịch sử
- `clearToken()` + navigate to `/staff/login` on logout

**Formatting utils** (inline in components or a `src/utils/format.js`):

```js
export const formatVND = n => n.toLocaleString('vi-VN') + '₫'
export const formatVNDShort = n =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace('.0','') + 'tr' :
  n >= 1_000     ? (n / 1_000).toFixed(0) + 'K' : String(n)
```

##### Task 7 — Staff screens

**StaffLogin** — mirrors `design-prototype/staff-screens.jsx` `StaffLogin` component:

- Left dark panel (shop name, stats placeholder)
- Right: "Đăng nhập hệ thống" heading, email field, password field (toggle visibility), "Đăng nhập" primary button
- On submit: `POST /api/auth/system/login` `{ email, password }`
- On success: `setToken(data.token)` → `navigate('/staff/queue')` if role = `Staff`, `navigate('/admin/dashboard')` if role = `Admin`
- On 401: show inline error "Email hoặc mật khẩu không đúng."

**StaffQueue** — mirrors `StaffQueue` component in prototype:

- On mount: `GET /api/admin/bookings/queue` — render rows sorted by `scheduledAt`
- Left panel: list of booking rows (time, name, plate, service, status badge); clicking a row selects it
- Right panel: selected booking detail — ID, customer, plate, service, price, status
- "Hoàn tất" button at bottom of detail panel:
  - `POST /api/admin/bookings/{id}/complete` with body `{ pointsToRedeem: 0 }`
  - On success: remove row from list, show brief success message "Hoàn tất!" in panel
- If no booking selected: show empty-state placeholder
- Map API `BookingStatus` → badge: `Confirmed` → `queued`, `Completed` → `completed`, `Cancelled` → `cancelled`
- Show today's date in header; show count of remaining/total bookings

**StaffWalkin** — mirrors `StaffWalkin` component in prototype:

- On mount: `GET /api/services` → service list
- Form:
  - WalkInPhone (text)
  - WalkInLicensePlate (text)
  - Scheduled date+time (`<input type="datetime-local">`)
  - Service selector: radio list of services (name + price + duration label)
- Right panel: live bill summary (selected service name + price, total)
- On submit: `POST /api/admin/bookings/walk-in` with body:

  ```json
  { "walkInPhone": "...", "walkInLicensePlate": "...", "scheduledAt": "ISO8601", "pricingId": "..." }
  ```

- On success: show "Đặt thành công — BK-XXXX" and reset form
- On error: show API error message inline

##### Task 8 — Admin screens

**AdminLogin** — same layout/logic as StaffLogin. On success: redirect to `/admin/dashboard` (role must be `Admin`).

**AdminDashboard** — mirrors `AdminDashboard` in prototype:

- On mount: `GET /api/admin/reports/summary` → KPI data
- 4 KPI tiles: revenue today (`totalRevenue`), bookings today (`totalBookings`), active customers (`activeCustomers`), slot utilisation (`slotUtilisation` %)
- If the summary endpoint returns revenue history (last 7 days), render `BarChart` from Recharts; otherwise show a static 7-day bar chart with placeholder values
- Tier distribution: `PieChart` (Recharts) using customer counts by tier; use mock if not in API response
- Recent activity: last 5 rows from queue or summary; table with columns: time, customer, service, status badge, amount

**AdminServices** — mirrors `AdminServices` in prototype:

- On mount: `GET /api/services` → service list
- Left: `.aw-table` of services (name, description, active). Clicking row → select
- "Novo serviço" button clears selection (new-mode)
- Right edit panel:
  - Name, Description text fields; Save (`PUT /api/admin/services/{id}`)
  - Pricing sub-table: list pricing variants for selected service (`GET /api/services/{id}/pricing`)
  - Each variant row: duration (min), price (VND); inline edit on click
  - "Add variant" row at bottom: duration + price inputs + confirm button (`POST /api/admin/services/{id}/pricing`)
  - Save variant: `PUT /api/admin/services/{id}/pricing/{pricingId}`
  - Create new service: `POST /api/admin/services` with `{ name, description }`

**AdminPromotions** — mirrors `AdminPromotions` in prototype:

- On mount: `GET /api/admin/promotions?page=1&pageSize=20`
- Active promotions as cards (2-col grid): code, title, reward type, reward value, usage/max, date range
- Below: full `.aw-table` of all promotions with status badge
- "Tạo khuyến mãi" button → show create panel (slide-in or section):
  - Fields: code, title, description, rewardType (select: Discount/BonusPoints/FreeWash), rewardValue, startDate, endDate, minOrderValue (optional), maxUsage
  - Submit: `POST /api/admin/promotions`
- Click row → load edit panel (`PUT /api/admin/promotions/{id}`)
- Delete button (trash icon): `DELETE /api/admin/promotions/{id}` with confirm

**AdminTiers** — mirrors `AdminTiers` in prototype:

- On mount: `GET /api/admin/tiers` → 4 tier rows
- 4 tier cards (Đồng / Bạc / Vàng / Bạch Kim) with colored header
- Each card shows: bookingWindowDays, pointsPerWash, minVisitsPerMonth, minSpendPerMonth
- Click card → editable fields inline; "Lưu" saves (`PUT /api/admin/tiers/{id}`)
- Live preview bar at bottom: horizontal gradient bar showing tier thresholds (use `minSpendPerMonth` values)

**AdminCustomers** — mirrors `AdminCustomers` in prototype:

- On mount: `GET /api/admin/customers?page=1&pageSize=20`
- Search input: re-queries with `?search=` param on input change (debounced 300ms)
- `.aw-table`: name, phone, tier badge, points balance, visit count, total spent
- Clicking row → right detail panel: customer info + tier override
- Tier override: `<select>` with 4 tier options + "Áp dụng" button → `PUT /api/admin/customers/{id}/tier` with body `{ tierId: "..." }`
- On success: update tier badge in table row; show "Cập nhật thành công" in panel

##### Task 9 — CORS allow-list

Add `http://localhost:5173` to `AutoWashPro.API/appsettings.json` under `Cors:AllowedOrigins` so the browser can call the API directly when the Vite proxy is not used.

```json
"Cors": {
  "AllowedOrigins": [ "http://localhost:5173" ]
}
```

##### Task 10 — Deliverable checks

```sh
cd AutoWashPro.Web
npm run dev        # must start at http://localhost:5173 with no console errors
```

- Staff login (valid credentials) → navigates to `/staff/queue`
- Queue page loads real bookings from the API (no hardcoded mock data)
- "Hoàn tất" button on a queued booking completes it end-to-end
- Walk-in form submits successfully and resets
- Admin login → navigates to `/admin/dashboard`
- All 5 Admin pages render without console errors
- Refreshing any protected page while logged in stays on that page (token persists)
- Refreshing while logged out redirects to the appropriate login

**Deliverable:** `npm run dev` runs. Staff and Admin roles can log in, view data from the live API, and perform their primary actions (complete booking, create walk-in, CRUD services/promotions/tiers, tier override).

---

## SECTION 4 — Supporting Files

| File | Purpose | Load when |
| --- | --- | --- |
| `CLAUDE.md` | Planning context, decisions, issue tracker, phase status | Claude starts a new session |
| `AGENTS.md` | Entity specs, conventions, patterns, EF config rules, 3-layer structure | Codex begins implementing a phase |
| `.github/copilot-instructions.md` | Quick codebase reference for in-editor autocomplete | Copilot is active in any source file (auto-loaded) |
| `AGENT.md` | Same as above — kept for manual reference | When not using Copilot auto-load |

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
| 8 — 3-Layer Refactor | ✅ Completed | Data moved to DAL, Services/DTOs/Common moved to BLL, project refs/namespaces/EF commands/AGENTS.md updated, solution builds cleanly; API keeps EF Design as startup-project tooling only |
| 9 — Frontend (Staff & Admin) | ✅ Completed | React/Vite frontend scaffolded in AutoWashPro.Web, prototype CSS copied, staff/admin routes wired to API clients, lint/build/dev-server checks pass |
