---
description: Mandatory security and entitlement architecture for QR lifecycle, Cashfree payments, retail activation, and service gating
globs: "**/*"
alwaysApply: true
---

# VaahanSafe Secure QR, Payment & Activation Architecture

### Four Decoupled Domain Concepts (Hard Lock)
Do NOT model simply as `qr.status = ACTIVE`. You must separate:
1. **Payment State**: PENDING, PROCESSING, PAID, FAILED, CANCELLED (Cashfree server-verified signed webhooks only).
2. **QR Lifecycle State**: INVENTORY, PRINTED, DISTRIBUTED, ASSIGNED, ACTIVATED, REPLACED, DAMAGED, LOST, BLOCKED.
3. **Entitlement State**: DIGITAL_QR_ACCESS, SAFETY_VIEW_ACTIVE, EMERGENCY_ROUTING, SCAN_HISTORY_LOGGING.
4. **Subscription State**: TIER_FREE, TIER_STANDARD, TIER_PREMIUM, EXPIRED.

### Invariant Rules
- **Server Authoritative Gates**:
  - Online QR: Payment Verified → Order Confirmed → QR Assigned → Service Enabled.
  - Retail QR: Physical QR Exists → Opaque Public ID Resolved → Activation Proof Verified → Mobile Verified → Vehicle Bound → Service Enabled.
- **Never Trust Browser Redirects**: Cashfree return URL / callbacks are NEVER payment proof.
- **Webhook Security**: Verify `x-webhook-signature` using raw request body. Protect idempotency via unique provider event IDs in D1.
- **Never Trust Client Amounts**: Prices and totals are strictly server-authoritative.
- **Opaque High-Entropy Identifiers**: Public QR resolver uses `qr.vaahansafe.com/{opaquePublicId}`. Never sequential slugs, database PKs, or registration numbers.
- **Separation of Three Identifiers**: Internal Database ID ≠ Opaque Public ID ≠ Activation Secret.
- **Activation Secrets**: Stored only as secure hashes (`activation_secret_hash`), never in plaintext, never exposed to clients.
- **QR Generator**: Generates only from `https://qr.vaahansafe.com/{opaquePublicId}`. Never receives secrets, payment IDs, or user PII.
- **D1 Foreign Keys & Cascades**: Financial and audit records must use `RESTRICT` / `NO ACTION` so they are never deleted on vehicle/user updates. Parameterized queries are mandatory.
