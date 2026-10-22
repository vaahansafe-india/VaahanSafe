# Park by VaahanSafe

The public, paper-themed Park landing page is hosted directly on Vercel.
The **Open Park** action enters `https://app.vaahansafe.com/park`, the private parking
workspace in the existing customer app. It reuses the real HttpOnly session, verified
mobile rule and vehicle ownership. No cross-domain bearer tokens or new sign-in system.

## First release

- Save fresh GPS once, with consent, for an active owned vehicle.
- Store floor, bay, notes and an optional return-by countdown.
- View a map, GPS accuracy, elapsed time and Google Maps walking directions.
- End a parking session, view the latest 50 records, permanently delete a private record.
- Server-side Ola Maps reverse geocoding, with clear provider attribution and policy links.

The countdown runs while the page is open. No background alarm, live tracking,
parking availability, booking or parking payment is offered.

## Production architecture

Public UI → Vercel static hosting. Private workspace → customer Next.js API on Vercel →
authenticated parking service → existing Supabase Postgres. Migration:
`supabase/migrations/20261022171833_park_sessions.sql`.

`park_sessions` enables RLS and revokes `anon`/`authenticated` access. Existing
VaahanSafe sessions authorize the server. The server-only `start_park_session` RPC
locks the owned vehicle and enforces one open session per vehicle with a partial
unique index. Request UUIDs make uncertain network retries idempotent. Parking does
not grant QR or subscription entitlements, or publish a location on a public QR.

Configure `OLA_MAPS_API_KEY` in the **customer server environment**, not this public
landing app, `NEXT_PUBLIC_*`, or tracked files. Address lookup failure leaves the actual
saved GPS point intact without fabricating an address. Ola Maps supplies the map preview
and address. The authenticated image endpoint checks current vehicle ownership before
requesting a fixed-size map, permits zoom levels 12–19, and keeps the key server-only.
Provider failures show a retry state; saved parking details remain available. The preview
supports zoom and an expanded dialog, with no panning or live tracking.

Dedicated SVG, Apple touch and maskable install icons are shared across the landing and
workspace. Regenerate them with `node tooling/scripts/generate-park-icons.mjs` from the
repository root. The manifest adds an app identity without claiming offline support.

## Commands

From this directory: `npm run build`, `npm run dev`, `npm run typecheck`.
The build compiles Tailwind 3 and copies existing licensed fonts/paper texture.
`public/art/park-hero.webp` was generated for this project. Icons reuse Hugeicons.

The Vercel project uses `apps/park` as its root directory. `build-vercel.mjs` emits
native Build Output API v3 static assets, security headers, SEO files and the
`/workspace` redirect. It does not proxy Cloudflare or require a Cloudflare runtime.
Connect `park.vaahansafe.com` in the Vercel project domain settings and add the
exact DNS record supplied there at the domain's authoritative DNS provider.
