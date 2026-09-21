# Surface-to-Binding Least-Privilege Matrix — VaahanSafe

Every Worker surface is granted ONLY the resources and bindings required to fulfill its specific responsibilities.

---

## 1. Resource Binding Permissions

| Surface | Class | D1 (`DB`) | `PUBLIC_STORAGE` | `PRIVATE_STORAGE` | `EXPORT_STORAGE` | `NOTIFICATION_QUEUE` | `ANALYTICS_QUEUE` | `COMMERCE_QUEUE` |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **`web`** | DISCOVERY | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`customer`** | TRANSACTION | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **`activate`** | TRANSACTION | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **`qr`** | SAFETY | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **`admin`** | OPERATIONS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`api`** | OPERATIONS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`blog`** | DISCOVERY | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`status`** | OPERATIONS | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 2. Secret Ownership Matrix

| Surface | `SESSION_SECRET` | `CASHFREE_*` | `MSG91_AUTH_KEY` | `EMAIL_API_KEY` | `TURNSTILE_SECRET_KEY` | `GOOGLE_CLIENT_*` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **`web`** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`customer`** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **`activate`** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **`qr`** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`admin`** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **`api`** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **`blog`** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`status`** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Rationale Behind Key Decisions

1. **`qr` Surface (Critical Safety Path)**:
   - Must have the smallest practical dependency surface.
   - Binds ONLY to `DB` (read safety projection) and `ANALYTICS_QUEUE` (async non-blocking scan event logging).
   - Zero payment or messaging secrets. Outages in Cashfree, MSG91, or email providers will NEVER prevent an active QR emergency profile from loading.
2. **`status` Surface (Independent Reliability)**:
   - Has zero bindings to the main database or storage.
   - Remains independently deployable to communicate incidents when other platform systems are degraded or offline.
3. **`activate` Surface (Retail Activation)**:
   - Does not have access to private storage or commerce queues.
   - Protects scratch code attempts via Turnstile and queues notification alerts upon successful activation.
4. **`api` Surface (Central Integrations)**:
   - Owns provider webhook verification and asynchronous fulfillment, housing necessary payment and messaging API credentials.
