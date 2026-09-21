# VaahanSafe Design System Specification — V1.0

This document defines the formal, pin-to-pin design contract for all user interfaces across the VaahanSafe ecosystem. Every application, shared component, and theme configuration MUST conform to this specification.

```text
<design-context>
---
version: "1.0"
name: "VaahanSafe Premium Safety System"
description: >
  A premium automotive-safety interface system for VaahanSafe built around
  deep safety teal, signal mint, graphite neutrals, restrained cyan/amber
  utility accents, and protected emergency red. The system should feel
  trustworthy, technical, calm, premium, automotive, and safety-first rather
  than looking like a generic SaaS dashboard. shadcn/ui is the component
  foundation and Hugeicons is the exclusive icon family.

# ============================================================
# 01. COLOR SYSTEM
# ============================================================

colors:

  # ----------------------------------------------------------
  # BRAND
  # ----------------------------------------------------------

  brand-950: "#06302E"
  brand-900: "#0D4844"
  brand-800: "#105752"
  brand-700: "#116D67"
  brand-600: "#14887E"
  brand-500: "#20A99B"
  brand-400: "#45C3B3"
  brand-300: "#7DD8CB"
  brand-200: "#AFE8DE"
  brand-100: "#D7F4EF"
  brand-50: "#EFFAF8"

  primary: "#0D4844"
  primary-hover: "#105752"
  primary-active: "#063B3B"
  primary-soft: "#EFFAF8"

  # ----------------------------------------------------------
  # SIGNATURE MINT
  # ----------------------------------------------------------

  mint-950: "#052E27"
  mint-900: "#104E42"
  mint-800: "#115E4E"
  mint-700: "#0F765F"
  mint-600: "#0D9675"
  mint-500: "#16B98F"
  mint-400: "#34D6AE"
  mint-300: "#6EE7C8"
  mint-200: "#A7F3DD"
  mint-100: "#D1FAED"
  mint-50: "#ECFDF8"

  signature: "#22D3A7"
  signature-soft: "#D1FAED"

  # ----------------------------------------------------------
  # SUPPORTING SIGNAL COLORS
  # ----------------------------------------------------------

  signal-cyan: "#38BDF8"
  signal-cyan-soft: "#E0F4FE"

  signal-amber: "#F2B84B"
  signal-amber-soft: "#FFF4D6"

  # ----------------------------------------------------------
  # NEUTRALS
  # Slightly teal-tinted rather than generic gray.
  # ----------------------------------------------------------

  neutral-1000: "#0A0F0E"
  neutral-950: "#171D1B"
  neutral-900: "#2E3835"
  neutral-800: "#35413E"
  neutral-700: "#40504C"
  neutral-600: "#50625D"
  neutral-500: "#667B75"
  neutral-400: "#899E98"
  neutral-300: "#BBCAC6"
  neutral-200: "#DCE5E2"
  neutral-100: "#EFF4F2"
  neutral-50: "#F7FAF9"

  # ----------------------------------------------------------
  # LIGHT SURFACES
  # ----------------------------------------------------------

  canvas: "#F7FAF9"
  surface: "#FFFFFF"
  surface-soft: "#EFF4F2"
  surface-muted: "#E8EFED"
  surface-elevated: "#FFFFFF"

  ink: "#101817"
  body: "#35413E"
  body-strong: "#263330"
  muted: "#667B75"
  muted-soft: "#899E98"

  hairline: "#DCE5E2"
  hairline-strong: "#BBCAC6"

  # ----------------------------------------------------------
  # DARK SURFACES
  # Never use pure black as the primary dark canvas.
  # ----------------------------------------------------------

  dark-canvas: "#071211"
  dark-surface: "#0C1917"
  dark-surface-soft: "#12211E"
  dark-surface-elevated: "#172824"

  dark-border: "#20312D"
  dark-border-strong: "#30463F"

  on-dark: "#EDF7F4"
  on-dark-body: "#C6D8D3"
  on-dark-muted: "#91A7A1"

  # ----------------------------------------------------------
  # SEMANTIC
  # ----------------------------------------------------------

  success: "#16A36A"
  success-soft: "#E8F8F0"

  warning: "#D98B16"
  warning-soft: "#FFF4DE"

  danger: "#DC3F4F"
  danger-soft: "#FDECEF"

  emergency: "#E02D3C"
  emergency-hover: "#C92331"
  emergency-soft: "#FDEBED"

  info: "#2684FF"
  info-soft: "#EAF3FF"

  # ----------------------------------------------------------
  # CONTENT ON BRAND
  # ----------------------------------------------------------

  on-primary: "#FFFFFF"
  on-signature: "#071211"
  on-emergency: "#FFFFFF"


# ============================================================
# 02. COLOR PHILOSOPHY
# ============================================================

color-philosophy:

  public-site:
    neutral: "70%"
    brand: "20%"
    signature: "7%"
    semantic: "3%"

  customer-app:
    neutral: "75%"
    brand: "15%"
    signature: "5%"
    semantic: "5%"

  admin:
    neutral: "85%"
    brand: "10%"
    semantic: "5%"

  emergency-qr:
    neutral: "90%"
    brand: "5%"
    semantic: "5%"

  rules:
    - "Neutral space must dominate the interface."
    - "Do not make VaahanSafe a green website."
    - "Deep teal establishes brand and trust."
    - "Mint is a signal/highlight, not a page background."
    - "Cyan is informational, never the primary brand color."
    - "Amber indicates attention, pending states, or selective editorial emphasis."
    - "Red is protected and never decorative."
    - "Emergency red is reserved for SOS, critical actions, destructive actions, failures, and genuine emergency states."
    - "Never communicate state using color alone."
    - "Combine semantic color with a Hugeicon and explicit text label."


# ============================================================
# 03. TYPOGRAPHY
# ============================================================

typography:

  display-xl:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "72px"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.045em"

  display-lg:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.04em"

  display-md:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.035em"

  display-sm:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"

  title-xl:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"

  title-lg:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"

  title-md:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"

  title-sm:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.005em"

  body-lg:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.005em"

  body-md:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"

  body-sm:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"

  label:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.005em"

  caption:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"

  overline:
    fontFamily: "Geist Mono, JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.12em"

  mono:
    fontFamily: "Geist Mono, JetBrains Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0"

  button:
    fontFamily: "Geist, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.005em"


# ============================================================
# 04. TYPOGRAPHY RULES
# ============================================================

typography-rules:
  - "Use Geist as the preferred product typeface."
  - "Use Geist Mono for QR IDs, order IDs, batch IDs, system references, status metadata, timestamps, and technical identifiers."
  - "Do not use decorative serif fonts in customer, QR emergency, activation, payment, or admin interfaces."
  - "Large marketing headlines may be visually expressive through scale and spacing, not through decorative fonts."
  - "Use weight 600 rather than 800/900 for most major headings."
  - "Avoid uppercase paragraphs."
  - "Uppercase/overline typography is reserved for small technical labels."


# ============================================================
# 05. SPACING
# ============================================================

spacing:
  "0": "0px"
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "20": "80px"
  "24": "96px"
  "32": "128px"

  section-mobile: "72px"
  section-tablet: "96px"
  section-desktop: "120px"
  section-large: "144px"


# ============================================================
# 06. RADIUS
# ============================================================

rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "20px"
  xxxl: "24px"
  pill: "9999px"
  full: "9999px"

radius-rules:
  - "Buttons and inputs generally use 8-10px radius."
  - "Standard cards use 12-16px."
  - "Large media/product surfaces may use 20-24px."
  - "Do not turn every container into a giant rounded pill."
  - "Pill shapes are reserved for compact badges, segmented controls, and intentional status chips."


# ============================================================
# 07. SHADOWS
# ============================================================

shadows:

  xs: "0 1px 2px rgba(7,18,17,0.04)"

  sm: >
    0 1px 2px rgba(7,18,17,0.04),
    0 4px 12px rgba(7,18,17,0.035)

  md: >
    0 2px 4px rgba(7,18,17,0.04),
    0 12px 28px rgba(7,18,17,0.06)

  lg: >
    0 4px 8px rgba(7,18,17,0.04),
    0 20px 48px rgba(7,18,17,0.08)

  focus: "0 0 0 3px rgba(32,169,155,0.18)"

shadow-rules:
  - "Use borders and surface contrast before shadows."
  - "Never use heavy floating-card shadows across the entire product."
  - "Large shadows are reserved for dialogs, sheets, floating command surfaces, and intentional elevated previews."


# ============================================================
# 08. MOTION
# ============================================================

motion:

  instant: "80ms"
  fast: "140ms"
  normal: "200ms"
  slow: "320ms"
  reveal: "480ms"

  easing-standard: "cubic-bezier(0.2, 0, 0, 1)"
  easing-enter: "cubic-bezier(0.16, 1, 0.3, 1)"
  easing-exit: "cubic-bezier(0.4, 0, 1, 1)"

motion-rules:
  - "Motion communicates hierarchy or state; it is not decoration."
  - "Respect prefers-reduced-motion."
  - "Never delay emergency actions for animation."
  - "Do not animate QR emergency information unnecessarily."
  - "Avoid excessive parallax."
  - "Avoid bouncing UI."
  - "Avoid constant glowing animations."
  - "Use restrained fades, slides, progress changes, and state transitions."


# ============================================================
# 09. ICON SYSTEM
# ============================================================

icons:

  library: "Hugeicons"

  packages:
    react: "@hugeicons/react"
    free-icons: "@hugeicons/core-free-icons"

  default-size: "20px"
  small-size: "16px"
  medium-size: "20px"
  large-size: "24px"
  feature-size: "28px"
  hero-size: "32px"

  default-color: "currentColor"

icon-rules:
  - "Hugeicons is the only product icon library."
  - "Do not use Lucide."
  - "Do not use Heroicons."
  - "Do not use Font Awesome."
  - "Do not mix icon styles."
  - "Use a shared @vaahansafe/icons semantic wrapper."
  - "Icons inherit currentColor."
  - "Decorative icons use aria-hidden."
  - "Meaningful icon-only controls require accessible labels."
  - "Do not use emojis as interface icons."


# ============================================================
# 10. SHADCN/UI FOUNDATION
# ============================================================

ui-system:

  foundation: "shadcn/ui"

  rule: >
    shadcn/ui provides accessibility and component behavior.
    VaahanSafe owns visual identity, tokens, compositions,
    spacing, layouts, hierarchy, responsive behavior, and domain-specific patterns.

  components:
    - button
    - input
    - textarea
    - label
    - select
    - checkbox
    - radio-group
    - switch
    - badge
    - card
    - alert
    - avatar
    - dialog
    - drawer
    - sheet
    - dropdown-menu
    - popover
    - tooltip
    - tabs
    - accordion
    - breadcrumb
    - navigation-menu
    - command
    - table
    - pagination
    - skeleton
    - progress
    - scroll-area
    - sonner
    - form

ui-rules:
  - "Do not leave shadcn components with default starter styling."
  - "Do not fork shadcn behavior unnecessarily."
  - "Customize through semantic CSS variables, variants, wrappers, and compositions."
  - "Shared primitives belong in @vaahansafe/ui."
  - "Do not duplicate Button/Input/Dialog implementations between applications."


# ============================================================
# 11. COMPONENT TOKENS
# ============================================================

components:

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"

  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"

  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"

  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"

  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.body-strong}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 14px"

  button-emergency:
    backgroundColor: "{colors.emergency}"
    textColor: "{colors.on-emergency}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    minHeight: "48px"
    padding: "0 24px"

  button-emergency-hover:
    backgroundColor: "{colors.emergency-hover}"
    textColor: "{colors.on-emergency}"

  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 14px"

  text-input-focused:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.brand-500}"
    shadow: "{shadows.focus}"

  textarea:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px 14px"

  standard-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "24px"

  feature-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "32px"

  feature-card-soft:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "32px"

  dark-product-card:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.on-dark}"
    borderColor: "{colors.dark-border}"
    rounded: "{rounded.xxl}"
    padding: "32px"

  metric-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "20px"

  qr-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    padding: "24px"

  emergency-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "20px"

  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"

  status-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"

  status-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"

  status-info:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.info}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"

  top-navigation:
    backgroundColor: "rgba(247,250,249,0.88)"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    height: "68px"

  admin-sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    borderColor: "{colors.hairline}"
    width: "264px"

  app-bottom-navigation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    borderColor: "{colors.hairline}"
    minHeight: "64px"

  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xxl}"
    shadow: "{shadows.lg}"

  toast:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    shadow: "{shadows.md}"

  table:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    borderColor: "{colors.hairline}"

  skeleton:
    backgroundColor: "{colors.surface-muted}"
    rounded: "{rounded.md}"


# ============================================================
# 12. LIGHT THEME
# ============================================================

light-theme:

  background: "{colors.canvas}"
  foreground: "{colors.ink}"

  card: "{colors.surface}"
  card-foreground: "{colors.ink}"

  popover: "{colors.surface}"
  popover-foreground: "{colors.ink}"

  primary: "{colors.primary}"
  primary-foreground: "{colors.on-primary}"

  secondary: "{colors.surface-soft}"
  secondary-foreground: "{colors.body-strong}"

  muted: "{colors.surface-soft}"
  muted-foreground: "{colors.muted}"

  accent: "{colors.signature-soft}"
  accent-foreground: "{colors.brand-800}"

  destructive: "{colors.danger}"
  destructive-foreground: "#FFFFFF"

  border: "{colors.hairline}"
  input: "{colors.hairline}"
  ring: "{colors.brand-500}"


# ============================================================
# 13. DARK THEME
# ============================================================

dark-theme:

  background: "{colors.dark-canvas}"
  foreground: "{colors.on-dark}"

  card: "{colors.dark-surface}"
  card-foreground: "{colors.on-dark}"

  popover: "{colors.dark-surface}"
  popover-foreground: "{colors.on-dark}"

  primary: "{colors.brand-400}"
  primary-foreground: "{colors.dark-canvas}"

  secondary: "{colors.dark-surface-soft}"
  secondary-foreground: "{colors.on-dark-body}"

  muted: "{colors.dark-surface-soft}"
  muted-foreground: "{colors.on-dark-muted}"

  accent: "#12382F"
  accent-foreground: "#8AF0D1"

  destructive: "#F05A68"
  destructive-foreground: "#FFFFFF"

  border: "{colors.dark-border}"
  input: "{colors.dark-border}"
  ring: "{colors.mint-400}"


# ============================================================
# 14. LAYOUT
# ============================================================

layout:

  max-width:
    compact: "768px"
    content: "960px"
    standard: "1200px"
    wide: "1360px"
    dashboard: "1600px"

  page-padding:
    mobile: "20px"
    tablet: "32px"
    desktop: "48px"

  grid:
    columns: 12
    desktop-gap: "24px"
    tablet-gap: "20px"
    mobile-gap: "16px"

layout-rules:
  - "Public marketing pages use generous negative space."
  - "Customer app uses moderate information density."
  - "Admin uses high information density."
  - "QR emergency experience uses the simplest possible hierarchy."
  - "Avoid repetitive 3-card grids for every section."
  - "Alternate editorial layouts, product previews, split layouts, full-width surfaces, and restrained card groups."
  - "Do not wrap every piece of content in a card."


# ============================================================
# 15. PUBLIC WEBSITE
# ============================================================

public-web:

  atmosphere: >
    Premium automotive safety technology with generous neutral space,
    deep teal typography/surfaces, carefully placed mint signal details,
    high-quality vehicle/product photography, and real VaahanSafe product UI previews.

  navigation:
    height: "68px"
    style: "restrained translucent neutral surface with subtle bottom hairline"

  hero:
    layout: "asymmetric editorial/product composition"
    headlineMaxWidth: "760px"
    useProductPreview: true
    useRealUI: true

  product-preview-rule: >
    The public website should demonstrate actual interfaces from the customer
    application, QR emergency experience, activation flow, subscription UI,
    and admin analytics where appropriate rather than using generic illustrations.

  avoid:
    - "generic centered SaaS hero"
    - "purple gradient blobs"
    - "glassmorphism everywhere"
    - "fake dashboard statistics"
    - "random abstract 3D shapes"
    - "excessive floating cards"


# ============================================================
# 16. CUSTOMER APP
# ============================================================

customer-app:

  density: "medium"

  priorities:
    - "My Vehicles"
    - "My QR"
    - "Subscription"
    - "Emergency Contacts"
    - "Orders"
    - "Notifications"

  mobile-first: true

  navigation:
    desktop: "sidebar or structured app navigation"
    mobile: "purposeful bottom navigation / sheet navigation"

  rules:
    - "Primary tasks should be reachable quickly."
    - "Use semantic states consistently."
    - "Do not make every dashboard module a colorful card."
    - "QR identity should remain visually prominent."
    - "Critical account/mobile verification states must be obvious."


# ============================================================
# 17. ACTIVATION EXPERIENCE
# ============================================================

activation:

  philosophy: "guided, minimal, confidence-building"

  flow:
    - "Identify QR"
    - "Verify scratch code"
    - "Authenticate"
    - "Verify mobile"
    - "Complete profile if necessary"
    - "Vehicle"
    - "Emergency details"
    - "Subscription/payment if required"
    - "Review"
    - "Activate"
    - "Confirmation"

  visual-rule: >
    Use a clear progress system with one primary task per screen.
    Avoid dashboard navigation during activation.

  success:
    color: "{colors.success}"
    icon: "Hugeicons success/check icon"
    message: "explicit activation confirmation"


# ============================================================
# 18. QR EMERGENCY EXPERIENCE
# ============================================================

qr-emergency:

  priority: "safety and immediate comprehension"

  design:
    neutralRatio: "90%"
    brandRatio: "5%"
    semanticRatio: "5%"

  rules:
    - "No marketing navigation."
    - "No decorative animation."
    - "No autoplay media."
    - "No unnecessary modal interactions."
    - "No hidden emergency actions."
    - "Large touch targets."
    - "High contrast."
    - "Clear vehicle identification."
    - "Clear emergency contact actions."
    - "Do not expose private account data."
    - "Emergency red only for genuine emergency actions."

  primary-action:
    minHeight: "52px"
    color: "{colors.emergency}"
    textColor: "{colors.on-emergency}"


# ============================================================
# 19. ADMIN
# ============================================================

admin:

  density: "high"

  color-ratio:
    neutral: "85%"
    brand: "10%"
    semantic: "5%"

  rules:
    - "Use brand color sparingly."
    - "Tables and structured data dominate."
    - "Semantic status colors must remain restrained."
    - "Use filters, search, pagination and bulk actions consistently."
    - "Avoid large marketing-style cards."
    - "Never sacrifice information density for decorative whitespace."

  modules:
    - "Dashboard"
    - "QR Inventory"
    - "Batches"
    - "Stickers"
    - "Distributors"
    - "Retailers"
    - "Transfers"
    - "Customers"
    - "Vehicles"
    - "Activations"
    - "Orders"
    - "Subscriptions"
    - "Payments"
    - "Shipping"
    - "Replacements"
    - "Analytics"
    - "Fraud"
    - "Notifications"
    - "Support"
    - "Content"
    - "Audit Logs"
    - "Settings"


# ============================================================
# 20. BLOG
# ============================================================

blog:

  atmosphere: "editorial, spacious, authoritative, safety-oriented"

  canvas: "{colors.canvas}"
  headline: "{colors.brand-950}"
  body: "{colors.body}"
  accent: "{colors.signature}"

  rules:
    - "Prioritize readability over product chrome."
    - "Use large photography where appropriate."
    - "Do not use a generic endless grid of identical cards."
    - "Use featured editorial stories, article rails and category sections."
    - "Maintain consistent article measure."


# ============================================================
# 21. STATUS
# ============================================================

status:

  atmosphere: "technical, calm, transparent"

  states:

    operational:
      color: "{colors.success}"
      label: "Operational"

    degraded:
      color: "{colors.warning}"
      label: "Degraded Performance"

    partial-outage:
      color: "{colors.warning}"
      label: "Partial Outage"

    major-outage:
      color: "{colors.danger}"
      label: "Major Outage"

    maintenance:
      color: "{colors.info}"
      label: "Maintenance"

  rules:
    - "Do not expose unnecessary infrastructure implementation details."
    - "Show user-facing services."
    - "Use explicit labels in addition to colors."
    - "Incident history should use a clear chronological timeline."


# ============================================================
# 22. QR LIFECYCLE COLORS
# ============================================================

qr-status:

  printed:
    semantic: "neutral"

  in-transit-distributor:
    semantic: "info"

  with-distributor:
    semantic: "info"

  with-retailer:
    semantic: "info"

  sold:
    semantic: "warning"

  activated:
    semantic: "success"

  expired-unsold:
    semantic: "muted"

  lost-damaged:
    semantic: "danger"

  replaced:
    semantic: "neutral"

qr-status-rule: >
  Never create nine unrelated saturated colors.
  Use icon + label + a small semantic color treatment.


# ============================================================
# 23. PAYMENT STATES
# ============================================================

payment-status:

  created: "neutral"
  pending: "warning"
  processing: "info"
  paid: "success"
  failed: "danger"
  refunded: "neutral"
  partial-refund: "warning"

payment-rules:
  - "Never use frontend redirect alone to visually declare payment success."
  - "Pending verification must look clearly different from paid."
  - "Payment failure must not resemble emergency/SOS treatment despite sharing danger semantics."


# ============================================================
# 24. CONNECTION STATES
# ============================================================

connection-status:

  checking:
    semantic: "neutral"

  online:
    semantic: "success"

  degraded:
    semantic: "warning"

  offline:
    semantic: "danger"

  reconnected:
    semantic: "success"

connection-rules:
  - "Browser network availability and VaahanSafe API health are separate concepts."
  - "Do not destroy an otherwise usable screen simply because connectivity disappears."
  - "Use a compact banner/toast when appropriate."
  - "Full offline pages are reserved for network-required operations."


# ============================================================
# 25. SYSTEM ERROR STATES
# ============================================================

system-states:

  supported:
    - "400"
    - "401"
    - "403"
    - "404"
    - "408"
    - "409"
    - "429"
    - "500"
    - "502"
    - "503"

  rules:
    - "Every state must provide a recovery action."
    - "Use safe correlation/reference IDs for server errors."
    - "Do not expose stack traces."
    - "403 must not expose sensitive permission architecture."
    - "429 must not reveal fraud/rate-limit internals."
    - "QR lookup failures use QR-specific safety states rather than generic marketing 404 pages."


# ============================================================
# 26. RESPONSIVE BEHAVIOR
# ============================================================

responsive:

  mobile:
    max: "767px"

  tablet:
    min: "768px"
    max: "1023px"

  desktop:
    min: "1024px"
    max: "1439px"

  wide:
    min: "1440px"

responsive-rules:
  - "Design mobile deliberately; do not merely shrink desktop."
  - "Navigation changes structure at small sizes."
  - "Admin sidebar becomes a sheet/drawer or mobile navigation."
  - "Large marketing headlines scale fluidly."
  - "Cards reduce columns rather than becoming unreadably narrow."
  - "Tables use responsive patterns appropriate to their data."
  - "QR emergency controls remain large enough to use one-handed."


# ============================================================
# 27. ACCESSIBILITY
# ============================================================

accessibility:

  standard: "WCAG 2.2 AA minimum"

  normal-text-contrast: "4.5:1 minimum"
  large-text-contrast: "3:1 minimum"
  meaningful-ui-contrast: "3:1 where applicable"

  target-size:
    preferred: "44x44px minimum"

  rules:
    - "Never rely on color alone."
    - "Visible keyboard focus is mandatory."
    - "Use semantic HTML."
    - "Inputs require labels."
    - "Errors require text descriptions."
    - "Decorative Hugeicons must be hidden from assistive technology."
    - "Icon-only buttons require accessible names."
    - "Respect reduced-motion preferences."
    - "Validate light and dark themes separately."


# ============================================================
# 28. DO
# ============================================================

do:
  - "Use neutral surfaces generously."
  - "Use deep safety teal for strong brand anchors."
  - "Use mint as a recognizable VaahanSafe signal."
  - "Use real product previews on the public website."
  - "Use actual QR, activation, app, payment and admin interface previews."
  - "Use Hugeicons consistently."
  - "Use shadcn/ui as the behavior/accessibility foundation."
  - "Use semantic design tokens."
  - "Use Geist Mono for technical identifiers."
  - "Use restrained borders."
  - "Use shadows only where elevation is meaningful."
  - "Support light, dark and system themes."
  - "Prioritize readability."
  - "Keep emergency screens exceptionally simple."
  - "Keep admin screens information-dense."
  - "Use professional vehicle/product imagery where appropriate."
  - "Make every surface clearly part of one VaahanSafe ecosystem."


# ============================================================
# 29. DON'T
# ============================================================

dont:
  - "Do not make the interface look like default shadcn/ui."
  - "Do not use Lucide icons."
  - "Do not mix icon libraries."
  - "Do not use emojis as product icons."
  - "Do not use purple as the primary brand direction."
  - "Do not use blue as the primary VaahanSafe brand."
  - "Do not use pure black for every dark surface."
  - "Do not use pure white for every light surface."
  - "Do not cover entire pages in teal."
  - "Do not overuse mint."
  - "Do not use red decoratively."
  - "Do not use gradients everywhere."
  - "Do not use excessive glassmorphism."
  - "Do not use neon effects."
  - "Do not use giant border radii everywhere."
  - "Do not turn every label into a pill."
  - "Do not put every section into a 3-card grid."
  - "Do not use excessive center alignment."
  - "Do not create fake statistics."
  - "Do not create fake testimonials."
  - "Do not invent fake partner logos."
  - "Do not create generic AI-generated abstract illustrations."
  - "Do not sacrifice emergency usability for visual uniqueness."
  - "Do not sacrifice admin density for marketing aesthetics."


# ============================================================
# 30. SHADCN CSS VARIABLE MAPPING
# ============================================================

shadcn-token-mapping:

  light:
    background: "{colors.canvas}"
    foreground: "{colors.ink}"
    card: "{colors.surface}"
    card-foreground: "{colors.ink}"
    popover: "{colors.surface}"
    popover-foreground: "{colors.ink}"
    primary: "{colors.primary}"
    primary-foreground: "{colors.on-primary}"
    secondary: "{colors.surface-soft}"
    secondary-foreground: "{colors.body-strong}"
    muted: "{colors.surface-soft}"
    muted-foreground: "{colors.muted}"
    accent: "{colors.signature-soft}"
    accent-foreground: "{colors.brand-800}"
    destructive: "{colors.danger}"
    border: "{colors.hairline}"
    input: "{colors.hairline}"
    ring: "{colors.brand-500}"

  dark:
    background: "{colors.dark-canvas}"
    foreground: "{colors.on-dark}"
    card: "{colors.dark-surface}"
    card-foreground: "{colors.on-dark}"
    popover: "{colors.dark-surface}"
    popover-foreground: "{colors.on-dark}"
    primary: "{colors.brand-400}"
    primary-foreground: "{colors.dark-canvas}"
    secondary: "{colors.dark-surface-soft}"
    secondary-foreground: "{colors.on-dark-body}"
    muted: "{colors.dark-surface-soft}"
    muted-foreground: "{colors.on-dark-muted}"
    accent: "#12382F"
    accent-foreground: "#8AF0D1"
    destructive: "#F05A68"
    border: "{colors.dark-border}"
    input: "{colors.dark-border}"
    ring: "{colors.mint-400}"


# ============================================================
# 31. IMPLEMENTATION STRUCTURE
# ============================================================

implementation:

  shared-ui:
    package: "@vaahansafe/ui"

    files:
      - "src/styles/globals.css"
      - "src/styles/tokens.css"
      - "src/theme/theme-provider.tsx"
      - "src/theme/theme-toggle.tsx"
      - "src/components/*"
      - "src/patterns/*"

  icons:
    package: "@vaahansafe/icons"

    files:
      - "src/icon.tsx"
      - "src/registry.ts"
      - "src/navigation.ts"
      - "src/status.ts"
      - "src/vehicle.ts"
      - "src/qr.ts"
      - "src/commerce.ts"
      - "src/admin.ts"

  rules:
    - "No raw hex values inside normal application components."
    - "No direct color duplication between apps."
    - "No app-specific copy of the shared Button component."
    - "No app-specific copy of Hugeicons wrappers."
    - "Use semantic CSS variables."
    - "Use explicit package exports."
    - "All eight VaahanSafe applications consume the same core tokens."


# ============================================================
# 32. DESIGN-SYSTEM PREVIEW
# ============================================================

design-system-preview:

  route: "https://vaahansafe.com/design-system"

  sections:
    - "Brand Colors"
    - "Neutral Scale"
    - "Semantic Colors"
    - "Light Theme"
    - "Dark Theme"
    - "Typography"
    - "Spacing"
    - "Radius"
    - "Shadows"
    - "Hugeicons"
    - "Buttons"
    - "Inputs"
    - "Selects"
    - "Checkboxes"
    - "Radios"
    - "Switches"
    - "Badges"
    - "Cards"
    - "Alerts"
    - "Dialogs"
    - "Sheets"
    - "Tabs"
    - "Tables"
    - "Pagination"
    - "Skeletons"
    - "Toasts"
    - "QR States"
    - "Payment States"
    - "Connection States"
    - "System Errors"
    - "Emergency Components"

  requirement: >
    The preview must render actual production components from @vaahansafe/ui.
    Do not create fake duplicate examples solely for documentation.


# ============================================================
# 33. DESIGN IDENTITY
# ============================================================

identity:

  keywords:
    - "automotive"
    - "safety"
    - "trust"
    - "technical"
    - "premium"
    - "calm"
    - "precise"
    - "protective"
    - "modern"
    - "human"

  visual-expression: >
    VaahanSafe should feel like a premium safety technology product designed
    for real vehicles and real emergency situations. It should combine the
    refinement of a premium automotive digital cockpit with the clarity of
    critical safety infrastructure.

  differentiation: >
    Do not create uniqueness by adding decoration. Create uniqueness through
    disciplined color usage, typography, product previews, spacing,
    information hierarchy, QR identity, meaningful status systems,
    photography, and consistent interaction behavior.
</design-context>
```
