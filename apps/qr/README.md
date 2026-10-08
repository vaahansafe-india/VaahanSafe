# QR app

## Runtime

The public QR app reads the existing Supabase Postgres database on the server.
Cloudflare remains the configured hosting, asset delivery and monitoring platform.
Its obsolete D1 database bindings and QR-specific D1 HTTP credentials have been removed.

- `lib/supabase-resolver.ts` uses one joined native Supabase read against the canonical QR, assignment, vehicle, profile, entitlement and contact tables.
- The shared QR domain computes lifecycle state and the public projection. An active profile requires matching vehicle ownership, an enabled `SAFETY_VIEW_ACTIVE` entitlement and a valid expiry. Missing records block access; service failures show a recoverable error.
- Queries select only the fields needed by the resolver. Only explicitly approved profile details and callable contacts reach the public page.
- Resolver pages are dynamic and noindex. They do not cache personal safety information or include landing artwork or the camera scanner.
- Existing scan logging and notification services use the shared Supabase database adapter. Next.js `after()` schedules this work after the response. Prefetch requests and crawlers are excluded.

## Environments

The existing ignored `.env.local` and `.env.production` files retain the configured Supabase credentials. Local URLs use the monorepo localhost ports; production URLs use the VaahanSafe domains.

Required server environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or the existing `SUPABASE_SECRET_KEY`)

Privileged keys must remain server-only. Never prefix them with `NEXT_PUBLIC_`, expose them in React props, or add them to Wrangler `vars`. The server-only repository rejects missing credentials without a local fallback.

For a Cloudflare Worker deployment, configure the existing server key as a Wrangler secret in the selected environment:

```powershell
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
```

Use the existing project credentials; the command must not create a new public key or change customer authentication. Repeat for any development or staging Worker that needs access. Configure public application URLs at build time for the selected environment. Cloudflare queue bindings and observability remain in `wrangler.jsonc`.

This change configures local files; it does not deploy a Worker or change remote secrets.

## Paper interface and performance

The landing content renders on the server. Only navigation, theme selection, ID lookup and scanning need client JavaScript. The scanner and image decoder load on demand. A narrow `@vaahansafe/qr-core/scanner` export avoids importing the QR encoder and Node crypto dependencies into the landing bundle.

Typography uses licensed local Inter and Cormorant Garamond fonts. The paper texture and transparent WebP artwork are local assets; the privacy illustration loads lazily. Controls use small 4px corners, visible keyboard focus and mobile touch targets. FAQs use native disclosure controls. The scanner supports Escape, focus containment, focus restoration and manual ID entry.

Generated artwork (built-in image tool):

- `public/images/qr-scan-concept.webp` — transparent roadside scan illustration, approximately 146 KB.
- `public/images/qr-privacy-concept.webp` — transparent privacy illustration, approximately 98 KB.
- Prompts: `../../output/imagegen/qr-scan-concept.prompt.md` and `../../output/imagegen/qr-privacy-concept.prompt.md`.

## Verification

```powershell
npm run typecheck --workspace=@vaahansafe/qr
npx vitest run tests/public-qr-resolver.test.ts tests/qr-landing-page.test.ts tests/qr-scanner-architecture.test.ts tests/qr-scanner-payload-validation.test.ts tests/qr-resolver-projection.test.ts tests/secure-qr-entitlement-machine.test.ts
npm run build --workspace=@vaahansafe/qr
```

Keep production builds separate from a running Next.js development build. The focused suite verifies lifecycle states, entitlement failures and expiry, privacy flags, callable contact approval, scanner URL validation and resolver/landing bundle isolation. Live Supabase reads and desktop/320px/390px browser checks were also performed. Camera permission was not granted during verification.
