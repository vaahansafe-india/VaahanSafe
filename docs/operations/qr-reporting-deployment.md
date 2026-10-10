# QR public reporting deployment

The public QR redesign runs at `http://localhost:3003`. The existing resolver,
Supabase report RPCs, private Cloudflare R2 storage and notification outbox are
retained. No migration is required for this UI change.

## Production reporting configuration

The deployed QR page previously rendered “Reporting is temporarily unavailable”
because its public Turnstile site key was missing. A local `.env.production` file
does not configure the hosted Vercel project.

Set these variables on the **QR project's production environment**, using the
existing production values (never expose server secrets with `NEXT_PUBLIC_`):

| Variable                            | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `TURNSTILE_SITE_KEY`                | Public widget key read by the server-rendered page at runtime |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`    | Same public widget key for build compatibility                |
| `TURNSTILE_SECRET_KEY`              | Matching server-only Turnstile verification secret            |
| `TURNSTILE_HOSTNAMES`               | `qr.vaahansafe.com`; exact production hostname allowlist      |
| `SUPABASE_URL`                      | Existing production relational service                        |
| `SUPABASE_SERVICE_ROLE_KEY`         | Existing server-only resolver and report RPC credential       |
| `CLOUDFLARE_ACCOUNT_ID`             | Existing Cloudflare account                                   |
| `CLOUDFLARE_R2_SCAN_REPORTS_BUCKET` | `vaahansafe-prod-private`                                     |
| `CLOUDFLARE_SCAN_REPORTS_API_TOKEN` | Existing private R2 server credential                         |
| `SESSION_SECRET`                    | Existing server secret used for rotating report abuse hashes  |

Use the project's existing production domain variables from
`apps/qr/.env.example`. Redeploy the existing QR project after environment changes.
The runtime site key fallback is included in this change. Do not replace the
production widget with a test widget or bypass server verification.

## Existing Turnstile widget

The existing widget uses public site key `0x4AAAAAAFS8chQnG6rN0vCT`. The approved
`localhost` hostname was saved through the authenticated Cloudflare dashboard,
retaining `qr.vaahansafe.com`, Managed mode and no pre-clearance. No replacement
widget was created and no secret was retrieved or rotated.

The matching secret already configured in the Git-ignored QR environment files
was accepted by Cloudflare Siteverify: an invalid probe returned
`invalid-input-response`, without `invalid-input-secret`. Both files now contain
the matching runtime public site key. The deployment-specific hostname setting is:

```dotenv
# apps/qr/.env.local (next dev)
TURNSTILE_HOSTNAMES=localhost
# apps/qr/.env.production and hosted production environment
TURNSTILE_HOSTNAMES=qr.vaahansafe.com
```

The report API rejects missing, non-string and oversized tokens before making a
verification request. Siteverify must return literal `success: true`, action
`scan-report` and the exact allowed request hostname. Production rejects local
hostname configuration. Verification failures stop report, upload and
notification work. The browser retains the widget ID and resets it after a
submission attempt so retries obtain a fresh token.

Follow the [Cloudflare existing-widget flow](https://developers.cloudflare.com/turnstile/spin/prompt.md)
for future credential changes. Keep matching secrets server-only and use the
existing environment or platform secret store.

### Hosted environment synchronization — 2026-10-10

The QR Vercel project's Production environment now contains
`TURNSTILE_SITE_KEY=0x4AAAAAAFS8chQnG6rN0vCT`, the matching
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_HOSTNAMES=qr.vaahansafe.com`, and
`CLOUDFLARE_R2_SCAN_REPORTS_BUCKET=vaahansafe-prod-private`.

The customer Production environment was checked again: its private scan-report
bucket and `DOCUMENT_VAULT_WORKER_URL` are saved. The existing account, general
Cloudflare API token and authentication settings were retained in both projects.
The ignored local and production environment files already contain the correct
app-specific Cloudflare configuration.

After explicit approval, the existing matching `TURNSTILE_SECRET_KEY` was saved
as a Secret in the QR project's Production environment. The existing dedicated
`CLOUDFLARE_SCAN_REPORTS_API_TOKEN` was also saved as a Secret in both the QR and
customer Production environments. Sources were the respective ignored
`.env.production` files. The saved entry names and Production scopes were checked
in Vercel; credentials were not retrieved from Cloudflare or rotated. Deployment
remains held at the user's request. Saved settings do not alter the currently
deployed release.

## Validation

```powershell
$env:VAAHANSAFE_BUILD_CHECK='true'
npm run build --workspace=@vaahansafe/qr
npx vitest run tests/qr-turnstile.test.ts tests/scan-reports.test.ts tests/public-qr-resolver.test.ts
node tooling/scripts/verify-qr-reporting-deployment.mjs
```

The deployment verifier makes a read-only, prefetch-marked request and prints
only configuration booleans. It does not submit reports or send notifications.
An end-to-end production report test should use an explicitly approved recipient
and report because it queues real owner notifications. A saved/queued report
does not imply provider delivery has already succeeded.

Local validation on 2026-10-10: all 55 targeted tests, QR TypeScript and the
production build passed. The user's real local report was accepted and the UI
confirmed its owner notification was queued. The tests cover Cloudflare's
`timeout-or-duplicate` rejection response; replaying the same real token against
the live endpoint remains untested. Hosted environment synchronization is now
complete; source deployment, activation of the saved settings and authenticated
production verification remain required before claiming production readiness.

UI validation should cover 320–430px and desktop, keyboard selection, Help and
photo dialog focus, step Back/Continue, retained notes, optional details, consent,
security failure, disabled submission, and offline/network retry. Photo bytes
are prepared locally and only uploaded when the user sends the report.

## Customer photo rendering and location

The customer photo API needs `CLOUDFLARE_R2_SCAN_REPORTS_BUCKET=vaahansafe-prod-private`
and the existing server-only Cloudflare account/token configuration. The bucket
setting was missing from the deployed customer project and was saved to Vercel's
Production environment on 2026-10-10. Deployment is held at the user's request
while reviewing the rendering changes.

Read-only checks of the reported failure confirmed all three photo objects exist
and match their saved sizes. The same real report then loaded all three images
through the authenticated local customer endpoint. The gallery was checked at
normal and phone widths; the phone view had no horizontal overflow. It now keeps
preview space reserved, provides loading/error/retry states, handles images that
finish before hydration, and opens originals through the same private API. All
photo endpoint responses, including errors, are private and uncached. Existing
owner, verified-session and expiry checks remain in place.

The reported encounter had no saved GPS coordinates. Its missing-location state
is truthful and cannot be replaced with an inferred precise position. The QR form
now distinguishes permission denial, timeout and unavailable device location,
offers an update action, and explains broad accuracy estimates. GPS is still
optional and captured only after the finder chooses to share it; a coarse network
region is not presented as finder-shared GPS. Live device GPS capture remains
unverified.

Verification for these changes: 41 report/storage/analytics tests, both customer
and QR TypeScript checks, and focused customer lint passed. The local browser
check used existing real report data; no reports or notifications were created by
these checks. The UI changes still require source deployment, in addition to
activating the saved environment settings.
