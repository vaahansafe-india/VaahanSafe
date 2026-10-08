# VaahanSafe admin console

The console uses the existing Supabase database routing selected for this task and Cloudflare R2 for object storage. It does not seed users, invent business records, or store authentication or business state in browser storage.

## Delivered interface

- All 30 requested workspaces, grouped into operations, commerce/customer, and platform/content.
- Warm ivory paper surfaces and terracotta accents matching the web/customer theme, 3px corners (`rounded-sm` treatment), locally served Inter and editorial fonts, responsive navigation, keyboard focus, accessible dialogs, and AOS animations that respect reduced motion.
- Responsive email/password sign-in with shared VaahanSafe branding, a desktop paper illustration, and a compact phone layout with 48px controls, stacked verification steps, safe-area spacing, and a shorter footer. An exact `@vaahansafe.com` work email is required before the password step; the same domain restriction is enforced on the server and in the session RPC.
- Live dashboard metrics; paginated, filtered record lists; safe record inspection; permission-aware global search. Phone lookup uses POST and is audited, with masked results.
- Partner, support ticket, document, incident, and feature-flag management; Blog CMS drafts, editing, publishing, unpublishing, and archival; validated raster image uploads to R2.
- Bulk QR blocking with a server-stored preview, affected count, snapshot validation, confirmation, reason, fresh mobile verification, QR history, and an atomic audit trail.
- Asynchronous private CSV exports with role checks at request, generation, and download, independent masking, formula-injection protection, a 10,000-record limit, and 24-hour expiry.

Financial records and acquisition/entitlement state remain controlled by the existing payment, activation, and fulfillment services. The console provides read-only views for these records. Batch creation, physical stock transfers/reconciliation, shipping changes, replacement approval, and notification replay are not mutation workflows in this release. Transfers/reconciliation expose the real operational ledgers; an empty ledger is shown truthfully. Incident and feature-flag records are managed here; this release does not add consumers to the public status app or other applications.

## Access and safety

Seven roles are enforced both on the server and in navigation: `SUPER_ADMIN`, `OPS_ADMIN`, `SUPPORT_AGENT`, `FINANCE_ADMIN`, `CONTENT_EDITOR`, `STATUS_MANAGER`, and `READ_ONLY_ANALYST`.

Supabase Auth verifies the email and password on the server using a separate, nonpersistent client for each request. Only explicitly approved accounts with a pinned `auth_user_id`, confirmed email, active status, and recognized role can create a pending-mobile session. Owning a company email alone does not grant access. Real MSG91 OTP verification is required before entering the workspace. Passwords remain in Supabase Auth; provider tokens never reach the browser. Session tokens are hashed in the database and delivered only through `vs_admin_session` HttpOnly, SameSite=Lax cookies, Secure in production. Sessions expire after four hours and are revocable. Privileged operations require an OTP verified in the last ten minutes. Mutations reject cross-origin requests. No browser bearer-token persistence is used.

Password sign-in reserves attempts atomically in a private database table before contacting the provider: five attempts per normalized email per fifteen minutes and one hundred attempts per minute across the console. Email addresses are hashed in these counters, expired counters are removed, and invalid passwords or unknown accounts produce the same safe response. Google initiation/callback URLs now redirect to sign-in and cannot create sessions; the Google session RPC is retired.

Admin tables have RLS enabled, with browser-role grants revoked. Administrative RPCs use `SECURITY INVOKER`, fixed search paths, and service-role execution only. Managed record changes, session lifecycle, inventory transitions, OTP attempts, and export lifecycle transitions write audit records within the same database transaction. Audit records reject updates and deletion. R2 uploads have an audit intent before the external write and a completion record afterward.

## Live Supabase release

`supabase/migrations/20261003175341_admin_operations_console.sql` was applied through the authenticated Supabase CLI on 4 October 2026 (IST). A dry run selected only that migration from an isolated release context, preserving unrelated pending repository migrations.

Verification confirmed:

- All module-selected columns exist in the real schema.
- All 13 admin tables have RLS and deny anon/authenticated table access after the password-auth migration.
- All admin functions deny anon/authenticated execution and avoid `SECURITY DEFINER`.
- The explicitly approved `admin@vaahansafe.com` account exists as an active `SUPER_ADMIN`. This is an operator-provisioned real account, not application seed data. A chosen Supabase Auth password and mobile verification are required.
- Supabase security advisors returned zero warnings for the new admin schema. Thirteen pre-existing warnings remain in older compatibility/QR functions and Supabase Auth configuration; they were not changed by this release.

Operator scripts (server credentials only):

```powershell
node tooling/scripts/provision-admin.mjs approved-email@vaahansafe.com
node tooling/scripts/set-admin-password.mjs approved-email@vaahansafe.com
node tooling/scripts/verify-admin-live.mjs approved-email@vaahansafe.com
```

Provisioning is idempotent and rejects silently elevating or reactivating an existing account. `verify-admin-migration.mjs` is a pre-deployment validation script for an unapplied migration: it executes DDL inside a subtransaction and rolls it back. After deployment, use `verify-admin-live.mjs` instead.

