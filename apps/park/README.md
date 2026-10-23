# Park by VaahanSafe

The public Park product landing page is hosted directly on Vercel.
The **Open Park** action enters `https://app.vaahansafe.com/park`, the private parking
workspace in the existing customer app. It reuses the real HttpOnly session, verified
mobile rule and vehicle ownership. No cross-domain bearer tokens or new sign-in system.

## First release

- Save fresh GPS once, with consent, for an active owned vehicle.
- Store floor, bay, notes and an optional return-by countdown.
- View a map, GPS accuracy, elapsed time and Google Maps walking directions.
- End a parking session, view the latest 50 records, and open a previous stop's map,
  location, timestamps, floor, bay and notes. Permanently delete a private record.
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
saved GPS point intact without fabricating an address. Ola Maps supplies address lookup.

Interactive road and satellite maps use Google Maps Embed API. Set
`GOOGLE_MAPS_EMBED_API_KEY` in the customer server environment (Vercel Production).
Use a separate browser credential restricted to `https://app.vaahansafe.com/*` and
**Maps Embed API only**. This restricted key necessarily appears in the iframe URL;
do not substitute a private provider credential or commit its value.
The authenticated map endpoint rechecks current vehicle ownership and returns only a
Google Embed URL built from the saved record, with bounded zoom and allowlisted map
types. It does not accept browser-supplied coordinates or arbitrary provider URLs.
Responses are private/no-store. Google receives the saved coordinates only after
the user chooses **Load Google Maps** for that record; consent lasts only in React
state and resets on reload. The iframe explicitly sends the origin referrer for key
restrictions. A dedicated `/park/map/[id]` page, walking directions and retry states
keep saved details accessible. No live vehicle tracking or Google geocoding is enabled.

The full-page map has a desktop details rail and an expandable mobile details panel.
Both active and completed stops use the same authenticated record and current vehicle
ownership checks. Opening the page does not start or end a session or load Google
before consent. It supports direct links, loading, unavailable and not-found states.

The landing page uses the existing pinned Framer Motion 12 DOM entry for reveal,
parallax and reading-progress animations. It keeps static HTML content visible with
JavaScript disabled and disables effects when reduced motion is requested. Assets,
fonts and the animation bundle are served locally under a self-only script policy.

The product landing uses bold Inter typography, white and light-grey surfaces,
blue calls to action, green feature accents, a compact navigation header and a
horizontal feature finder. Three illustrated product cards lead into maps,
numbered setup steps, privacy features, FAQs and the account action. Each artwork
is used in a single section. Images are decorative, not fabricated parking records.
Native scrolling, image parallax and Framer Motion reveals respect reduced motion.

The centered, full-width hero has three dedicated background illustrations, an
eight-second automatic crossfade, pagination and a pause control. Rotation pauses
for keyboard focus, manual navigation, hidden tabs, hovering the slideshow controls
and when the hero is outside the viewport. Reduced-motion users get a still hero
with instantaneous manual scene changes. The first background and all copy remain
available without JavaScript. Background illustrations are decorative; the heading
and controls stay accessible as ordinary HTML. Responsive WebP sources and local
assets keep third-party image services out of the page.

Each illustration belongs to one section: three new backgrounds in the hero,
neighbourhood/café/coast in the product cards, the notebook artwork in Features and
a new flower-market illustration in the story. The former repeated journal carousel
has been replaced by the hero slideshow. Prompts and final asset filenames are in
`HERO-ART-PROMPTS.md`.

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
