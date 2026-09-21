# VaahanSafe Notification Event Catalog

Initial canonical business events supported by the notification platform:

| Event Type | Category | Default Priority | Template Key | Description |
|---|---|---|---|---|
| `ACCOUNT_WELCOME` | `ACCOUNT` | `NORMAL` | `ACCOUNT_WELCOME_V1` | Dispatched after user registration and first-login onboarding completion. |
| `QR_ACTIVATED` | `SAFETY` | `NORMAL` | `QR_ACTIVATED_V1` | Dispatched when a QR sticker is successfully paired and activated for a vehicle. |
| `PAYMENT_SUCCEEDED` | `COMMERCE` | `NORMAL` | `PAYMENT_SUCCESS_V1` | Dispatched after authoritative confirmation from the payment gateway. |
| `SUBSCRIPTION_RENEWED` | `SUBSCRIPTION` | `NORMAL` | `SUBSCRIPTION_RENEWED_V1` | Dispatched when vehicle safety subscription is successfully renewed. |
| `SUBSCRIPTION_RENEWAL_FAILED` | `SUBSCRIPTION` | `HIGH` | `SUBSCRIPTION_RENEWAL_FAILED_V1` | Dispatched when an automated recurring payment attempt fails. |
| `SHIPMENT_UPDATED` | `FULFILMENT` | `NORMAL` | `SHIPMENT_UPDATE_V1` | Dispatched when a physical sticker parcel changes shipping status. |
| `REPLACEMENT_APPROVED` | `SAFETY` | `NORMAL` | `REPLACEMENT_APPROVED_V1` | Dispatched when a customer's sticker replacement request is approved. |
| `EMERGENCY_SCAN_ALERT` | `SAFETY` | `HIGH` | `EMERGENCY_SCAN_ALERT_V1` | Asynchronous alert when an active QR sticker is scanned by a finder. |
| `SECURITY_CHANGED` | `SECURITY` | `CRITICAL` | `SECURITY_CHANGED_V1` | Mandatory security alert when phone, auth methods, or sessions change. |
| `SUPPORT_UPDATED` | `SUPPORT` | `LOW` | `SUPPORT_UPDATE_V1` | Dispatched on support ticket status update or customer service reply. |

---

## Payload Least-Privilege Rules

To protect customer privacy and prevent data leakage:
- Payloads MUST contain only the minimum required variables for rendering (e.g. `vehicleRegMasked`, `orderNumber`, `amountDisplay`).
- Full domain models (`User`, `Vehicle`, `Order`, `EmergencyProfile`) MUST NEVER be passed directly into notification intents or queue messages.
