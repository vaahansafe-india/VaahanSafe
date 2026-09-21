# Threat Model: QR Replacement Subsystem

## 1. Assets & Security Boundaries

| Asset | Confidentiality | Integrity | Availability | Threat Impacts |
| :--- | :--- | :--- | :--- | :--- |
| **Active Vehicle QR Assignment** | High | Critical | Critical | Malicious deactivation leaves driver without emergency protection. |
| **Emergency Contacts / Blood Group** | High | Critical | High | Finder or attacker viewing private medical information. |
| **Physical Sticker Stock** | Low | Critical | High | Fraudulent allocation drains company inventory. |
| **Plaintext Scratch Secret** | Critical | Critical | Critical | Stolen secret enables unauthorized activation before delivery. |
| **Customer Shipping Address** | High | High | Low | Doxxing or harassment via stolen logistics metadata. |

---

## 2. Identified Threat Vectors & Mitigations

### Threat 1: Insecure Direct Object Reference (IDOR) on Replacement Submission
- **Vector**: Attacker submits `POST /v1/replacements` with `oldQrStickerId = "victim_qr_123"`.
- **Mitigation**: The system ignores client-provided QR assertions and queries the authoritative `vehicles` and `qr_assignments` tables using the authenticated caller's `user_id`. If `vehicle.user_id !== session.user_id`, the request is immediately rejected with `ReplacementOwnershipError`.

### Threat 2: Account Takeover & Malicious QR Deactivation
- **Vector**: Compromised user account is used by an adversary to request replacement, deactivating the victim's active QR on the road.
- **Mitigation**: Step-up verification policy. Accounts with password changes, phone changes, or recovery events within 48 hours trigger `requiresStepUp = true`, demanding an SMS OTP sent directly to the registered primary phone before approval.

### Threat 3: Concurrency Race / Duplicate Sticker Siphoning
- **Vector**: Attacker triggers multiple concurrent approval requests hoping to allocate multiple physical stickers for a single fee.
- **Mitigation**: Partial unique index `idx_replacement_active_old_qr` prevents multiple active replacement requests for the same sticker. Furthermore, `sticker_replacements` enforces a UNIQUE constraint on `replacement_request_id`.

### Threat 4: Plaintext Scratch Secret Leakage in Fulfilment
- **Vector**: Warehouse worker or courier intercepts package and reads QR secret to hijack sticker.
- **Mitigation**: Plaintext secrets exist only in Phase 08 manufacturing exports. Shipping and warehouse workers only interact with `public_id` and `visible_code`. The scratch layer remains physically sealed.

### Threat 5: Stale Emergency Profile Leak on Replaced QR
- **Vector**: An old QR is replaced, but a bystander scanning the old sticker still sees the owner's phone numbers.
- **Mitigation**: The resolver query (`resolvePublicEmergencyProfile`) inspects `qr_stickers.status`. If status is `REPLACED` or `LOST_DAMAGED`, the query **zeroes out** all contacts, medical notes, and vehicle details, returning only a safe deactivation message.

### Threat 6: Automatic Restocking of Tampered RTO Parcels
- **Vector**: A delivered package is intercepted, scratch layer scraped, and returned to origin; the system automatically puts it back in sellable stock.
- **Mitigation**: Invariant 19 mandates that `RECEIVED_RTO` stickers are quarantined and cannot be auto-restocked without explicit physical inspection and signed supervisor audit.
