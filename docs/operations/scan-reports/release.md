# Finder location, photos and WhatsApp reports

The QR safety page now offers owner-approved Call and WhatsApp contact actions, followed by a finder report form styled with the existing theme. The finder chooses a reason, optional note, GPS location and up to three photos, then explicitly consents before submitting. WhatsApp opens a draft for direct contact; it does not send a message automatically.

Phone GPS is the finder's location near the vehicle, with measured accuracy and capture time. Scanning a QR alone cannot determine an exact car location or obtain photographs. Missing permissions or provider failures never produce invented coordinates, images or delivery success.

Reports use the existing Supabase business database and Cloudflare R2 storage. The report RPC requires an activated QR, an unambiguous current owned vehicle, an active owner with a verified mobile, and all three verified capabilities: `SAFETY_VIEW_ACTIVE`, `EMERGENCY_ROUTING`, `SCAN_HISTORY_LOGGING`. Turnstile is verified server-side with the exact hostname and action. Uploads are limited to three genuine JPEG/PNG/WebP files, 1 MB each. Browser photo preparation redraws images to remove original metadata.

## Live service configuration

- Applied and recorded Supabase migrations `20261010080149_qr_scan_reports.sql` and `20261010082612_qr_scan_report_completion_guards.sql`. Report tables have RLS, and browser roles have neither table access nor RPC execution rights.
- Created private R2 bucket `vaahansafe-prod-private`. Both managed public access and custom public domains are disabled. Its `scan-reports/` lifecycle rule expires photo objects after 90 days; unrelated prefixes and existing buckets are untouched. Customer routes deny expired reports and check the saved report owner on every photo request.
- Created managed Turnstile widget **VaahanSafe QR scan reports**, restricted to `qr.vaahansafe.com`, with pre-clearance off. Keys are saved in ignored QR app environment files.
- Created MSG91 utility templates `vhn_vehicle_report_v1` and `vhn_vehicle_emergency_report_v1`. Both exact English contracts were confirmed approved on 10 October 2026 and synced to Supabase. They use five text variables: masked registration, reason, scan time, consented GPS/maps text, and authenticated report link. Photos are accessed through the report link rather than publicly exposed or attached to WhatsApp.

Customer notifications immediately link to saved report details. WhatsApp follows the existing owner preferences and notification scheduler. Provider acceptance remains distinct from confirmed delivery. The runtime rechecks exact template approval before claiming report intents. A pending, rejected or disabled template keeps its reports queued.

## Release

Deploy the customer app before the QR app so report links, private photo routes and the new outbox template renderer are available before new public submissions. This workspace contains unrelated pre-existing changes; review and release the relevant app changes separately.

Configure the actual deployment environments, using the values from the ignored local environment files:

| Application | Required configuration |
| --- | --- |
| QR | Existing Supabase server credentials; `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; server-only `TURNSTILE_SECRET_KEY`, `SESSION_SECRET` (at least 32 characters), `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_SCAN_REPORTS_BUCKET=vaahansafe-prod-private`, `CLOUDFLARE_SCAN_REPORTS_API_TOKEN` |
| Customer | Existing Supabase and MSG91 server credentials/sender/namespace; existing authenticated notification scheduler configuration; the same private R2 account, bucket and server token |

The Cloudflare production Wrangler configuration also contains a dedicated `SCAN_REPORT_STORAGE` binding for deployments that use native R2 bindings. Server-only keys must never be placed in `NEXT_PUBLIC_*` variables. Localhost is not an allowed Turnstile hostname; use the real configured domain for browser submission checks.

After deployment, verify the owner report link, denied unauthenticated photo access, disabled contact actions, and one explicitly authorized owner-only WhatsApp delivery with correlated provider callback. No live messages were sent during this implementation.

## Validation

Both QR and customer production builds pass. Focused tests cover consent/GPS/image limits, QR gates, duplicate requests, failed upload recovery, cancellation versus completion races, private contact projection, exact provider approval contracts, template variables, outbox policy, and owner isolation. The real Supabase reservation/completion/replay/deduplication transaction was exercised with an existing eligible QR and rolled back completely. Real R2 upload/download passed and the dedicated health-check object was removed.

Useful scripts:

```powershell
node tooling/scripts/apply-scan-report-migration.mjs --verify
node tooling/scripts/sync-scan-report-templates.mjs --sync
node tooling/scripts/configure-scan-report-services.mjs --buckets
node tooling/scripts/verify-scan-reports.mjs --storage
```

The migration apply script accepts `--file=20261010082612_qr_scan_report_completion_guards.sql` for the follow-up migration. Already-recorded migrations are refused rather than reapplied. The verification script does not send provider messages or leave business test records.

Provider references: [Cloudflare Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [R2 lifecycle configuration](https://developers.cloudflare.com/api/resources/r2/subresources/buckets/subresources/lifecycle/methods/update/).
