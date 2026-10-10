# Distributor network workspace

The distributor feature extends `admin_partners` under the existing Supabase admin architecture explicitly retained for this task. Customer authentication, payment gates and QR entitlement rules are not changed. Application reads and writes pass through authenticated Next.js routes, server services and private Supabase RPCs. Export files remain in private Cloudflare R2.

## Records and geography

Physical location is stored on the existing partner. `admin_partner_territories` separately models district coverage. Coverage is non-exclusive; this implementation does not introduce an exclusive distribution policy. Canonical status remains `ACTIVE` or `SUSPENDED`, separate from verification (`PENDING`, `VERIFIED`, `REQUIRES_CORRECTION`) and derived reconciliation attention.

The versioned administrative snapshot comes from the [Government of India's Integrated Government Online Directory](https://igod.gov.in/sg/district/states), retrieved on 10 October 2026: 36 state/UT entries and 784 districts. Directory identifiers are **IGOD identifiers, not LGD numeric codes**. The importer checks every state's reported district count, follows the site's published pagination and rejects duplicate identifiers. The same snapshot supplies form options and versioned migration inserts; browsers receive only states or the selected state's districts. Locality and landmark remain validated address text. They are not presented as administrative boundaries or geocoded places.

Changing a state clears an incompatible district in the UI. Composite database foreign keys independently reject mismatched state/district pairs. Existing partners are retained with missing location information shown as setup required; no location or retailer relationship is inferred from free-text city names.

## Security and operations

- Existing `vs_admin_session`, server session validation and operations-role authorization are reused. Each private RPC revalidates the session. Anonymous/customer roles cannot access the new tables, view or functions.
- Contacts and internal notes are returned only to super/operations administrators. List, history and export projections exclude private contact fields and activation material.
- Organization/contact/territory saves and status changes reject stale `updated_at` values. Material changes and their reasons are recorded transactionally in the existing append-only audit log without copying contact fields into payloads.
- New central-to-distributor transfers reserve specific printed, unowned retail QR identities. Unique active reservations and row locks prevent two transfers reserving the same identity. Printed-batch evidence is required. Dispatch records `IN_TRANSIT_DISTRIBUTOR`; acknowledged receipt records `WITH_DISTRIBUTOR` and current custody. Neither transition creates owner activation, payment proof, subscriptions or service entitlements.
- Suspended partners cannot receive new transfer requests or dispatches. Receipt of already-dispatched stock remains recordable for custody accuracy. Legacy transfers lacking identity reservations cannot be dispatched or received through this feature; they require operational review.
- Reconciliation records a physical count against the current custody projection. Reviewing/closing a discrepancy preserves quantities; it never changes QR custody to make counts agree.
- Existing unassigned retailers can be associated with a distributor. Concurrent reassignment is rejected. This relationship does not move inventory.

## Queries and exports

The list uses 50-row keyset pages ordered by `(created_at, id)` and narrow server projections. Summary aggregation is independent and does not run on every load-more request. Stock, transfer, retailer and territory counts are grouped in the database. Detail history uses independent 20-row keyset pages. Filters, sort and detail tabs are reflected in URLs; private contacts are never used as URL search terms.

Filtered and selected reports reuse `admin_export_jobs`, actor rechecks, lease recovery, expiry and private R2 downloads. Before queuing a distributor job, the server checks that the configured Cloudflare Worker has its required private R2 and secret bindings. Missing configuration or provider failure returns a recoverable unavailable error instead of a queued job that cannot run. The new Worker uses `admin_distributor_export_page` with a stored filter/selection snapshot and creation cutoff. Distributor exports include operational fields only, with formula-safe CSV serialization. The maximum report size is 10,000 records and the explicit selection limit is 100.

## Deployment and validation

Migration: `supabase/migrations/20261010062510_distributor_operations.sql`. It was applied with user approval and recorded in Supabase migration history. No validation partners or business data were retained.

Worker: `infrastructure/cloudflare/workers/admin-exports/wrangler.toml`. Its approved deployment targets `vaahansafe-admin-exports`, with `EXPORT_STORAGE` bound to `vaahansafe-prod-exports` (provisioned by Wrangler during deployment). The server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets were separately authorized, provisioned through stdin without files or exposed values, and verified by binding name/type. The local admin configuration enables the existing `ADMIN_EXPORT_WORKER_ENABLED` switch and sets `CLOUDFLARE_R2_EXPORTS_BUCKET=vaahansafe-prod-exports`; deployed admin environments must use the same configuration. The availability check rejects a mismatched download bucket before queuing distributor reports.

A real authenticated filtered export was queued, completed by the existing minute schedule, marked READY and downloaded through the authenticated private R2 endpoint. With zero current distributors, the downloaded CSV correctly contained only the operational column headers. This verifies the real job/storage/download path without adding dummy partners. The admin application itself has not been deployed as part of this task.

Useful commands:

```powershell
npm run typecheck --workspace=@vaahansafe/admin
npm run lint --workspace=@vaahansafe/admin
npm run build --workspace=@vaahansafe/admin
npx vitest run tests/distributor-operations.test.ts tests/admin-export-worker.test.ts tests/admin-operations-security.test.ts
node tooling/scripts/verify-distributor-operations.mjs
node tooling/scripts/inspect-distributor-export-worker.mjs
```

The database verifier uses a live, existing verified administrator session. All validation partner records, audit entries and any eligible stock transitions run inside a PostgreSQL subtransaction that is deliberately rolled back. It verifies geography, private grants, missing-session denial, creation/audit, stale writes, duplicate territories, suspension, and history pagination. Where eligible printed stock exists, it additionally verifies reservation, dispatch, receipt, repeat-receipt rejection and variance projections. It checks partner/audit counts after rollback.

Browser checks covered the live empty-state workspace and unsaved location forms, required-field feedback, mouse/keyboard location selection, incompatible district clearing, mobile filtering and URL behavior. Requested sizes from 320×700 through 1920×1080 had no horizontal page overflow. Existing browser zoom was accounted for when setting CSS viewport dimensions. The production database currently has no distributors, so populated-network, long-name, high-volume and full transfer/reconciliation UI testing remain for real records; no dummy business records were added to enable those checks.
