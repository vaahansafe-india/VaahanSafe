# Customer Scan Analytics

`/analytics/scans` is a separate customer workspace. Storage Analytics remains at `/analytics/storage`. Both reuse the verified customer session and existing server analytics service.

## Recorded metrics

- Total scans: persisted events for currently owned QR assignments in the selected period.
- Successful resolutions: `RESOLVED_ACTIVE`, indicating that the resolver returned an active safety projection.
- Non-active resolutions: every other outcome, including activation required and missing outcomes.
- QR identities scanned: distinct owned `qr_id` values with recorded events. Repeated scans of one QR do not increase this count. This is not a count of people.
- Activation required: `RESOLVED_INACTIVE`, a subset of non-active resolutions. Its sparkline uses only inactive events.

The timeline partitions observations into active, activation required, and all remaining outcomes. The first three headline metrics are not additive: total already contains the other metrics. Previous-period comparisons use an immediately preceding period of equal length and the same filters. Reliable scanner identities and resolver durations are not recorded and are not presented as measured metrics.

## Exploration

The D3 flow connects vehicle, QR identity, and recorded outcome. Hovering or focusing a node emphasizes its related paths. Paths use proportional count widths with zero width for zero observations. Selecting a node filters the server queries; keyboard Enter and Space perform the same action.

Each analytical panel has an independent query, retry, skeleton, data table, and expanded view. Previous results remain visible with an updating treatment during filter transitions. On phones, expansion opens a full-screen sheet; the flow and heatmap get scrollable visual canvases while their cards keep the dedicated mobile lists. Missing or unrecognized geography remains a visible ranking even when no event can be mapped.

## Data boundaries

The current application database adapter uses Supabase PostgreSQL. Cloudflare provides the existing QR resolver and infrastructure; no alternative database, scanner identity store, or telemetry source is introduced. Every aggregate validates the real session, verified phone, and account ownership before returning minimal projections. Queries accept parameterized filters and bounded India-calendar date ranges. Browser roles have no analytics table/function access. Raw IP, user agent, session token, public resolver identifier, and activation credentials are excluded from projections.

## Verification

Run the customer TypeScript check, focused ESLint, and isolated production build. The live verification checks all nine scan queries, cross-account isolation, safe projections, reconciled totals, state/city/outcome/time filters, India-midnight events, activation-required counts, and repeated-scan distinct-identity behavior. Its temporary test events are rolled back.

```powershell
npm run typecheck --workspace=@vaahansafe/customer
node tooling/scripts/verify-scan-analytics.mjs
$env:VAAHANSAFE_BUILD_CHECK='1'
npm run build --workspace=@vaahansafe/customer
```

The in-app browser reaches the route and enforces sign-in. Authenticated viewport, touch, and visual QA requires a signed-in browser and has not been completed in this session. No deployment was performed.
