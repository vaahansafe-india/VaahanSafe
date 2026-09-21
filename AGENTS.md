# VAAHANSAFE GLOBAL INFRASTRUCTURE & ARCHITECTURE RULES

============================================================
CRITICAL — CLOUDFLARE ONLY / REAL SERVICES ONLY
============================================================

VaahanSafe is a production-grade QR-based Vehicle Safety Identity Platform for India.

DO NOT build any feature (Authentication, Customer App, Retail Activation, QR Resolver, Admin Portal, Plans & Subscriptions, Orders, Shipping, or Scan Activity) using dummy data, mock users, temporary local databases, browser storage, or fake APIs.

CONNECT ALL SCREENS AND WORKFLOWS TO THE EXISTING REAL VAAHANSAFE CLOUDFLARE INFRASTRUCTURE AND PRODUCTION SERVICES.

CLOUDFLARE IS THE PRODUCTION PLATFORM AND SINGLE SOURCE OF TRUTH.

Before writing code for any subsystem:

1. Audit the existing Cloudflare configuration (`infrastructure/cloudflare`, `wrangler.toml`).
2. Inspect existing Wrangler configuration and environment bindings (D1, R2, Queues, KV).
3. Inspect existing D1 databases and migrations (`infrastructure/cloudflare/d1/migrations`, `database/migrations`).
4. Inspect existing Worker/API routes and typed contracts (`apps/api`, `@vaahansafe/types`).
5. Inspect existing environment bindings, secrets, and `.dev.vars` / `.env`.
6. Inspect the shared domain packages (`@vaahansafe/auth`, `@vaahansafe/database`, `@vaahansafe/notifications`, `@vaahansafe/commerce`, `@vaahansafe/shipping`).
7. Inspect existing MSG91 integration (SMS OTP and WhatsApp emergency alerts).
8. Inspect existing Google OAuth integration.
9. Inspect existing Cloudflare Turnstile integration for bot/abuse protection.
10. Reuse existing production architecture instead of creating alternatives.

============================================================
ABSOLUTELY PROHIBITED ACROSS THE ENTIRE REPOSITORY
============================================================

DO NOT USE:

❌ localStorage for sessions, identities, vehicles, contacts, or orders
❌ sessionStorage for authentication or business state truth
❌ IndexedDB
❌ SQLite
❌ better-sqlite3
❌ local SQLite database files (*.db, *.sqlite)
❌ mock databases
❌ JSON file databases
❌ in-memory production databases
❌ hard-coded users or mock accounts
❌ fake OTP or hard-coded OTP (123456, 000000, 111111)
❌ mock authentication or simulated login
❌ fake Google OAuth bypasses
❌ mock API responses
❌ fake vehicle registrations or fake safety profiles
❌ fallback dummy data when Cloudflare services are unavailable

DO NOT silently fall back to local storage or dummy data when a Cloudflare service or external API is unavailable.

A Cloudflare/service failure must produce a proper, recoverable, and user-friendly application error.

============================================================
GLOBAL MONOREPO ARCHITECTURAL PIPELINE
============================================================

Every surface in the VaahanSafe monorepo must follow this exact flow:

UI (Web / Customer / Activate / Admin)
        ↓
SERVER / API (Next.js Edge / Cloudflare Workers)
        ↓
DOMAIN / APPLICATION SERVICE
        ↓
CLOUDFLARE INFRASTRUCTURE & CONFIGURED SERVICES
        ├── Cloudflare D1 (Relational Data & Source of Truth)
        ├── Cloudflare R2 (Asset & Image Object Storage)
        ├── Cloudflare Turnstile (Server-Verified Abuse Protection)
        ├── Cloudflare Queues (Asynchronous Notification & Event Pipeline)
        └── Configured Production Providers
                ├── MSG91 (Transactional SMS OTP & WhatsApp Alerts)
                ├── Google OAuth 2.0 (Verified OpenID Identity)
                └── SMTP (Production Email Delivery)
        ↓
REAL PRODUCTION DATA

============================================================
D1 — SINGLE RELATIONAL SOURCE OF TRUTH
============================================================

Use Cloudflare D1 for persistent relational records according to the existing database schema:
- `users` (Accounts, roles, statuses)
- `auth_identities` (Phone, Google OAuth subs)
- `vehicles` (Plates, models, types, ownership status)
- `qr_stickers` (Public codes, secret activation proof keys, batch tracking)
- `emergency_contacts` (Priority contacts, relationship, verification)
- `orders` & `shipments` (Courier tracking, fulfillment status)
- `scan_events` (Security logs, passerby alerts, emergency scans)

If a required schema change is needed:
CREATE A PROPER D1 MIGRATION under `infrastructure/cloudflare/d1/migrations/` or `database/migrations/`.
Never solve it by introducing SQLite or local files.

