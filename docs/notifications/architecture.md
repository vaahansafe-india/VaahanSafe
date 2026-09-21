# VaahanSafe Notification System Architecture (Phase 11)

## 1. Non-Negotiable Core Principle

**NOTIFICATIONS ARE SIDE EFFECTS.**
They are NOT authoritative business state.

```
BUSINESS TRANSACTION (QR Activation, Payment, Subscription, Shipment)
                 │
                 ▼
          AUTHORITATIVE COMMIT
                 │
                 ▼
        NOTIFICATION INTENT (D1)
                 │
                 ▼
     NOTIFICATION_QUEUE (Cloudflare Queue)
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  IN-APP     WHATSAPP      EMAIL
 (First-party  (MSG91)   (Provider API)
   D1 table)
```

- **Commit Before Notification**: An email or WhatsApp message may only describe a business state that has authoritatively committed in the database (e.g. `payments.status = 'SUCCESS'`, `qr_stickers.status = 'ACTIVATED'`).
- **Failure Isolation**: If WhatsApp or Email delivery encounters an outage, the business transaction is **NEVER** rolled back. Payment remains `SUCCESS`, QR remains `ACTIVATED`.
- **UI Independence**: Notification read/unread status is UI state only. Unread notifications never imply incomplete or pending business operations.

---

## 2. Architectural Boundaries & Decoupling

| Concept | Responsibility | Storage / Representation |
|---|---|---|
| **Business Event** | Describes what happened in the domain (`QR_ACTIVATED`, `PAYMENT_SUCCEEDED`) | Business Domain / Transaction |
| **Notification Intent** | Describes desired communication to be evaluated | `notification_intents` table in D1 |
| **Queue Message** | Minimal versioned routing envelope (`version: 1`, `intentId`, `eventType`) | Cloudflare `NOTIFICATION_QUEUE` |
| **In-App Notification** | First-party notification row displayed to user in UI | `notifications` table in D1 |
| **Delivery Record** | Per-channel lifecycle state (`PENDING`, `DELIVERED`, `FAILED_RETRYABLE`, etc.) | `notification_deliveries` in D1 |
| **Delivery Attempt** | Append-only diagnostic attempt log (timing, normalized code, provider ID) | `notification_delivery_attempts` in D1 |
| **Channels** | Communication surfaces: `IN_APP`, `WHATSAPP`, `EMAIL` | Domain enum |
| **Templates** | Versioned templates with strict Zod variable schemas | Central Registry (`TEMPLATE_REGISTRY`) |
| **Providers** | Outbound messaging adapters (`INTERNAL`, `MSG91`, `EMAIL_PROVIDER`) | Adapter layer behind ports |

---

## 3. The OTP Authentication Boundary

**OTP IS NOT A NOTIFICATION.**
Mobile OTP belongs strictly to the authentication capability (`@vaahansafe/auth`).

- **Synchronous Auth Flow**: User enters phone $\to$ rate/abuse check $\to$ synchronous call to MSG91 $\to$ user enters OTP $\to$ verify $\to$ session created.
- **Queue Decoupling**: OTP is **NEVER** queued through `NOTIFICATION_QUEUE` or dead-letter queues. OTP requires sub-second response times; queue latency is unacceptable for login.
- **Privacy**: Plaintext OTP is **NEVER** logged, never placed in `notification_intents`, and never stored in database tables.
