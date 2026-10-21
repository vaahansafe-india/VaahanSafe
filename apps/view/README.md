# VaahanSafe report viewer

`view.vaahansafe.com` is a separate report-viewing application. Cloudflare Workers
authorizes every report and photo request against the existing Supabase service,
then streams authorized photos from the private R2 report bucket. A small Vercel
project routes the custom domain to the Worker because the DNS zone is managed
by Vercel. No credentials or report records are stored by the routing project.

## Link lifetime and privacy

Links expire 24 hours after first issuance, or earlier if the report expires.
The database enforces the deadline and retries do not extend it. The owner can
revoke sharing from the report detail panel; revoked alerts cannot issue new
links. Changes to QR entitlement, ownership, account status or the selected
emergency contact's messaging permission immediately deny subsequent requests.

Only new reports with explicit viewer consent can create these links. Historical
reports remain private to their owners. A link opens one report without sign-in;
anyone holding it can view that report until access ends.

The token is a 256-bit, purpose-separated HMAC generated server-side using the
existing notification dispatch secret. Supabase stores only its SHA-256 hash.
The token stays in the URL fragment and is submitted in bounded POST bodies,
keeping it out of HTTP request URLs and referrers. There is no browser storage.
Viewer responses are uncached and excluded from indexing; Cloudflare invocation
logging is disabled for this bearer-link surface. Photo keys and internal IDs
are removed from the public report projection. No medical or account data is
included. The browser clears displayed report photos when the link expires.

## Deployment

1. Apply the versioned Supabase report-link migration after rollback verification.
2. Deploy `apps/view/wrangler.toml` and provision its existing Supabase server
   credentials using `tooling/scripts/deploy-report-viewer.mjs`.
3. Import the repository into a Vercel project with root `apps/view`, framework
   Other, and the configuration in `vercel.json`; attach `view.vaahansafe.com`.
4. Deploy the updated QR and customer apps. They collect viewer consent, issue
   per-recipient links, refresh template approvals, and support link revocation.
5. Sync approval for `vhn_vehicle_report_v2`,
   `vhn_vehicle_emergency_report_v2`, and `vhn_emergency_contact_report_v2`.
   Dispatch stays gated until the exact MSG91 contracts are approved.

The Cloudflare Worker is `vaahansafe-view.vaahansafe.workers.dev`. It has the
private `REPORT_PHOTOS` binding and a platform rate limiter. Deploying this Worker
does not make the R2 bucket public.

Production environment settings:

- Customer Vercel project: `REPORT_VIEWER_ORIGIN=https://view.vaahansafe.com`.
- Viewer Vercel project: `REPORT_VIEWER_WORKER_ORIGIN=https://vaahansafe-view.vaahansafe.workers.dev`.
- Viewer Cloudflare Worker: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as encrypted secrets.

The existing customer `NOTIFICATION_DISPATCH_SECRET` signs the recipient links.
Keep its value stable; changing it invalidates deterministic links in pending retries.
Never copy Supabase credentials into the Vercel routing project or public variables.

```powershell
node tooling/scripts/verify-qr-alert-routing.mjs --viewer
npx vitest run tests/report-viewer.test.ts tests/notification-outbox.test.ts
node tooling/scripts/deploy-report-viewer.mjs --deploy --secrets
node tooling/scripts/configure-report-view-templates.mjs --sync
```

Tests use unit fixtures or rollback-only transactions with existing real records.
They send no customer messages. A real new report with consent is required to
validate end-to-end WhatsApp delivery after deployment.
