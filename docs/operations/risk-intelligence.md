# Risk Intelligence

The existing `/fraud` route now hosts the Risk Intelligence workspace. It uses the existing Supabase server services, verified admin session cookie, RBAC and immutable admin audit ledger; the existing Cloudflare export Worker writes reports to private R2. The user explicitly approved reusing this backend for this module.

## Evidence and rules

The initial version evaluates recorded unsuccessful activation outcomes and resolver outcomes `RESOLVED_BLOCKED` / `RESOLVED_REPLACED`. These are observations, not conclusions about intent. Activation observations are `REVIEW`; unavailable-identity scan observations are `INFORMATIONAL`. The module does not invent velocity thresholds, geographical confidence, identity verdicts or numerical risk scores.

One `(rule_key, rule_version, source_type, source_event_id)` can generate one signal. Evidence snapshots omit proof credentials, network hashes, phone numbers, emails and provider payloads. Source context is fetched only for the selected signal: up to 15 activation events, 15 scan events, 10 replacements and 10 lifecycle transitions. Activation/scan/lifecycle context is bounded to 24 hours on either side of the source observation; replacement records are linked by real QR foreign keys. Context is explicitly distinguished from signal-producing evidence.

Cases can group multiple signals and multiple QRs. Opening a case for a QR reuses its open investigation under a partial unique index. Linking a signal to a different open case is a deliberate audited operator action. Investigation commands lock the relevant records, check revisions and use a database-backed request ID for retry idempotency. Only operations/super admins can mutate; support and analysts can inspect. No review action changes a QR lifecycle, payment, entitlement or subscription. QR security actions remain in the existing inventory workflow and retain its confirmation and step-up policy.

The public graph does not expose private contact data. Its customer reference is a masked display reference; it is not an authentication credential. Safety availability remains authoritative in the existing QR entitlement service, not a risk badge.

## Queries and presentation

Signals and cases use timestamp + UUID cursors and return at most 50 records per page. There is no deep offset. Search normalizes exact/prefix signal, case, visible QR, customer display and vehicle registration references. Calendar dates are converted at the database boundary using `Asia/Kolkata`; the rolling 24-hour filter is a real timestamp interval. View/workspace URL controls are excluded from filter query identity, so Grid/Rows reuse the same query data.

The pulse is a bounded projection of the latest 100 observations within 24 hours, with keyboard-selectable SVG markers and a textual alternative. Patterns are aggregate source/severity/current-lifecycle groups. Graph, timeline and audit are bounded and loaded on selection; normal list rows do not include customer profiles, source histories or evidence blobs.

Exports use the existing authenticated report queue and private R2 download path. Both request and Worker page RPCs recheck roles; support cannot export. The Worker fetches 500 rows at a time through a masked projection, capped at 10,000 rows. CSV formula prefixes are escaped. `RISK_EXPORTS_ENABLED` prevents an older deployed Worker from accepting the new report format.

## Deployment

1. Review and apply `supabase/migrations/20261013195009_risk_intelligence_operations.sql` through the repository's approved migration release process. It creates the risk schema and private RPCs, adds lightweight source capture triggers and reloads the REST schema. It does not seed records or modify QR, financial or entitlement truth.
2. Existing eligible history can be evaluated with `admin_risk_backfill(p_session, p_source, p_cursor)`, by an authorized operations admin, in bounded 500-event batches. Cursor pagination and source idempotency make retries safe. Reads never perform this backfill. New eligible source inserts are captured automatically.
3. Deploy the existing `vaahansafe-admin-exports` Worker with the updated code and `RISK_EXPORTS_ENABLED="true"`, then the admin app. Until Worker availability is verified, export requests report an actionable service error.
4. Check the authenticated module on desktop and mobile, with expanded/collapsed navigation; inspect the real empty queue if no observations exist. No fake signals should be inserted to demonstrate the interface.

Production migrations and deployment require approval. The implementation task only performed read-only inspection and explicitly authorized rollback-only database tests.

## Verification

`node tooling/scripts/verify-risk-workspace.mjs` tests the unapplied migration in a transaction using existing QR/admin records. Source observations and temporary test changes to real sessions/roles exist only inside that transaction. The test rolls back schema, observations, investigations, reports and audit writes, then checks the production baseline. It verifies RLS/grants, unauthorized RPC access, role permissions, revoked sessions, IST dates, source deduplication, immutable evidence, case commands, stale revisions, retry conflicts, decisions and filtered export privacy.

`tests/risk-workspace.test.ts` covers filter/cursor boundaries, view-independent query identity, export roles and CSV injection. Run the admin TypeScript check, lint and production build before releasing. Full authenticated browser interaction and large-history load testing require the migration in an approved environment; rollback tests do not establish those claims.