============================================================
AUTHENTICATION & SESSION SECURITY
============================================================

1. **Server Session Truth**:
   - Sessions are managed server-side via RFC 6265 compliant `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` (in production) cookies (`vs_session`, `vs_admin_session`).
   - Never store bearer tokens or credentials in `localStorage` or `sessionStorage`.

2. **Mandatory Verified Mobile Rule**:
   - EVERY account requires a verified mobile number.
   - Google authentication establishes identity, but if the account lacks a verified phone, the user MUST be routed to `PHONE_REQUIRED` to verify via real MSG91 SMS OTP before gaining access to the customer app.

3. **Real MSG91 OTP**:
   - OTP codes are generated and verified server-side through MSG91.
   - Never generate OTPs in client React components.
   - Never print OTPs in client-side or server logs.

4. **Real Google OAuth**:
   - Connects to Google's official authorization endpoint.
   - Code is exchanged server-side with `https://oauth2.googleapis.com/token`.
   - Client secrets must remain server-side and never be exposed in `NEXT_PUBLIC_*` or client bundles.

5. **Cloudflare Turnstile**:
   - Turnstile tokens are verified server-side via Cloudflare's siteverify API.
   - Never trust client claims of successful verification.

============================================================
SERVICE AVAILABILITY & ERROR HANDLING
============================================================

When D1, MSG91, Google OAuth, or any other infrastructure service encounters an error:
- Display calm, professional error copy: *"We couldn't complete sign-in right now. Please try again."*
- Log operational context server-side.
- NEVER expose internal database errors, D1 stack traces, worker error messages, or provider errors to the end-user.
- NEVER return fake success or dummy accounts.

============================================================
SUMMARY INVARIANT
============================================================

VAAHANSAFE MUST USE:
REAL UI → REAL SERVER → REAL CLOUDFLARE → REAL D1 DATA.

Local browser persistence should NEVER become a substitute database.

============================================================
VAAHANSAFE — SECURE QR + PAYMENT + ACTIVATION ARCHITECTURE
NON-NEGOTIABLE PRODUCTION RULES
============================================================

You are now responsible for implementing the SECURITY AND ENTITLEMENT architecture behind:
- Buy QR
- Activate Retail QR
- QR Codes
- Digital QR
- Replace QR
- QR Resolver
- Payments
- Orders
- Subscriptions / enabled services

Do not treat these as independent frontend pages. They form one secure state machine.

============================================================
00 — THE FOUR SEPARATE DOMAIN CONCEPTS (CRITICAL ARCHITECTURAL LOCK)
============================================================

Do NOT model the system as simply `qr.status = ACTIVE`.
You MUST use four separate, decoupled concepts across all database models, APIs, and business logic:

1. **Payment State** → Whether money was authoritatively confirmed.
   - Values: `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`, `EXPIRED`, `REFUNDED`
   - Authority: Server-side Cashfree signed webhook verification only.
   - Invariant: A paid order is financial truth; it does NOT mean physical delivery or subscription tier features.

2. **QR Lifecycle State** → What is happening to the physical/digital QR sticker.
   - Values: `INVENTORY`, `ALLOCATED`, `PRINTED`, `DISTRIBUTED`, `ASSIGNED`, `ACTIVATED`, `REPLACED`, `DAMAGED`, `LOST`, `BLOCKED`, `RETIRED`
   - Authority: Inventory management, retail packaging, and physical binding lifecycle.
   - Invariant: A physical retail sticker exists in inventory before any user owns it.

3. **Entitlement State** → Whether this account/vehicle has the verified right to use a specific service capability.
   - Capabilities: `DIGITAL_QR_ACCESS`, `SAFETY_VIEW_ACTIVE`, `EMERGENCY_ROUTING`, `SCAN_HISTORY_LOGGING`, `REPLACEMENT_ELIGIBLE`
   - Authority: Centralized server-side entitlement service (`canUseQrService`, `canViewDigitalQr`, `canExposeSafetyView`).
   - Invariant: Entitlement requires satisfying BOTH the acquisition gate (verified payment OR verified retail activation) AND vehicle ownership.

4. **Subscription State** → Whether optional plan-backed tier functionality is active.
   - Values: `TIER_FREE`, `TIER_STANDARD`, `TIER_PREMIUM`, `EXPIRED`, `GRACE_PERIOD`
   - Authority: Subscription renewal and billing lifecycle.
   - Invariant: Payment success for a sticker purchase must NOT accidentally unlock unrelated premium subscription tiers.

============================================================
01 — FUNDAMENTAL SECURITY RULE
============================================================

A QR must NEVER become usable merely because:
- a user opened the Buy QR page
- an order was created
- Cashfree checkout opened
- the browser returned from Cashfree
- the frontend says payment succeeded
- the user knows a QR identifier
- a retail QR was scanned
- an activation code was entered client-side
- React state says "activated"

