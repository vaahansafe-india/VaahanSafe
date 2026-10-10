# Customer Usage & Analytics

The customer sidebar's **Activity → Usage & Analytics** opens `/analytics`. Six lenses connect owned vehicles, QR scans, current document usage, account sessions and observed service activity. The default is the last 30 India-calendar days; custom ranges are limited to 366 days. Scans can compare with the immediately preceding period of equal length.

## Sources and semantics

- Existing Supabase application-domain records are queried through the server's authoritative database adapter and verified HttpOnly customer session. Each aggregate independently rechecks session validity and account ownership. Foreign vehicle/QR filters return an error instead of widening the scope. Nothing is stored in browser persistence.
- Scan totals use persisted `qr_scan_events` IDs linked to currently owned QR assignments. A replay of the same persisted ID does not add another event. The existing resolver excludes known crawler and prefetch requests before ingestion. Different persisted IDs are separate observations; no speculative client deduplication is performed. These are scan observations, not a vehicle travel route.
- Dates are bucketed in `Asia/Kolkata`. Automatic grouping is hourly for up to two days, daily through 90 days and weekly thereafter. Zero buckets represent the absence of recorded events. Aggregation occurs in PostgreSQL; large raw histories are never sent to charts.
- Document counts and storage are current snapshots, independent of the date filter. Activity follows the selected dates. Storage includes only finalized READY originals and retained versions for non-deleted documents with a finalized current version. Pending, failed, purged and deleted copies do not contribute. Account reservation/quota is separately labeled because it also covers thumbnail reservations and pending cleanup. R2 is not enumerated on page loads.
- Document preview/download events record authorization requests, not confirmed bytes viewed or downloaded. Thumbnail grants are not preview events.
- Account security queries have their own keys and ignore vehicle/document filters. Session creations indicate retained successful sign-ins, not an immutable historical login audit. Active sessions exclude revoked and expired records. Device classes are coarse; no raw IP, user agent, token, fingerprint, SQL or storage key is projected. The existing Settings security page manages sessions.
- Service experience shows recorded QR lifecycle outcomes, upload states and provider notification delivery states. An active safety view ratio is not network reliability or platform uptime. Notification delivery is account-wide and omitted when a vehicle/QR scope is selected because the source lacks a reliable vehicle dimension.
- QR response latency, historical storage snapshots, failed-login history and vault-unlock failure history are not recorded as customer metrics. The workspace states these limitations rather than fabricating charts or percentages. No Cloudflare-wide or unrelated customer telemetry is exposed.

## Visuals and interactions

D3's `d3-scale` module computes chart geometry for **Scan Rhythm**, **Vehicle Activity Ribbon** and the expiry view. React renders their SVGs. ResizeObserver tracks actual container widths. Dense views have mobile representations. No relationship diagrams, force simulations or constant motion are used. The overview leads with a full-width Recharts scan trend, followed by horizontal vehicle bars with count labels and vehicle-detail tooltips.

The chart layout takes visual cues from the signed-in Vercel Analytics and Usage pages: integrated metric selectors, thin grid lines, area/bar controls, compact bordered cards and ranked breakdowns. VaahanSafe retains its paper theme and colours. The **Storage** and **Usage** tabs use existing customer data, with no Vercel telemetry dependency. Scan/service selectors switch between recorded totals and active safety views; preceding-period data is compared only with recorded totals because the source does not provide previous active-view counts. Recharts renders storage as one stacked breakdown at a time (file type or category) to avoid double-counting the two independent aggregates. Its separate account quota meter uses the authoritative reservation and policy values, independent of vehicle filtering. There is no invented storage growth curve.

Recharts renders scan/document/sign-in trends, scan comparisons, storage by vehicle and observed resolution charts. Custom tooltips use hover on fine pointers and tap on coarse pointers; Recharts keyboard accessibility is enabled. D3 marks expose accessible descriptions and respond to focus/tap, with inspected details retained below the graphic. Hugeicons action tooltips and metric-help popovers support desktop and mobile. Each chart offers a data table and expanded view when data is available, plus loading, empty, isolated error and retry states. Reduced motion is honored.

TanStack Query caches by validated account/session scope, section and canonical applicable filters. Requests receive AbortSignals, previous chart results stay visible during applicable transitions, and explicit refresh invalidates active queries. A response from a different signed-in scope is rejected. Activity uses stable source IDs and timestamp/ID cursors, 25 events per page. Vehicle sheets query their selected summaries/trends only when opened.

## Migration and verification

`20261010104423_customer_usage_analytics.sql` is applied and recorded. It adds a server-only, RLS-protected ephemeral limiter: up to 90 analytics requests per real verified session per minute. Browser roles have no table/function grants. It creates no rollups or new historical event store.

The production customer build, focused lint and TypeScript checks passed. Twenty-five analytics/auth tests and seven existing query-cache tests passed. Real PostgreSQL checks verified all seven section queries, account isolation, safe projections, matching time/rhythm/comparison totals, finalized storage composition, pending/failed/deleted exclusion, persisted scan replay, late-event/India-midnight bucketing, activity cursors, request limits and server-only grants. State mutations used solely for verification were rolled back. EXPLAIN ANALYZE took roughly 0.4–1.1 ms per aggregate for the sampled current account; this does not establish performance at all future data volumes. Existing indexes were inspected; no speculative indexes or rollups were added.

The browser available to the agent reaches `/analytics` but is signed out and redirects to login. Authenticated visual, touch, keyboard, tooltip and viewport QA remain unverified. The customer application has not been deployed by this task; the local development app uses the actual configured services.

Useful commands:

```powershell
npm run typecheck --workspace=@vaahansafe/customer
npm run build --workspace=@vaahansafe/customer
node node_modules/vitest/vitest.mjs run tests/customer-analytics.test.ts tests/customer-analytics-authorization.test.ts tests/customer-query-cache.test.ts
node tooling/scripts/verify-customer-analytics.mjs --existing
```
