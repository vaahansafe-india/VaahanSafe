# Stock Reconciliation workspace

The dedicated local admin route is `/reconciliation`, with `/reconciliation/new` and `/reconciliation/[id]`. Supabase remains the configured transactional backend. The existing Cloudflare private R2 export worker generates reports; it was published with reconciliation support as version `e087fac0-d9f5-4fe3-8f62-605610077adc`. The admin frontend remains local.

## Operator flow

1. Search by reconciliation reference, custodian name, batch or transfer reference. Searches use explicit prefix matching. Grid and Rows share the same typed query and cursor; presentation changes do not introduce a second fetch.
2. Use the left filters on desktop or the mobile filter sheet. Calendar ranges use IST day boundaries; created/count/closed dates have separate meanings. Historical count-date searches use creation date when an actual count completion timestamp was not recorded.
3. Inspect a record without loading its full timeline or QR manifest. The full page loads operational events, batches and QR identities on demand; audit records are a separate panel.
4. Start a new physical count for central inventory, a distributor or a retailer. Scope includes unsold, unassigned physical stock at that custodian. Central stock must have verified printing evidence. In-transit stock, active vehicle identities and sold stock are excluded. All eligible stock or up to 20 selected batches may be counted.
5. Review the server ledger snapshot, enter the actual physical quantity and count-sheet reference, then save a draft or complete the count. A draft is not an established shortage and does not inflate partner discrepancy metrics.
6. Investigate and classify a variance. Missing/surplus classifications must equal the observed net difference; damaged units are part of the physical count. Resolve, approve and close through explicit commands. Each command requires an active authorized admin and fresh work-email OTP, stable request idempotency and a current revision.
7. Closing documents the outcome; it does not change stock or erase a historical variance. A separate approved action may mark the exact unchanged snapshot identities Lost or Damaged. It rejects assigned, activated, moved, changed, transfer-reserved or duplicated identities. Surplus counts never manufacture new QR identities.
8. Shipment-linked records route operators back to Transfers for receipt and custody changes. Existing partner review links now open this reconciliation workspace.

## Historical truth

Existing records receive stable, unique server-generated references. Partner UUIDs are replaced by joined names and recorded locations. Unrecorded resolution, count time, category breakdown, snapshot or evidence stays explicitly unrecorded. A historical closed shortage is **Closed variance**, not **Matched** or **Resolved variance** merely because its workflow closed. Related transfer events remain the recorded operational timeline.

Batch panels expose ledger quantities; physical counts by batch are not inferred from the aggregate count. The current system has no reconciliation evidence-upload pipeline, so no file or photograph is invented or presumed from free-text notes.

## Validation and limits

Applied additive migrations: `20261013164245_stock_reconciliation_workspace.sql`, `20261013170635_reconciliation_workflow_compatibility.sql` and `20261013171716_reconciliation_transit_scope.sql`. New snapshots, command ledgers and operational events have RLS, service-only privileges, immutable evidence and restrictive foreign keys. Existing stock, activation secrets, assignments and entitlements were preserved. Dispatched transfer reservations are excluded from source physical snapshots.

Validation covered 25 focused tests, admin type checking, lint, a production build, secure worker bundling, a security advisor check and rollback-only SQL checks. The authenticated SQL checks use the operator's real session and fresh email verification; they do not create users or fake an OTP. Test stock fixtures and all associated adjustments/events/audits roll back before they can become visible to the application.

The real list query joined custodian/transfer projections in one database query and took approximately 0.31 ms for the existing one-record dataset. This is not a 100,000-record performance claim. Browser visual, device-size and keyboard checks remain pending because native browser inspection was stopped when it could not determine the browser URL reliably. No real physical count or stock adjustment was submitted as UI testing. One real private reconciliation report was requested for the signed-in operator to verify the configured export pipeline; its result is recorded in `output/reconciliation-export-check.json`.

Run `npx vitest run tests/reconciliation-workspace.test.ts tests/transfer-control.test.ts tests/transfer-receipt.test.ts tests/retail-sale.test.ts tests/print-stock-release.test.ts` and `node tooling/scripts/verify-reconciliation-workspace.mjs` for focused verification. The privileged SQL scenarios execute only when an existing real admin session has fresh work-email verification; otherwise only the read/security checks execute.
