# OTP Boundary & Authentication Decoupling

## 1. Architectural Distinction

| Dimension | Mobile OTP | Transactional Notifications |
|---|---|---|
| **Domain** | `@vaahansafe/auth` (Authentication) | `@vaahansafe/notifications` (Communications) |
| **Execution** | Synchronous HTTP request to MSG91 | Asynchronous via Cloudflare Queue |
| **Latency SLA** | < 1 second | 5–60 seconds |
| **Queue Target** | None (NEVER enters queue) | `NOTIFICATION_QUEUE` |
| **Persistence** | Hash only (`StepUpChallenge`), NEVER plaintext | D1 `notification_intents` (payloads) |
| **Dead-Letter** | NEVER dead-lettered | Transitions to DLQ on exhaustion |
| **In-App Presence** | None (never displayed in notification center) | Displayed in Notification Center |

---

## 2. Invariant Proofs

1. **Queue Outage Proof**: If `NOTIFICATION_QUEUE` is down or congested, the login flow continues without disruption because auth interacts directly and synchronously with MSG91 OTP endpoints.
2. **Privacy Proof**: Plaintext OTP is never stored in `notification_intents`, `notifications`, `notification_deliveries`, or logs.
