# VaahanSafe SVG identity and centered public hero

## Scope and audit

The repository already contained shared brand components, a brand showcase at `/design-system`, the public homepage, synthetic homepage fixtures, and warm CSS colors. The original mark layered roof, bumper and V shapes over each other; it did not read clearly as a vehicle. The HTML wordmark was misspelled `VAHANSAFE`. Motion included scale overshoot, an infinite scanner, a rotating micro spinner and radar circles. Exported design tokens still described teal as primary. The original hero used a text/artifact split layout with blurred lighting and internal ledger language. Public navigation exposed the design system, resolver terminology and provider descriptions; the footer asserted availability without a live source.

The first request implements the complete shared SVG/motion system. The second request explicitly limits its first execution to audit, visual foundations and a complete centered hero. Existing homepage sections 02–15 are preserved; only navigation IDs were added to selected sections. Their copy and experiences still need the later product-story phase and have not been certified against the full landing-page brief.

## Identity geometry

- Master `viewBox`: `0 0 32 32`.
- Full mark: four filled paths (frame, vehicle, finder modules, data cells).
- Compact mark at 16–24 px: three filled paths; solid identity cells replace tiny finder voids.
- Canonical source: `packages/ui/src/brand/brand.geometry.tsx`.
- Rounded inward-facing frame terminals align with the vehicle shoulders. Lower terminals leave space around the identity cells.
- A single vehicle mass contains true even-odd windshield and headlight cutouts. Its central opening makes the QR identity part of the vehicle rather than a separate plate icon.
- Three abstract finder modules and two cells suggest identity. They contain no encoded payload, destination or activation credential.
- A subtle V dip is cut into the windshield; it is not an added letter.
- The hooked terminals, integrated identity channel and negative-space windshield provide the distinguishing geometry. This is custom SVG artwork; no company or automotive logo was traced.

Coral `#CC785C` is the frame and brand accent. The vehicle and identity use cream on dark, ink on light, or inherited `currentColor`. Monochrome uses `currentColor` throughout. Emergency red `#C64545` is reserved for error/emergency semantics. The app icon places the same geometry at 82% scale on dark or cream, with a 24% corner radius. The favicon uses the compact motif. The wordmark is HTML `VaahanSafe`, using the project's Cormorant Garamond display family and a Georgia fallback; application UI remains sans-serif.

## Reusable APIs

```tsx
import {
  VaahanSafeMark, VaahanSafeLogo, VaahanSafeAppIcon,
  AnimatedVaahanSafeMark, AnimatedVaahanSafeLogo,
  VaahanSafeQrScanner, VaahanSafeLoader,
  VaahanSafeMicroLoader, VaahanSafeIdentityPulse,
} from "@vaahansafe/ui/brand";

<VaahanSafeMark size={32} variant="brand" aria-label="VaahanSafe" />
<VaahanSafeMark size={16} variant="mono" aria-hidden="true" />
<VaahanSafeLogo size="md" theme="dark" orientation="horizontal" />
<VaahanSafeAppIcon size={64} variant="dark" />
<AnimatedVaahanSafeMark key={replayKey} size={64} onComplete={handleComplete} />
<AnimatedVaahanSafeLogo reducedMotion={true} />
<VaahanSafeQrScanner state="scanning" />
<VaahanSafeLoader label="Loading identity" />
<VaahanSafeMicroLoader size={16} />
<VaahanSafeIdentityPulse status="resolving" />
```

Mark variants: `brand`, `dark`, `light`, `mono`. Sizes accept numeric dimensions, including 512 px. Logo sizes: `sm`, `md`, `lg`, plus compatibility aliases `default` and `xl`. Orientations: `horizontal`, `stacked`. `theme` selects light/dark surface contrast; `variant="mono"` inherits color. Meaningful graphics receive a single brand label. Decorative SVGs suppress role, label and title. Class names and relevant accessible attributes are forwarded.

Consumers already importing `@vaahansafe/ui/styles/globals.css` receive motion styles. Standalone consumers can import `@vaahansafe/ui/brand/styles.css`. A new React key replays the signature reveal. `autoPlay={false}` shows the exact static component. The full reveal has no looping API. `durationMs` scales the animated mark's complete CSS timeline.

## Motion

The mark runs once over 1800 ms:

| Time         | Meaning                                                      |
| ------------ | ------------------------------------------------------------ |
| 0–180 ms     | Coral identity point                                         |
| 180–504 ms   | Frame formation                                              |
| 504–864 ms   | Finder/data modules build at the center                      |
| 828–1206 ms  | Single scan pass                                             |
| 1170–1530 ms | Vehicle resolves; identity aligns into its channel           |
| 1530–1800 ms | Frame settles from 0.97 to 1                                 |
| 1800–2120 ms | Optional wordmark enters with opacity and a 4 px translation |

Completion renders the actual `VaahanSafeMark` or `VaahanSafeLogo` component. Static mode and explicit reduced motion produce the same markup as the static component. Timers are cleaned up on unmount; callback changes do not restart the timeline.

