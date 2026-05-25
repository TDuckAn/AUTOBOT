# Account-Required Test Log

These tests need seeded or provided credentials/data and should be run later when the database is populated.

## Phase 1 - Authentication
- `POST /api/auth/system/login` with a seeded Admin account.
- `POST /api/auth/system/login` with a seeded Staff account.

## Phase 2 - Service Catalogue
- Admin service CRUD with a valid Admin JWT.
- Admin pricing CRUD with a valid Admin JWT.
- Confirm Staff and Customer JWTs are rejected from `AdminOnly` service endpoints.

## Phase 3 - Booking Engine
- Customer availability lookup with a valid Customer JWT and active pricing data.
- Customer booking creation with a valid Customer JWT, owned vehicle, and active pricing data.
- Customer cancellation for own confirmed booking.
- Confirm customers cannot cancel another customer's booking.
- Staff/Admin walk-in booking creation with valid Staff/Admin JWT and active pricing data.
- Admin booking list and queue endpoints with valid Staff/Admin JWT.
- Confirm unauthenticated requests return `401` on all protected booking endpoints.
- Capacity enforcement with enough existing bookings to fill a slot.

## Phase 4 - Checkout & Loyalty
- Staff/Admin completes a confirmed booking and receives a checkout summary.
- Checkout applies Discount, FreeWash, and BonusPoints promotions correctly.
- Checkout redeems points only when the customer has sufficient balance.
- Checkout appends Earn/Redeem ledger rows and updates customer point balance.
- Walk-in booking without a linked customer completes without loyalty points.
- Customer profile `GET`/`PUT` with a valid Customer JWT.
- Customer vehicle list/add/delete with a valid Customer JWT.
- Customer loyalty dashboard returns tier, balance, and ledger history.
- Customer notifications endpoint returns paginated notification records.
- Confirm unauthenticated requests return `401` on customer profile, vehicle, loyalty, notification, and checkout endpoints.

## Phase 5 - Admin Configuration & Reports
- Admin tier list and tier update with a valid Admin JWT.
- Promotion create/update/delete/list with a valid Admin JWT and seeded tier IDs.
- Promotion validation rejects invalid date ranges and missing minimum tiers.
- Admin customer list filters by search and tier with pagination.
- Admin customer tier override updates the customer tier.
- Admin summary report returns wash volume, revenue, active customers, and slot utilisation using populated bookings.
- Admin tier-review report returns tier distribution after customer data is populated.
- Confirm Staff and Customer JWTs are rejected from `AdminOnly` tier, promotion, customer, and report endpoints.

## Phase 6 - Background Jobs
- Monthly maintenance skips when `SystemConfigs['maintenance:last-monthly-run']` already equals the current month.
- Monthly point expiry appends `Expire` ledger rows and updates customer balances for expired earned points.
- Monthly tier review promotes/demotes customers based on completed visits and spend over the rolling 30-day window.
- Monthly job creates `PointsExpiry` and `TierChange` notifications when balances or tiers change.
- Near-expiry scan creates one 30-day warning notification per earn ledger entry and sets `NearExpiryNotified`.
- Restart the API on the 1st of a month and confirm the persisted monthly run flag prevents duplicate processing.

## Phase 7 - Quality & Polish
- Verify Swagger UI accepts a Bearer token and can call protected endpoints with seeded accounts.
- Manually test all business rules BR-01 through BR-10 through Swagger.
- Verify request logging entries include method, path, status, and duration for representative endpoints.
- Verify pagination metadata on all list endpoints with enough data for multiple pages.
- Verify production deployment uses environment variables listed in `appsettings.Production.json`.