SERVICE ENABLEMENT MUST BE SERVER AUTHORITATIVE.

There are exactly two legitimate primary acquisition gates:

ONLINE QR:
ORDER CREATED
       ↓
PAYMENT ATTEMPT
       ↓
SERVER-SIDE PAYMENT VERIFICATION
       ↓
PAYMENT CONFIRMED
       ↓
FULFILLMENT / QR ASSIGNMENT
       ↓
QR ENTITLEMENT CREATED
       ↓
SERVICE ENABLED

RETAIL QR:
PHYSICAL QR EXISTS
       ↓
PUBLIC ID RESOLVED
       ↓
ACTIVATION PROOF SUBMITTED
       ↓
SERVER-SIDE PROOF VERIFICATION
       ↓
AUTHENTICATED OWNER VERIFIED
       ↓
VEHICLE VERIFIED
       ↓
QR CLAIMED / BOUND
       ↓
ENTITLEMENT CREATED
       ↓
SERVICE ENABLED

NO VERIFIED GATE ↓ NO ACTIVE SERVICE.

============================================================
02 — ONLINE QR PURCHASE STATE MACHINE
============================================================

Create an explicit server-side state machine. Conceptually:
ORDER CREATED ↓ PAYMENT_PENDING ↓ PAID ↓ PROCESSING ↓ QR_ASSIGNED ↓ SHIPPED ↓ DELIVERED

Payment failure path:
PAYMENT_PENDING ↓ PAYMENT_FAILED or appropriate existing domain states.

Do NOT blindly add these exact enum values. FIRST inspect the existing:
- orders
- payments
- fulfillment
- QR
- subscription domain models.
Reuse existing states where they already exist.

============================================================
03 — PAYMENT IS A HARD GATE
============================================================

Before verified payment:
DO NOT:
❌ assign an active production QR
❌ enable QR service
❌ expose Digital QR
❌ expose active resolver functionality
❌ enable public Safety View
❌ create active subscription entitlement
❌ enable scan history
❌ mark order as paid
❌ show an ACTIVE badge
❌ create fake success
❌ allow frontend to override payment status

The frontend may show:
PAYMENT PENDING
but NEVER:
ACTIVE
until authoritative backend conditions are satisfied.

============================================================
04 — NEVER TRUST PAYMENT REDIRECT
============================================================

THIS IS CRITICAL.
Do NOT implement:
Cashfree redirect ↓ ?status=success ↓ mark order PAID (WRONG!)

Do NOT trust:
- query parameters
- frontend callbacks
- client JavaScript
- browser return URL
- user-controlled request body as payment proof.

The browser is NOT authoritative.

============================================================
05 — CASHFREE AUTHORITATIVE FLOW
============================================================

Use the existing configured Cashfree integration. Concept:
CUSTOMER
       ↓
BUY QR
       ↓
SERVER CREATES VAAHANSAFE ORDER
       ↓
SERVER CREATES CASHFREE PAYMENT ORDER
       ↓
CHECKOUT
       ↓
CASHFREE
       ↓
SIGNED WEBHOOK
       ↓
VAAHANSAFE SERVER
       ↓
VERIFY WEBHOOK SIGNATURE
       ↓
VALIDATE PAYMENT / ORDER
       ↓
IDEMPOTENCY CHECK
       ↓
D1 PAYMENT UPDATE
       ↓
ORDER → PAID
       ↓
FULFILLMENT / QR ASSIGNMENT
       ↓
ENTITLEMENT
       ↓
SERVICE

Use Cashfree's CURRENT official verification mechanism. Do not implement cryptography from memory if the official SDK/helper exists.

============================================================
06 — WEBHOOK SECURITY
============================================================

Cashfree webhook handler must:
1. Receive request.
2. Preserve/read RAW request body as required by Cashfree verification.
3. Read required signature/timestamp headers (`x-webhook-signature`, `x-webhook-timestamp`).
4. Verify webhook authenticity using configured webhook secret.
5. Reject invalid signatures with HTTP 400/401.
6. Validate expected event type (e.g., `PAYMENT_SUCCESS_WEBHOOK`).
7. Resolve internal payment/order records.
8. Compare relevant authoritative fields (order ID, currency, amount).
9. Prevent duplicate processing via database-backed idempotency.
10. Persist payment event in audit log.
11. Update payment/order state idempotently.
12. Trigger fulfillment/service logic only when legitimate.
13. Return appropriate 200 OK response.

Never log:
- Cashfree secret key
- full sensitive payment payload unnecessarily
- session secrets
- activation credentials.

============================================================
07 — IDEMPOTENCY
============================================================

