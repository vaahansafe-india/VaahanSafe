# Replacement operations

The local admin workspace is `/replacements`, with a dedicated request detail at `/replacements/[id]`. It uses the existing Supabase transactional backend and Cloudflare private export worker. No demo records, alternate database, authentication bypass or browser business-state persistence was introduced.

## Acquisition and continuity

The owner requests a replacement using a real session, verified mobile, an active owned vehicle, its current activated QR and an unexpired `REPLACEMENT_ELIGIBLE` entitlement. Missing entitlement never grants itself. One open request per vehicle and original QR is enforced in PostgreSQL.

Admin approval records an eligibility/risk review. Allocation requires an unused, server-confirmed paid `REPLACEMENT_STICKER` order for the same owner and vehicle, complete shipping details, and verified printed central `ONLINE_SYSTEM` stock. There is no warranty or fee-waiver override. Customer checkout resolves the configured `PROD_QR_REPLACEMENT` catalogue item and authoritative price through the existing payment provider.

Allocation reserves an inactive replacement QR. Confirmed retirement ends the original assignment, revokes its entitlements and records immutable old/request/new lineage. The original becomes `REPLACED`; public resolver linkage to the new identity is suppressed in both the database and the local resolver UI. **Retirement interrupts original QR services until the replacement is delivered and activated.** The confirmation dialog states this consequence explicitly.

Packing confirms the existing physical fulfilment record. Shipment sync reads the actual carrier record; this workspace cannot mark payment paid or fabricate delivery. It uses the existing shipping service, and does not introduce a second carrier booking integration.

The owner opens `/qr/replace/[id]` after delivery and enters the replacement's complete private scratch code. A private, session-scoped RPC reserves a rate-limited attempt before server-side constant-time verification. Atomic activation rechecks payment, latest carrier delivery, ownership, secret consumption, reservation and lineage. It binds the new QR and restores only the previous unexpired capabilities with their original expiry, linked to the paid replacement order. It does not grant premium subscription tiers or alter vehicle profiles, emergency contacts or historical scans. Closure requires actual delivery and owner activation.

## Operations and privacy

The page has a five-stage metric strip, explainable attention queue, left filters/mobile Sheet, IST calendar, debounced prefix search, shared Grid/Rows cursor query, quick inspection and lazy paginated timeline, lineage and security audit. List results are limited to 50 plus a sentinel row. No secrets, raw addresses, contacts or provider errors are returned to these views.

Commands require SUPER_ADMIN or OPS_ADMIN, fresh existing email OTP verification, same-origin requests, a revision, a bounded reason and an idempotency key. Support and analysts can inspect according to existing RBAC. Rejection, cancellation and review remain available for ineligible requests; approval and allocation cannot bypass eligibility.

Exports reuse `vaahansafe-admin-exports` and `vaahansafe-prod-exports`. They recheck the actor's role, use bounded cursor pages and a 10,000-row limit, mask registrations, escape spreadsheet formulas and retain the existing owner-only private download/expiry controls. Operational notifications continue through the existing database outbox and configured delivery pipeline.

## Validation

- Versioned migrations: `20261013173845_replacement_identity_operations.sql`, `20261013182159_replacement_review_and_resolver_privacy.sql` and `20261013183140_replacement_request_notification.sql`.
- `node tooling/scripts/verify-replacement-workspace.mjs` runs real-schema tests in a rollback subtransaction using existing actual accounts, verified sessions and vehicles. No test stock, orders or lifecycle changes persist. It reports separately whether fresh-admin command coverage was available.
- The SQL tests cover private function grants, unauthenticated/expired-verification denial, owner eligibility, duplicate requests, paid/refunded gates, IST boundaries, secret and delivery gates, attempt restrictions, atomic single-active identity, expiry preservation and immutable/private lineage.
- 42 focused unit/regression tests passed across replacement, reconciliation, entitlement, resolver projection and exports. New replacement lint and admin/customer type checks passed. Admin, customer and QR production builds passed; the QR build retains an unrelated existing scanner dependency warning.
- Live private export verification: `output/replacement-export-check.json`. Current real replacement count is zero, so this checks an empty genuine report and its private storage, not populated operational cases.
- Fresh admin OTP was unavailable during initial verification. Positive approval/allocation/retirement/packing/sync/closure commands are conditionally exercised when a genuine fresh admin session is available; no OTP or session freshness was fabricated.
- Signed-in operators can renew the existing email verification at `/verify-email?stepUp=1`; the query parameter chooses the verification UI and never authorizes a command by itself.
- Native browser inspection was blocked because Computer Use could not reliably determine the browser URL. Visual/mobile interaction QA is pending. No 100k-record performance claim is made against the current empty replacement dataset.

The frontend changes are local and prepared for deployment; they have not been published to Vercel.
