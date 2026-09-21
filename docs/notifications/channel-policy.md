# Channel Eligibility Matrix & Mandatory Security Policy

## 1. Channel Eligibility Matrix

| Event Type | In-App | WhatsApp | Email | Mandatory Policy |
|---|:---:|:---:|:---:|:---:|
| `ACCOUNT_WELCOME` | YES | OPTIONAL | YES | Optional preferences apply |
| `QR_ACTIVATED` | YES | YES | YES | Optional preferences apply |
| `PAYMENT_SUCCEEDED` | YES | YES | RECEIPT | Receipt email required; WA optional |
| `SUBSCRIPTION_RENEWED` | YES | YES | YES | Optional preferences apply |
| `SUBSCRIPTION_RENEWAL_FAILED`| YES | YES | YES | High priority; optional WA |
| `SHIPMENT_UPDATED` | YES | YES | OPTIONAL | WA primary tracking; email optional |
| `REPLACEMENT_APPROVED` | YES | YES | YES | Optional preferences apply |
| `EMERGENCY_SCAN_ALERT` | YES | IF ENABLED | OPTIONAL | Cooldown controlled; non-alarming |
| `SECURITY_CHANGED` | YES | YES | YES | **MANDATORY**: Cannot be disabled |
| `SUPPORT_UPDATED` | YES | OPTIONAL | YES | Email primary ticket thread |

---

## 2. Mandatory Security Notification Policy

Under no circumstances may a user disable security notifications:
- If a user disables all general marketing or commerce communications, `SECURITY_CHANGED` alerts continue to dispatch via **In-App** and **Email**.
- For security events, the notification resolver prefers a **destination snapshot** taken at the moment of the event, ensuring that if an account is compromised and phone/email is altered, the original verified destination receives the security alert.
