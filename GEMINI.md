# VAAHANSAFE GLOBAL INFRASTRUCTURE & ARCHITECTURE RULES

See [AGENTS.md](./AGENTS.md) for full detailed architecture specifications.

## Mandatory Invariant: Cloudflare Only / Real Services Only

- Cloudflare D1 is the single source of truth for persistent relational data.
- Never use `localStorage`, `sessionStorage`, `IndexedDB`, or local SQLite (`*.db`, `better-sqlite3`).
- Real MSG91 OTP for SMS authentication and WhatsApp emergency alerts.
- Real Google OAuth 2.0 with server-side token exchange and client secret protection.
- Every account requires a verified mobile number (`PHONE_REQUIRED` gate).
- Server-managed `HttpOnly` session cookies (`vs_session`, `vs_admin_session`).
- Server-verified Cloudflare Turnstile bot protection.
- Real Gmail SMTP (`smtp.gmail.com:587`) for branded welcome and emergency scan alerts.
- When services fail, return recoverable user errors — NEVER fall back to dummy mock data.

## Secure QR, Payment, and Activation Architecture (Hard Gates)

See [AGENTS.md](./AGENTS.md) for the complete 46-rule specification.

1. **Four Decoupled Domain Concepts**:
   - **Payment State** (authoritative money confirmation via Cashfree signed webhooks)
   - **QR Lifecycle State** (hardware status: PRINTED, DISTRIBUTED, ACTIVATED, REPLACED, etc.)
   - **Entitlement State** (service permissions: Digital QR, Safety View, Emergency Calling)
   - **Subscription State** (plan-backed tier features)
2. **Two Legitimate Primary Acquisition Gates**:
   - **Online QR**: Order → Payment Attempt → Server Webhook Verification → Paid → QR Assigned → Entitlement → Service Enabled.
   - **Retail QR**: Physical QR Exists → Public ID Resolved → Activation Proof (Hash) Verified → Mobile Verified → Vehicle Bound → Entitlement → Service Enabled.
3. **Never Trust Browser Redirects**:
   - Cashfree browser redirects (`?status=success`) are NEVER payment proof. Only HMAC-verified webhook signatures update order status.
4. **Idempotency & Pricing**:
   - Webhooks must be processed idempotently via `payment_events` unique keys.
   - Client-provided amounts must never be trusted; pricing is strictly server-authoritative.
5. **Opaque High-Entropy Identifiers**:
   - Resolver identity is opaque: `https://qr.vaahansafe.com/{opaquePublicId}`.
   - Separate at all times: Internal Database ID ≠ Opaque Public ID ≠ Activation Secret.
   - QR image encoder only receives `https://qr.vaahansafe.com/{opaquePublicId}`—never PII, secrets, or payment data.