`set-admin-password.mjs` requires an existing, approved active admin account. Run it in your own terminal; it prompts twice with input hidden, requires 12–128 characters, stores the password through Supabase Auth, audits the reset, and revokes previous admin sessions. It never accepts passwords as arguments or prints them. `--prepare` binds the approved Auth identity without choosing a password or sending email; a newly prepared account cannot use password sign-in until a password is set. Password reset is an operator workflow, as indicated on the sign-in page.

`supabase/migrations/20261003192653_admin_password_auth.sql` was applied through the scoped Supabase CLI release on 4 October 2026 (IST). The approved `admin@vaahansafe.com` identity is pinned, and the owner-specified password has been saved in Supabase Auth. Real provider sign-in and the admin password endpoint were verified successfully; the endpoint issued only a pending-mobile HttpOnly session, which was revoked after verification. The password was not saved to a file, printed by tools, or sent by email. The operator command retains its default 12-character minimum for future password setup/reset. Verified mobile remains mandatory, and the missing Turnstile keys listed below must still be configured before completing that step.

The CLI uses a temporary login role; run linked database CLI operations sequentially. Simultaneous role initialization can invalidate the other operation's temporary password. A scoped admin push was made from the ignored `output/admin-supabase-release` folder. A generic root `db push` would also select older unrelated pending migrations and needs a separate review.

## Required runtime configuration

Use `.env.example` as the nonsecret configuration reference. Keep Supabase service keys, Cloudflare API tokens, MSG91 keys, and Turnstile secrets on the server. Do not commit them or put them in `NEXT_PUBLIC_*` variables.

1. Keep email/password authentication enabled in the existing Supabase project. Bind approved company accounts and choose their passwords using the operator command above. The admin app no longer requires Google OAuth configuration. Domain mailbox passwords are independent of these application passwords.
2. Configure `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Allow the admin hostname and localhost on the widget; the server validates hostname and the `admin_otp` action. These keys were absent during this implementation, so mobile sign-in and step-up are deliberately unavailable until configured.
3. Configure the existing real MSG91 OTP template and sender. No OTP is generated in the browser or printed in logs.
4. Set `ADMIN_ORIGIN` to the exact app origin. Set explicit production R2 bucket names and `NEXT_PUBLIC_ASSETS_URL`; do not inherit a development bucket for production.
5. Deploy the admin Next.js app through the repository's chosen Cloudflare hosting pipeline. This task built the app locally; it did not publish a new admin hosting deployment.
6. Deploy `infrastructure/cloudflare/workers/admin-exports/wrangler.toml` with server secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Its native `EXPORT_STORAGE` binding targets the existing private production export bucket. Then enable `ADMIN_EXPORT_WORKER_ENABLED=true` in the app. Exports remain disabled until this worker is configured and deployed. The worker processes durable database jobs every minute, with atomic claims, lease recovery, role rechecks, and expiring private objects.

Supabase connectivity and the existing Cloudflare R2 bucket were verified with real read-only requests. Auth/MSG91 checks in System Settings inspect configuration presence; they do not claim a successful identity flow or SMS delivery.

A hard-coded Supabase service key was removed from the existing journal repository. Rotate that previously exposed key through the normal credential rollout and update every dependent server before retiring it.

## Validation

Development artifacts live in `apps/admin/.next-dev`; production build/start use `apps/admin/.next`. This prevents a production build from overwriting the CSS, JavaScript, and server chunks of a running development preview.

With the admin app running, `node tooling/scripts/check-admin-assets.mjs` checks the sign-in response, every referenced CSS/JavaScript asset, and the favicon for successful HTTP responses and correct MIME types.

The production admin build and TypeScript check pass. Forty-two focused tests cover role isolation, typed UUID search, masking, CSV injection, export worker role/claim behavior, R2 metadata, storage lifecycle/security, OTP provider configuration, and QR entitlement boundaries. A Wrangler dry run successfully bundles the export worker with its native R2 binding.

Live unauthenticated API checks reject protected reads and mutations with safe errors; protected pages redirect to sign-in. The pending-mobile verification page was inspected in a real authenticated browser session at 320 × 700, 375 × 812, and 1367 × 768. Its full-window layout fits without page scrolling at those sizes, with compact controls and a responsive paper illustration. Shorter windows and zoom retain an accessible inner content scroll area. Authenticated end-to-end SMS and console mutation testing is pending the real mobile verification flow; no visual verification of the full authenticated console is claimed.

## Illustration and fonts

The transparent PNG is saved at `public/images/operations-paper.png`, generated using the built-in ImageGen tool with transparent background enabled. Prompt:

> Premium 2D layered paper illustration of a vehicle safety operations desk: small cream paper car, folded inventory cards, shipping box and abstract shield, arranged as a compact calm composition. Refined flat paper cut collage, tactile subtle fibers, restrained soft shadows, ivory and warm grey with muted sage green details. Fully transparent background, no background rectangle. No text, numbers, logos, readable or scannable QR, or people. Elegant professional supporting art, not a UI screenshot. PNG with true alpha transparency.

Locally served fonts and their existing open-source license files are in `public/fonts`.

The verification page uses the native SVG `public/images/mobile-verification-paper.svg`: a paper phone, shield, and foliage composition that scales cleanly between the desktop illustration panel and mobile heading.
