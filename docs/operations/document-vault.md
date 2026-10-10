# Customer Vehicle Document Vault

The customer sidebar includes **Documents** under **Vehicle Identity**, opening `/documents`. The active state covers document detail and viewer routes. Vehicle dossiers link to `/vehicles/[vehicleId]/documents`; these pages filter the same owned records. Breadcrumbs identify the global and vehicle document pages.

The vault extends the existing real customer session and Supabase authorization architecture. Metadata lives in server-only Supabase tables; original PDF/JPEG/PNG/WebP files and optional WebP thumbnails live in the private Cloudflare R2 bucket `vaahansafe-prod-documents`. Account access, Vault PIN and document password are additional server authorization controls, not client-side file encryption or government verification.

## Features and security

- Grid/list views, server search, category/vehicle/file/protection/validity filters, stable cursor pagination, expiry indicators and real empty states.
- Four-step upload, camera input, original preservation, signature and size checks, direct upload progress, immutable replacement versions and status recovery after interruption. A pending upload never becomes a ready document before the Worker confirms storage and database finalization.
- PIN/password verifiers use salted scrypt. Protected access is scoped to a real revocable session, revisions and unlock expiry. PIN reset requires a recent real sign-in or an existing vault unlock. Five failed attempts per 15 minutes are enforced in the database.
- Once a Vault PIN is configured, it gates all owner file content, including account-protected files. Locking removes this session's unlocks and file grants; document passwords remain an additional gate. The UI clears previews, thumbnails, pending actions and sensitive dialogs, displays the server's locked state, and uses the actual server unlock expiry for auto lock. Without a PIN, the lock button opens PIN setup. Previously authorized public share links retain their own explicit restrictions.
- PDF/image previews, page controls, zoom, rotation, fullscreen and original downloads. PDF.js worker, character maps, fonts and decoders are self-hosted. Private URLs bypass the Next image optimizer cache.
- Opaque share tokens are hashed at rest and carried in URL fragments. Links expire, can require a passcode, impose an atomic view limit and restrict original downloads. Revocation/security changes invalidate existing access grants. Visible content can still be copied or photographed.
- File capabilities expire after 60 seconds and are rechecked against current ownership, vehicle/account state, session revocation and document protection on every Worker read. R2 public access is disabled. No service key or object key is returned to the customer browser.
- Soft deletion immediately denies access and revokes shares. A scheduled Worker deletes stored objects before releasing their quota; version and activity metadata remain for audit. Deleted files have no restore action.

The database policy currently allows 20 MB per original, 200 documents and 500 MB per account. Usage includes version originals and a conservative 128 KB thumbnail reservation per version. These are vault policy limits, not subscription entitlements. Failed/interrupted reservations are cleaned up after their lease expires.

## Live infrastructure and release

The private R2 bucket and `vaahansafe-document-vault` Worker are configured. The Worker allows the exact production origin `https://app.vaahansafe.com` and the explicitly configured development origin `http://localhost:3001`. It uses its R2 binding, server-only Supabase secrets and a ten-minute cleanup schedule. Other origins and ports are denied; each upload and read still requires its session-bound capability. Local development uses the same real services. If a preflight prevented any upload bytes from being received, **Check upload status** exposes **Retry upload** to reuse that pending upload instead of creating another document.

Applied, recorded migrations:

1. `20261010090645_customer_document_vault.sql` — metadata, versioning, quota, authorization, shares, cleanup and server-only grants/RLS.
2. `20261010093022_customer_document_vault_recovery.sql` — lease-bound upload failure recovery that preserves ambiguous finalization.
3. `20261010095138_customer_document_vault_share_attempts.sql` — successful sharing does not accumulate failed passcode attempts; actual guessing remains limited.
4. `20261010102835_customer_document_vault_session_lock.sql` — whole-vault PIN gate, authoritative lock/expiry state, explicit unlock scopes and serialization of file grants with lock changes.

The customer application is deployed on Vercel as `vaahan-safe-customer`, at `app.vaahansafe.com`. On 2026-10-10, production runtime logs confirmed that `/documents` failed with `SERVICE_UNAVAILABLE` (digest `2132527617`). The stack pointed to `workerUrl()`, and the hosted environment was missing `DOCUMENT_VAULT_WORKER_URL`.

The following public configuration values were saved to the project's **Production** environment:

| Variable                            | Value                                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| `DOCUMENT_VAULT_WORKER_URL`         | `https://vaahansafe-document-vault.vaahansafe.workers.dev` |
| `CLOUDFLARE_R2_SCAN_REPORTS_BUCKET` | `vaahansafe-prod-private`                                  |

The second setting addresses a separate missing configuration found while investigating HTTP 503 failures on private scan-report photo routes. Existing credentials were retained. A new deployment is required to apply both settings. The user subsequently held deployment to review the photo UI changes first; no new production deployment was launched. Until deployment completes and authenticated access is checked, the hosted fix is not verified.

On 2026-10-10, the existing dedicated `CLOUDFLARE_SCAN_REPORTS_API_TOKEN` from the
ignored customer production environment file was also saved to Vercel as a
Production Secret after explicit approval. Its entry name and environment scope
were verified without revealing the saved value. No credential was rotated and
deployment remains held.

Read-only checks confirmed the four vault tables, projection/session/thumbnail RPCs, quota policy and listing SQL are available. Live checks confirmed the private Worker accepts the configured production/development origins, denies foreign origins and enforces file capabilities. No customer documents or settings were changed by those checks.

## Verification

- Customer production build and TypeScript checks passed with all new document routes.
- Focused customer lint passed without warnings/errors.
- Eighteen focused tests passed for signature/expiry policy, exact production/localhost CORS matching, denied origins/access, vault lock denial before R2 access, ranged streaming, idempotent upload, failed leases and ambiguous finalization.
- Real PostgreSQL rollback-only checks passed for upload reserve/claim/finalize/replay, replacement serialization/recovery, protected access, PIN reset, session/vehicle revocation, expiry/view/download/share restrictions, successful share attempts versus guessing limits, deletion/cleanup accounting and server-only RLS/RPC grants. These checks persist no synthetic customer documents or changed customer settings.
- Live infrastructure checks verified disabled public R2 access, denied unknown/foreign-origin access and a temporary R2 health-check object that was read and deleted.

The available in-app browser reaches localhost but has no authenticated customer session, so authenticated browser uploads, visual layout checks and mobile interactions remain unverified. The lock migration was tested before and after application on real PostgreSQL using rollback-only checks; no verification documents or customer setting changes persisted. PDF files are not claimed to be virus-scanned or government-verified. Optional reminders, tags, offline storage and bulk actions are not implemented.

Useful commands from the repository root:

```powershell
npm run build --workspace=@vaahansafe/customer
node node_modules/vitest/vitest.mjs run tests/document-vault.test.ts
node tooling/scripts/verify-document-vault.mjs --existing
node tooling/scripts/verify-document-vault-infrastructure.mjs
```