Payment webhooks can arrive repeatedly. Therefore:
SAME VALID PAYMENT EVENT ↓ MUST NOT:
- CREATE MULTIPLE QRs
- CREATE MULTIPLE ORDERS
- CREATE MULTIPLE ENTITLEMENTS
- SHIP TWICE
- ACTIVATE TWICE

Create idempotency protection. Use an appropriate unique provider event/payment reference.
Conceptually:
- `payment_events` table: `provider`, `provider_event_id` (UNIQUE), `payment_id`, `event_type`, `processed_at`
Inspect existing schema before creating tables. Use D1 UNIQUE constraints/indexes.

============================================================
08 — NEVER TRUST CLIENT AMOUNT
============================================================

WRONG:
POST /checkout { amount: 1, product: "premium" } → server trusts amount.

CORRECT:
CLIENT: product/offer identifier
SERVER:
       ↓ load authoritative product
       ↓ load authoritative price
       ↓ validate eligibility
       ↓ calculate total
       ↓ create order
       ↓ send authoritative amount to Cashfree

The browser never decides the payable amount.

============================================================
09 — PAYMENT SUCCESS PAGE
============================================================

After returning from payment:
Do NOT immediately show:
PAYMENT SUCCESS / QR ACTIVE

Instead:
VERIFYING PAYMENT
The application asks the server for authoritative order/payment state.

Possible UI states:
VERIFYING PAYMENT ↓ PAYMENT CONFIRMED ↓ ORDER CONFIRMED
or:
PAYMENT PROCESSING: “We're confirming your payment.”

If webhook has not yet arrived, poll the server carefully or provide refresh/status handling.
Never turn the service on based only on browser redirect.

============================================================
10 — QR ASSIGNMENT RULE
============================================================

Online QR assignment must happen ONLY after the required payment gate. Concept:
PAYMENT VERIFIED ↓ ORDER PAID ↓ RESERVE / ASSIGN QR INVENTORY ↓ LINK ORDER ↓ FULFILLMENT

Do not allow two orders to claim the same physical QR. Enforce uniqueness in D1.

============================================================
11 — RETAIL QR MODEL
============================================================

Retail QR is different. The QR can physically exist before ownership. Conceptually:
QR INVENTORY ↓ PRINTED ↓ DISTRIBUTED ↓ SOLD ↓ OWNER ACTIVATION ↓ ACTIVE

Use the actual existing VaahanSafe lifecycle. Do not blindly replace existing states.

============================================================
12 — RETAIL ACTIVATION GATE
============================================================

Scanning a retail QR does NOT activate it.
- Public QR: identifies/resolves the physical VaahanSafe QR.
- Activation proof: proves legitimate activation possession (scratch code/PIN).
They must remain separate:
PUBLIC QR ≠ ACTIVATION SECRET
PUBLIC ID ≠ ACTIVATION PROOF

============================================================
13 — RETAIL ACTIVATION FLOW
============================================================

Required flow:
SCAN QR
       ↓
RESOLVE OPAQUE PUBLIC ID
       ↓
CHECK QR ELIGIBILITY
       ↓
USER AUTHENTICATION
       ↓
VERIFIED MOBILE
       ↓
ENTER / REVEAL ACTIVATION PROOF
       ↓
TURNSTILE / RATE LIMIT WHERE APPROPRIATE
       ↓
SERVER VERIFIES ACTIVATION PROOF
       ↓
SELECT / ADD VEHICLE
       ↓
SERVER AUTHORIZES VEHICLE
       ↓
CONFIRM CONNECTION
       ↓
ATOMIC CLAIM / BIND
       ↓
CREATE ENTITLEMENT
       ↓
QR ACTIVE
       ↓
SERVICES ENABLED

Before the atomic claim succeeds: NO SERVICE.

============================================================
14 — ACTIVATION SECRET STORAGE
============================================================

Never store a retail activation secret in plaintext if the existing architecture supports secure one-way verification.
Use a server-side secure verification design appropriate to the activation secret entropy/model.
The database-facing record must contain:
`activation_secret_hash`
NOT:
`activation_secret_plaintext`

Never return activation-secret hashes to the browser either.
Never include them in:
- URL
- QR resolver URL
- HTML
- React props
- client logs
- analytics
- toast error messages.

============================================================
15 — ACTIVATION ATTEMPT SECURITY
============================================================

Protect activation against guessing.
Implement:
- rate limiting
- Cloudflare Turnstile where appropriate
- attempt count controls
- server-side verification
- audit/security event recording where implemented.

Do not reveal: “Valid QR but wrong secret” in a way that unnecessarily helps enumeration. Use controlled, safe error messages.

============================================================
16 — NO PREDICTABLE QR SLUG
============================================================

DO NOT USE:
❌ /qr/1
❌ /qr/2
❌ /qr/12345
❌ database primary key
❌ vehicle database ID
❌ order ID
❌ registration number
❌ mobile number
❌ sequential slug
❌ guessable short slug as the public resolver identity.

