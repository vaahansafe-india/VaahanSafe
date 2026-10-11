# Transfer Control Center

The admin workspace at `/transfers` uses the existing real Supabase inventory and partner records. It supports Central inventory → Distributor and Distributor → its active, verified Retailer. No stock or transfer records are fabricated for the UI.

## Custody workflow

Request reserves eligible printed retail QR identities atomically. Approval is required before dispatch. Receipt records visible QR codes individually as received, damaged or missing; partial receipt changes only the identities acknowledged by the destination. Missing identities keep their last acknowledged custody and reservation until resolved as found or lost. Reconciliation requires every identity to be accounted for, and closure preserves the history.

Mutations require an authorized active admin session and the existing fresh email verification step. A revision check rejects stale edits. Database-backed command IDs make retries idempotent; conflicting reuse fails. Operational events and the protected security audit are separate. Legacy direct partner transitions require the central workflow.

The desktop filters use the shared Distributor/Retailer left-rail layout and breakpoint. Tablet/mobile filters open in a drawer. Filters remain in the URL, partner and inventory options are searched on the server, and lists/manifests/history use bounded cursors.

## Applied services

- Supabase migration `20261011172757_transfer_control_center.sql` was applied using the linked CLI. Dry-run listed only that migration, with no seeds or roles; Vault was skipped.
- New functions and tables are private to the service role, new tables have RLS, and views use `security_invoker=true`.
- Cloudflare worker `vaahansafe-admin-exports` version `3a694c09-3405-409a-896a-8cf2b919c6b4` was published with the user's approval. Its existing private R2 bucket and server credentials were verified, with Transfers and Retailer exports enabled. The one-minute schedule is retained.
- Exports use the current filters or selected transfer IDs, recheck actor authorization, escape spreadsheet formulas, and expire private download access. Activation credentials are not exported.
- The admin frontend remains local; it has not been deployed by this task.
- A real current-view Transfers export reached `READY` in the deployed worker and recorded its private R2 object. It contains zero data rows because there are no current transfers.

## Verification

`node tooling/scripts/verify-transfer-control.mjs` exercises the installed workflow in a rollback-only transaction. It verifies authorization and step-up, reservation conflicts, idempotency, approval gates, stale revision rejection, partial receipts, damage/missing/found/lost handling, reconciliation, closure, partner custody projections, and filtered exports. All probe changes are rolled back and baseline counts are compared afterward.

The scoped Vitest suite passed 46 tests across Transfers, Distributor/Retailer operations, export worker and admin security. Admin typecheck and production build (including lint) passed. Post-migration Supabase security advisors returned no errors. The current empty Transfers projection executed in 0.178 ms; this is not a populated production load benchmark.

The real local page, mobile filter application and server-backed distributor/stock options were inspected. No eligible printed retail stock currently exists, so browser validation stops before submitting a transfer. SQL coverage of later states uses transaction-only records that never persist. A physical stock movement and real two-client concurrent load have not been performed.
