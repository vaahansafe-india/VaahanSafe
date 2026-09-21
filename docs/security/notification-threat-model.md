# Notification System Threat Model

## 1. Assets & Trust Boundaries

- **Trust Boundary 1 (Client Browser $\to$ Server API)**: Client inputs (e.g. phone, email, query params) are untrusted.
- **Trust Boundary 2 (Server $\to$ Cloudflare Queue)**: Queues pass internal asynchronous envelopes.
- **Trust Boundary 3 (Server $\to$ Third-Party Providers)**: MSG91, Email providers.

---

## 2. Threats & Mitigations

| Threat ID | Threat Description | Attack Vector | Mitigation in Place |
|---|---|---|---|
| **THREAT-01** | **Notification Redirection / Spoofing** | Attacker supplies victim's phone or email during checkout or activation to hijack transactional alerts. | **Trusted Destination Policy**: Notifications resolve phone/email strictly from authoritative database account records (`User`). Browser-supplied contact fields are discarded. |
| **THREAT-02** | **In-App Notification IDOR** | User A tries to view or mark read User B's private notifications via `/v1/notifications/{id}/read`. | **IDOR Guard**: D1 queries enforce `WHERE id = ? AND user_id = ?`. Queries for other users return 0 affected rows. |
| **THREAT-03** | **Template Injection / Stored XSS** | Attacker includes `<script>alert(1)</script>` or HTML in vehicle nicknames or customer names. | **Strict HTML Escaping & Zod Validation**: All user strings are entity-escaped (`&lt;`, `&gt;`, `&quot;`) and validated against strict schemas before rendering. |
| **THREAT-04** | **Credential & OTP Leakage in Queue/DLQ** | Passwords, MSG91 auth keys, or OTP plaintext leak into queue messages or dead-letter logs. | **Decoupled Architecture**: OTP never enters queues. Queue messages contain only `{ version: 1, messageId, intentId, eventType, createdAt }`. |
| **THREAT-05** | **Emergency Alert Storming** | Malicious actor repeatedly scans public QR stickers on parked vehicles to flood owner with notifications and exhaust SMS credits. | **Sliding-Window Cooldown**: Time-bucketed deduplication (default 15 minutes) suppresses redundant alerts while finder profile renders normally. |
| **THREAT-06** | **Security Alert Suppression** | Attacker compromises account and disables notification preferences to hide suspicious activity. | **Mandatory Security Policy**: `SECURITY_CHANGED` events override user preferences and dispatch via In-App and Email unconditionally. |
| **THREAT-07** | **Phone/Email Change Race Condition** | Attacker initiates phone change and immediately triggers an action hoping alert goes to new phone. | **Security Destination Snapshot**: Security notifications capture snapshot of destination at event creation time. |