============================================================
17 — OPAQUE PUBLIC QR IDENTIFIER
============================================================

Use an opaque, non-sequential, sufficiently high-entropy public identifier.
Concept: `https://qr.vaahansafe.com/{publicId}`

The publicId must:
- be generated server-side
- not reveal database structure
- not reveal account ID
- not reveal vehicle ID
- not reveal order ID
- not reveal activation secret
- not be sequential
- be unique
- be indexed in D1 with a UNIQUE index
- be immutable for the lifetime of that QR where product rules require it.

Do not call it "slug" in the customer UI.
Customer-facing language: "VaahanSafe ID" or "QR Identity"
Internal code may use: `publicId`

============================================================
18 — PUBLIC ID GENERATION
============================================================

Use cryptographically secure randomness available in the Cloudflare runtime (`crypto.getRandomValues()` or high-entropy nano-id).
Do NOT use: `Math.random()`
Do NOT derive `publicId` from:
- user ID
- timestamp alone
- vehicle registration
- phone number
- order number.

Use sufficient entropy to make enumeration mathematically impossible.
Create a UNIQUE D1 constraint/index. Handle the extremely unlikely collision safely with retry logic.

============================================================
19 — THREE IDENTIFIERS MUST REMAIN SEPARATE
============================================================

Never collapse these into one value:
1. **INTERNAL DATABASE ID**: Primary key used internally (`qr_xxxx`).
2. **PUBLIC QR ID**: Safe opaque resolver identifier (`vs_xxxx` or high-entropy string).
3. **ACTIVATION SECRET / PROOF**: Private claim credential (PIN/scratch key).

Concept:
INTERNAL ID ≠ PUBLIC ID ≠ ACTIVATION SECRET
This is a fundamental VaahanSafe security boundary.

============================================================
20 — QR CONTENT
============================================================

The physical QR should encode ONLY the minimum public resolver URL required:
Concept: `https://qr.vaahansafe.com/{opaquePublicId}`

Do NOT encode:
❌ owner name
❌ phone
❌ email address
❌ blood group
❌ medical notes
❌ vehicle database ID
❌ activation secret
❌ payment ID
❌ order ID
❌ subscription ID
directly into the physical QR.
The server resolves the current public projection dynamically.

============================================================
21 — QR LIBRARY
============================================================

Use a well-maintained QR generation library compatible with the existing Next.js/Cloudflare runtime.
Before installing anything:
- Inspect `package.json` and lockfile.
- If an approved QR library already exists (e.g. `qrcode` or `qr-code-styling`): REUSE IT.
- Do not install multiple redundant QR libraries.

Requirements:
- Standards-compliant QR encoding.
- SVG output for crisp high-quality rendering across resolutions.
- Configurable error correction (Level M or Q recommended for physical stickers).
- Deterministic rendering from resolver URL.
- Zero external QR-generation SaaS (no sending VaahanSafe URLs or customer data to third-party QR APIs).
Prefer generating QR codes entirely inside VaahanSafe infrastructure.

============================================================
22 — QR LIBRARY SECURITY
============================================================

The QR library does NOT decide authorization. It only renders encoded content.
WRONG: QR library ↓ service entitlement
CORRECT: SERVER AUTHORIZATION ↓ ENTITLEMENT CHECK ↓ RESOLVER URL ↓ QR ENCODER ↓ IMAGE/SVG

The QR image itself is never proof of entitlement.

============================================================
23 — DIGITAL QR GATING
============================================================

Digital QR must NOT be available simply because the user owns a vehicle.
Server must check:
authenticated user
       ↓
vehicle ownership
       ↓
QR association
       ↓
QR state
       ↓
required entitlement/service state
       ↓
ALLOW DIGITAL QR

If not enabled: return a truthful locked state.
Example UI:
DIGITAL QR: "Not available yet. Complete QR purchase or retail activation to enable this service."
Then contextually offer: [Buy QR] or [Activate Retail QR]

============================================================
24 — QR CODES PAGE GATING
============================================================

Before successful purchase/activation:
Do NOT show an active QR.
The QR Codes page may show:
- Pending order
- Activation required
- Setup required
but it must NOT provide an active production QR resolver identity as if the service were enabled.

After successful gate:
QR Codes ↓ real associated QR ↓ real status ↓ allowed actions

============================================================
25 — SERVICE ENTITLEMENT LAYER
============================================================

Do not scatter logic such as:
`if (payment.status === "paid")`
through React components.

Create a centralized server-side entitlement domain service:
- `canUseQrService(account, vehicle, qr)`
- `canViewDigitalQr(account, vehicle, qr)`
- `canExposeSafetyView(qr)`
- `canRecordScan(qr)`
- `canRequestReplacement(account, vehicle, qr)`
- `canUseSubscriptionFeature(account, featureKey)`

