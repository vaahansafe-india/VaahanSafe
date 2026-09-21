# QR Replacement State Machine

## 1. Lifecycle States

```
CUSTOMER SUBMISSION
        │
        ▼
   REQUESTED
        │
   [Risk & Fraud Check]
        │
   ┌────┴───────────────────────────┐
   ▼                                ▼
UNDER_REVIEW (Manual Support)    APPROVED (Auto or Manual)
   │                                │
   ├──────────────► REJECTED        │
   │                                ▼
   │                          QR_ALLOCATED
   │                                │
   │                                ▼
   │                             MIGRATED (Atomic Old -> New Assignment)
   │                                │
   │                                ▼
   │                             SHIPPED
   │                                │
   │                                ▼
   └──────────────────────►     COMPLETED
```

---

## 2. State Descriptions

| State | Purpose | Allowed Transitions |
| :--- | :--- | :--- |
| `REQUESTED` | Initial customer submission; risk score evaluated. | `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `UNDER_REVIEW` | High-risk submission awaiting operations agent decision. | `APPROVED`, `REJECTED`, `CANCELLED` |
| `APPROVED` | Approved for replacement; eligible for physical QR allocation. | `QR_ALLOCATED`, `CANCELLED` |
| `REJECTED` | Request denied (fraud, ownership mismatch, or abuse). | *(Terminal)* |
| `QR_ALLOCATED` | New physical sticker claimed from warehouse inventory. | `MIGRATED`, `CANCELLED` |
| `MIGRATED` | Old assignment closed (`REPLACED`); new assignment established. | `SHIPPED`, `COMPLETED` |
| `SHIPPED` | New physical sticker package dispatched to customer address. | `COMPLETED` |
| `COMPLETED` | Replacement delivered and active on customer vehicle. | *(Terminal)* |
| `CANCELLED` | Customer or operator withdrew request prior to migration. | *(Terminal)* |

---

## 3. Step-Up Verification Rules

To prevent account takeover fraud and unauthorized vehicle sticker deactivations, step-up OTP verification is mandated when:
1. **Account recently recovered**: Password or primary phone changed within 48 hours.
2. **Suspicious session**: Untrusted device fingerprint or foreign IP address.
3. **Repeated requests**: Customer has requested $\ge 2$ prior replacements within 90 days.
4. **Manual fraud flag**: Support agent or fraud rules flagged account.