The scanner accepts `idle`, `detecting`, `scanning`, `resolving`, `identified`, `error`. It is presentational: it performs no camera access, QR validation, activation, payment, provider or repository calls. Scanning makes a single 480 ms pass per scanning entry. Resolving fades and aligns the synthetic QR while revealing the canonical vehicle identity over 480 ms. Only caller-supplied `identified` state presents recognized identity. Error has an explicit exclamation mark and readable explanation. A concise polite live region announces state, never individual frames.

The full loader cycles four frame modules and a center identity motif over 1600 ms. The micro loader uses four filled cells at button scale. The optional pulse converges four cells gently. None rotates, overshoots, draws radar rings or uses filters. OS reduced motion disables all movement and hides transitional scan geometry. Explicit reduced-motion controls exercise the same static scanner/loader states in the showcase.

## Hero architecture

`RouteHero`, `IdentityField` and `VaahanSafeIdentityObject` are server components. The hero adds no effects, timers, pointer listeners, animation dependencies, camera access or network requests. Its CSS module supplies a one-shot sequence:

| Time          | Behavior                                            |
| ------------- | --------------------------------------------------- |
| 0–200 ms      | Typography settles without hiding content           |
| 250–650 ms    | Low-opacity identity geometry appears               |
| 650–1000 ms   | Plaque and frame resolve                            |
| 1000–1450 ms  | Synthetic QR receives one coral sweep               |
| 1450–1750 ms  | Vehicle motif and illustrative ACTIVE state resolve |
| After 1750 ms | Still product artifact                              |

The Identity Field contains sparse hairlines, custom frame fragments, decorative coordinates and an oversized low-opacity vehicle contour. It uses no raster, gradients, filters or canvas. The architectural plaque shows only the synthetic visible ID, `Demo Vehicle`, `Privacy Controlled` and an explicitly illustrative status. There is no functional QR URL, customer registration, contact number or medical detail in the hero.

Desktop uses a centered headline capped at 80 px and 980 px width. Tablet removes decorative coordinates and reduces the artifact spacing. At 430 px and below, the headline is 40 px; the CTA stacks, and the plaque becomes a two-column identity object with a horizontal status rail. Decorative field details disappear. Links have visible focus; primary and menu targets are 44–48 px. OS reduced motion renders the final vehicle and status immediately.

The server header uses product links, with a small Radix Sheet client component for mobile navigation and a theme toggle. The existing theme preference is respected. `/how-it-works` redirects to the existing three-step explanation. Customer and retail routes use the project's environment-aware domain helpers. The footer uses the dark logo and links to service availability instead of claiming current uptime.

## Generated assets

Run `npm run brand:assets` after geometry changes. The generator uses the repository's existing TypeScript compiler to read the canonical sources, with no additional runtime dependency. The following files are generated and checked for freshness by the brand tests:

- `apps/web/public/brand/vaahansafe-mark.svg`
- `apps/web/public/brand/vaahansafe-mark-mono.svg`
- `apps/web/public/brand/vaahansafe-app-icon.svg`
- `apps/web/public/brand/vaahansafe-app-icon-light.svg`
- `apps/web/public/brand/vaahansafe-favicon.svg`
- `apps/web/app/icon.svg` (Next.js favicon discovery)

SVG path data is never maintained separately in the generator. Exported app icons are SVG artwork; native store upload formats and a PWA manifest are outside this implementation.

## Files

Created: `BrandPaths.tsx`, `brand.constants.ts`, `useReducedMotion.ts`, `VaahanSafeMicroLoader.tsx`, `BrandShowcase.tsx`, `IdentityField.tsx`, `identity-hero.module.css`, `mobile-navigation.tsx`, `/how-it-works/page.tsx`, the SVG asset generator, generated SVGs, hero tests and this report.

Refined: all existing shared brand components, `brand.geometry.tsx`, `brand.types.ts`, `brand-motion.css`, brand exports, UI package exports, exported design tokens, global CSS tokens, emergency button/badge tokens, shared AppShell brand/focus landmark, showcase page, public hero/artifact, marketing brand wrapper/header/footer, homepage fixture, homepage overflow containment, selected section navigation IDs, web QA output configuration, asset npm script, Git ignore and brand/homepage tests.

Dependencies added: none. No Framer Motion, GSAP, Lottie, Three.js, QR generation library or brand icon library was added. Existing Hugeicons remain limited to UI controls.

## QA and limits

Validation results are recorded below after the final checks. The 12 mm specimen in the showcase is a digital print proof; no physical printer or camera-distance scan trial is claimed. Native low-end mobile GPU timing, Lighthouse/Core Web Vitals, and offline font behavior require device/runtime measurement. Existing Google Fonts loading was retained with local fallbacks. Existing lower homepage stations contain technical copy and product claims that require the later explicitly deferred section phases.