The frontend consumes the result. The frontend does not decide entitlement.

============================================================
26 — ENTITLEMENT STATE
============================================================

Conceptually separate:
PAYMENT STATE ≠ QR STATE ≠ SUBSCRIPTION STATE ≠ SERVICE ENTITLEMENT

These are related but NOT identical.
Example:
- Payment = `PAID` does not necessarily mean: Physical QR = `DELIVERED`
- QR = `ACTIVE` does not necessarily mean: Every premium subscription feature = `ENABLED`
Build explicit domain relationships between each state.

============================================================
27 — ONLINE SERVICE ENABLEMENT
============================================================

For online QR purchase:
PAYMENT VERIFIED ↓ ORDER PAID ↓ QR ASSIGNMENT / REQUIRED FULFILLMENT CONDITION ↓ ENTITLEMENT CREATED ↓ QR SERVICE ENABLED

Determine the exact enablement point from the product rules.
Do NOT assume payment alone means a physical sticker has been delivered.
If Digital QR becomes available immediately after verified payment, implement that explicitly as an authorized product entitlement.
If physical safety view requires sticker delivery/acknowledgement, enforce that state. Do not guess.

============================================================
28 — RETAIL SERVICE ENABLEMENT
============================================================

For retail:
QR ALREADY EXISTS ↓ VALID ACTIVATION ↓ VEHICLE BINDING ↓ ENTITLEMENT ↓ SERVICE ENABLED

No payment through online checkout is required if the retail purchase model already represents the paid physical acquisition.
However, retail activation proof MUST authoritatively succeed.

============================================================
29 — PUBLIC QR RESOLVER
============================================================

`qr.vaahansafe.com/{publicId}` must perform a server-side lookup:
PUBLIC ID
       ↓
D1 / HOT RESOLUTION LAYER
       ↓
QR STATE:
- `ACTIVE` → public safety projection
- `NOT_ACTIVATED` / `RETAIL` → activation entry point
- `REPLACED` → safe replacement notification handling
- `LOST` / `DAMAGED` → controlled unavailable / support state
- `BLOCKED` → generic unavailable state
- `UNKNOWN` → QR not recognized

Use actual existing domain states.

============================================================
30 — NEVER EXPOSE SERVICE BEFORE ENTITLEMENT
============================================================

Protect at BOTH: UI level AND server/API level.
Hiding a button is NOT security.
Even if a user manually calls:
- `/api/qr/digital`
- `/api/qr/...`
- `/api/safety-view/...`
the server must independently enforce entitlement.

============================================================
31 — SERVER AUTHORIZATION PIPELINE
============================================================

Every protected QR request must follow:
REQUEST
       ↓
AUTHENTICATE SESSION
       ↓
RESOLVE ACCOUNT
       ↓
AUTHORIZE VEHICLE / QR OWNERSHIP
       ↓
CHECK QR STATE
       ↓
CHECK ENTITLEMENT
       ↓
VALIDATE ACTION
       ↓
PERFORM DOMAIN OPERATION
       ↓
RETURN MINIMUM SAFE DATA

Never trust browser-supplied:
- `userId`
- `accountId`
- `paymentStatus`
- `isPaid`
- `isActive`
- `entitlement`
- `qrState`

============================================================
32 — D1 DATABASE INTEGRITY
============================================================

Use D1 constraints deliberately:
- FOREIGN KEYS: Ensure relational links exist.
- UNIQUE constraints:
  - `qr_stickers.public_id` (Opaque resolver ID)
  - `orders.order_number`
  - `payments.provider_payment_id`
  - `payment_events.provider_event_id`
  - One active QR binding per vehicle (`vehicles.active_qr_id` or unique partial index)
- NOT NULL constraints on critical foreign keys and statuses.
- CHECK constraints on enumerated lifecycle and status strings.
- Explicit indexes on foreign keys and frequently queried columns (`public_id`, `vehicle_id`, `user_id`, `order_id`).

Always use versioned D1 migrations under `database/migrations/` or `infrastructure/cloudflare/d1/migrations/`.
Never execute ad-hoc schema modifications in production.
Always use parameterized queries (`db.prepare("...").bind(...)`) to prevent SQL injection and ensure type safety.

============================================================
33 — CASCADE RULES
============================================================

DO NOT blindly use `ON DELETE CASCADE` everywhere.
Payments, orders, QR lifecycle history, and security/audit history must survive account/vehicle state changes according to product/legal requirements.

Choose explicitly:
- `RESTRICT` / `NO ACTION`:
  - `user → orders` (Orders must NOT be silently deleted if a user is deleted)
  - `user → payments` (Financial records are permanent)
  - `order → payments` (Payment records must be preserved)
  - `vehicle → qr_stickers` (Sticker history must not vanish if vehicle is deleted)
  - `qr → scan_events` (Security logs must be preserved)
  - `qr → activation_attempts` (Audit trail must remain)
