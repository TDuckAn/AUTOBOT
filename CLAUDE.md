# CLAUDE.md — AutoWash Pro Planning Context
> Load this file at the start of every Claude session to restore full project context.  
> Update phase status and decisions here as the project progresses.

---

## Project in One Line
Web-based motorbike wash management system for Vietnam SMBs — loyalty tiers, advance booking with capacity limits, walk-in support. Backend: ASP.NET Core 9 monolith. DB: SQL Server. See PLAN.md for full build plan.

## Source of Truth Hierarchy
1. **SYSTEM_SPEC.md** — authoritative for implementation (overrides SRS on any conflict)
2. **SRS v3** — authoritative for functional requirements
3. **PLAN.md** — Claude's analysis, decisions, phase plan
4. **This file (CLAUDE.md)** — session continuity

---

## Finalized Decisions (Do Not Revisit Without New Instruction)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Walk-in bookings: `customer_id = NULL` (not Guest Customer GUID) | SYSTEM_SPEC BR-04 overrides SRS v2/v3 "Guest Customer record" |
| D2 | `BOOKING.created_by` is **nullable** UUID FK → SYSTEM_USER | Cannot be NOT NULL: customer self-bookings have no SYSTEM_USER record |
| D3 | `BookingStatus.Pending` **removed** | Never used in any workflow; dead code |
| D4 | Capacity lock: `IsolationLevel.Serializable` transaction | Prevents phantom reads during concurrent booking creation |
| D5 | `SERVICE_PRICING` gets `is_active` (bool) and `created_at` (timestamp) | Consistency with all other tables; needed to deactivate pricing variants |
| D6 | Member TIER_CONFIG seed: `min_visits=0, min_spend=0` explicitly | Tier review fallback to Member requires zero thresholds |
| D7 | FreeWash discount resolved upfront: `promoDiscount = base_price` | No Step E override; final_price computed once cleanly |
| D8 | Near-expiry notification: scan `POINTS_LEDGER` for entries expiring within 30 days | Monthly job + separate near-expiry scan pass |
| D9 | `Cors:AllowedOrigins` read from appsettings | Not hardcoded to localhost:5173 |
| D10 | All list endpoints paginated with `?page=1&pageSize=20` | Prevents unbounded queries |

---

## Critical Business Rules Summary (BR-01 to BR-10)

| Rule | Summary |
|------|---------|
| BR-01 | Max 4 bookings per 30-min slot, checked via time-range overlap, NOT slot counting |
| BR-02 | `expected_end_at = scheduled_at + pricing.duration_minutes` — backend only, never from client |
| BR-03 | VIP tiers cannot bypass capacity; tier only extends booking window |
| BR-04 | Walk-in: `customer_id=NULL`, `vehicle_id=NULL`, walkin fields stamped, `created_by`=staff user_id |
| BR-05 | No points awarded when `customer_id IS NULL` |
| BR-06 | Points expire 12 months from ledger `created_at`; enforced by monthly job |
| BR-07 | Tier review: 30-day rolling window of `visit_count` + `total_spend` vs TIER_CONFIG thresholds |
| BR-08 | `final_price = base_price - promo_discount - points_discount`, floor at 0 |
| BR-09 | POINTS_LEDGER is append-only — never UPDATE or DELETE; corrections = new negative rows |
| BR-10 | TIER_CONFIG + Guest Customer record are immutable at runtime; role guards protect them |

---

## Overlap Capacity Query (exact SQL intent)
```sql
SELECT COUNT(*) FROM BOOKING
WHERE status NOT IN ('Cancelled')
  AND scheduled_at < :requested_end
  AND expected_end_at > :requested_start
```
→ If result ≥ 4: reject. Run inside Serializable transaction with the subsequent INSERT.

---

## Tier Config (seeded, immutable)
| tier_name | rank_order | booking_window_days | points_per_wash | min_visits | min_spend |
|-----------|-----------|---------------------|-----------------|-----------|-----------|
| Member | 1 | 7 | 5 | 0 | 0 |
| Silver | 2 | 10 | 8 | configurable | configurable |
| Gold | 3 | 12 | 12 | configurable | configurable |
| Platinum | 4 | 14 | 20 | configurable | configurable |

---

## Known Issues & Their Fixes (cross-reference PLAN.md §Analysis)

| Issue | Fix Applied | Phase |
|-------|------------|-------|
| C1: `created_by` NOT NULL impossible | Made nullable, only set for walk-ins | Ph 0 entity design |
| C2: SRS vs SYSTEM_SPEC walk-in FK | Use NULL, documented in D1 | Ph 0 entity design |
| C3: TOCTOU race on capacity check | Serializable transaction (D4) | Ph 3 BookingService |
| C4: Near-expiry notification gap | Second scan pass in job | Ph 6 Background job |
| C5: FreeWash discount logic | Unified upfront discount calc (D7) | Ph 4 CheckoutService |
| C6: Pending status dead code | Removed (D3) | Ph 0 enum definition |
| F1: SERVICE_PRICING missing fields | Added is_active + created_at (D5) | Ph 0 entity design |
| F2: Member tier zeros | Explicit seed (D6) | Ph 0 seeding |
| F3: Job double-run on restart | last-run month guard | Ph 6 Background job |
| F4: CORS hardcoded | Config-driven (D9) | Ph 1 Program.cs |
| F5: No pagination | All list endpoints paginated (D10) | Ph 3-5, audited Ph 7 |

---

## Claude's Role Per Phase

- **Before phase starts:** Confirm scope with Codex; flag any ambiguities; point to relevant SYSTEM_SPEC sections
- **During phase:** Answer implementation questions; resolve business rule conflicts
- **After phase:** Review key decisions made; update this file; update PLAN.md §5 status tracker
- **Never:** Write implementation code — that is Codex's responsibility

---

## Phase Status (copy from PLAN.md §5 — keep in sync)
| Phase | Status |
|-------|--------|
| 0 — Foundation | ⬜ |
| 1 — Auth | ⬜ |
| 2 — Service Catalogue | ⬜ |
| 3 — Booking Engine | ⬜ |
| 4 — Checkout & Loyalty | ⬜ |
| 5 — Admin Config & Reports | ⬜ |
| 6 — Background Jobs | ⬜ |
| 7 — Quality & Polish | ⬜ |

---

## Questions to Ask Before Each Phase

**Ph 0:** Is SQL Server available locally? What is the connection string format?  
**Ph 1:** Confirm JWT secret will be in env var, not appsettings.  
**Ph 3:** Confirm slot start time range (08:00–17:00 from sequence diagram).  
**Ph 4:** Confirm `PointValueInVND = 100` (1 pt = 100 VND discount).  
**Ph 6:** Confirm job timezone — UTC or Vietnam time (UTC+7)?