- `SET NULL`:
  - `vehicles.active_qr_id` if a QR is unbound or replaced.
- `CASCADE`:
  - Ephemeral user sessions or temporary tokens only.

Document the rationale for every foreign-key action in the schema migration.

============================================================
34 — CONCURRENCY / DOUBLE CLAIM
============================================================

Protect retail QR against two users trying to activate the same QR simultaneously.
The authoritative claim must be atomic:
- Use D1 transactional execution or conditional UPDATE:
  `UPDATE qr_stickers SET status = 'ACTIVATED', bound_vehicle_id = ?, claimed_by_user_id = ?, claimed_at = ? WHERE id = ? AND status = 'DISTRIBUTED';`
- If row count is 0, the claim was already completed or invalid.
Likewise, protect online QR inventory assignment against double assignment.
Do not rely only on in-memory `if (qr.status !== "active")` before an unsafe write.

============================================================
35 — REPLACEMENT SECURITY
============================================================

Replacement creates a sensitive lifecycle transition:
CURRENT QR
       ↓
AUTHORIZED REPLACEMENT REQUEST
       ↓
APPROVED / ELIGIBLE
       ↓
NEW QR RESERVED
       ↓
NEW PUBLIC ID
       ↓
BINDING TRANSITION
       ↓
OLD QR SAFE STATE (`REPLACED`)
       ↓
NEW QR ACTIVE WHEN PRODUCT RULES ALLOW

- Never reuse an activation secret.
- Never expose the new QR before required gates.
- Never allow old and replacement QR behavior to become ambiguous.

============================================================
36 — UI LOCKED STATES
============================================================

Design professional, contextual locked states:

**DIGITAL QR LOCKED:**
"Your Digital QR becomes available after your purchase is confirmed."
[Check order status]

**RETAIL QR ACTIVATION REQUIRED:**
"Verify your retail QR and connect it to a vehicle to enable its services."
[Activate Retail QR]

**PAYMENT CONFIRMING:**
"We're confirming your payment securely with Cashfree."
[Refresh status]

Do not use disabled-looking dead ends without actionable explanations.

============================================================
37 — QR OVERVIEW BEFORE ACTIVATION
============================================================

My QR Overview must dynamically adapt based on server-verified entitlement:

BEFORE QR:
VEHICLE ● | IDENTITY ○ | QR ○ | SAFETY VIEW ○
Primary Actions: [Buy QR] [Activate Retail QR]

PAYMENT PENDING:
VEHICLE ● | ORDER ● | PAYMENT ◌ (Confirming...) | QR LOCKED

AFTER ONLINE GATE:
VEHICLE ● | IDENTITY ● | QR ● | SERVICE ●

AFTER RETAIL ACTIVATION:
VEHICLE ● | IDENTITY ● | RETAIL QR ● | SERVICE ●

All states must be computed server-side and reflected in UI.

============================================================
38 — PAYMENT PAGE SECURITY UI
============================================================

Never display "Payment Successful" until the server confirms it via verified webhook or authoritative status check.
Allowed UI states:
- `AWAITING_PAYMENT`
- `PROCESSING`
- `CONFIRMED`
- `FAILED`
- `EXPIRED`

Use standard design system components: Alert, Badge, Button, Dialog, Sheet, Skeleton, Sonner.
Do not allow frontend state manipulation or URL manipulation to force confirmed status.

============================================================
39 — QR DOWNLOAD SECURITY
============================================================

If Digital QR download/export is supported:
- Authorize every request on the server.
- Do NOT expose an unrestricted public R2 object URL containing private/customer QR assets.
- If the QR can safely be generated on demand from the public resolver URL:
  Prefer generating the SVG/PNG dynamically in memory on the server from `https://qr.vaahansafe.com/{opaquePublicId}`.
- Never write customer PII into the generated image file name or metadata.

============================================================
40 — R2 OBJECT STORAGE
============================================================

Use R2 only where object storage is actually required:
- Generated high-resolution print assets (vector SVGs for manufacturing)
- Authorized export files
- Product marketing media
D1 stores metadata and references. Do not store raw binary QR blobs directly in D1.

============================================================
41 — CLOUDFLARE QUEUES
============================================================

Use Cloudflare Queues for asynchronous non-blocking background tasks:
- Notification dispatch (SMS, WhatsApp, Email)
- Fulfillment logistics jobs (courier dispatch webhooks)
- Post-payment communications
- Analytics event processing

CRITICAL INVARIANT:
DO NOT put the core payment authorization decision exclusively into a queue such that the browser can activate service first.
Payment and entitlement authority must remain synchronous and consistent.

============================================================
42 — NOTIFICATIONS
============================================================

Only send:
- Payment confirmed
- QR activated
- Replacement submitted
- Order shipped
after the authoritative corresponding event is recorded in D1.
Never send: "Your QR is active" based on client-side React state.

============================================================
43 — AUDIT EVENTS
============================================================

Record security-relevant events in D1 audit logs:
- payment confirmation
- QR assignment
- retail activation
- vehicle binding
- QR replacement
- entitlement change

Never record sensitive credentials, plaintext secrets, or full webhook secrets in audit logs.

============================================================
44 — REQUIRED TESTS
============================================================

All implementations must be validated against these test cases:

ONLINE PURCHASE:
[ ] Unpaid order cannot access Digital QR
[ ] Unpaid order cannot enable safety service
[ ] Fake success redirect (?status=success) cannot mark order paid
[ ] Tampered/modified client amount is rejected
[ ] Valid verified payment transitions order to PAID and enables entitlement
[ ] Duplicate webhook does not duplicate QR assignment
[ ] Duplicate webhook does not duplicate entitlement
[ ] Payment failure keeps service locked

RETAIL:
[ ] Scanning QR alone does not activate service
[ ] Wrong activation proof fails verification
[ ] Valid activation proof + unauthorized vehicle fails
[ ] Valid activation proof + authorized vehicle succeeds
[ ] Same QR cannot be claimed twice (atomic claim)
[ ] Activation secret never appears in client response
[ ] Activation secret never appears in URL or public resolver

PUBLIC QR:
[ ] Sequential enumeration is not possible through predictable IDs
[ ] Unknown public ID returns generic safe response
[ ] Inactive QR does not expose active safety profile
[ ] Active QR returns only public projection (no phone/medical unless enabled)
[ ] Private account information never appears

AUTHORIZATION:
[ ] User A cannot access User B's QR
[ ] User A cannot activate against User B's vehicle
[ ] User A cannot request replacement for User B's QR
[ ] Changing vehicleId client-side does not bypass authorization

PAYMENT:
[ ] Browser cannot set isPaid=true
[ ] Webhook HMAC signature verification is mandatory
[ ] Webhook replay is idempotent
[ ] Order amount is server-authoritative

DATABASE:
[ ] publicId is globally UNIQUE in D1
[ ] Payment provider reference is UNIQUE in D1
[ ] Duplicate QR assignment is blocked by database constraints
[ ] Foreign keys are valid and cascade rules are explicit
[ ] Cascade behavior preserves financial and audit history

RESPONSIVE UI:
[ ] Payment pending state renders cleanly on mobile
[ ] Locked QR state renders cleanly on mobile
[ ] Retail activation flow functions seamlessly on mobile
[ ] QR enabled state renders cleanly on mobile

============================================================
45 — FINAL SECURITY INVARIANTS
============================================================

These invariants must ALWAYS remain true:
1. NO VERIFIED ONLINE PAYMENT = NO PAID ONLINE QR ENTITLEMENT
2. NO VERIFIED RETAIL ACTIVATION = NO RETAIL QR ENTITLEMENT
3. NO ENTITLEMENT = NO ENABLED QR SERVICE
4. PUBLIC QR ID ≠ DATABASE ID
5. PUBLIC QR ID ≠ ACTIVATION SECRET
6. PAYMENT REDIRECT ≠ PAYMENT PROOF
7. QR SCAN ≠ QR OWNERSHIP
8. FRONTEND STATE ≠ AUTHORIZATION
9. PAYMENT VERIFIED ≠ EVERY SUBSCRIPTION FEATURE AUTOMATICALLY ENABLED
10. ACTIVE QR = SERVER-AUTHORIZED QR STATE + VALID ENTITLEMENT

============================================================
46 — FINAL ARCHITECTURE PIPELINE
============================================================

ONLINE:
USER → VEHICLE → BUY QR → SERVER ORDER → CASHFREE → SIGNED + VERIFIED PAYMENT EVENT → D1 → QR ASSIGNMENT → ENTITLEMENT → SERVICE ENABLED → QR / SAFETY VIEW

RETAIL:
PHYSICAL QR → OPAQUE PUBLIC ID → AUTHENTICATED USER → ACTIVATION PROOF → SERVER VERIFICATION → AUTHORIZED VEHICLE → ATOMIC CLAIM → D1 → ENTITLEMENT → SERVICE ENABLED → QR / SAFETY VIEW

NEVER:
❌ PAYMENT REDIRECT → ACTIVE QR
❌ SCAN QR → ACTIVE QR
❌ FRONTEND FLAG → SERVICE ENABLED
❌ PREDICTABLE SLUG → QR LOOKUP
❌ ACTIVATION SECRET → PUBLIC QR

