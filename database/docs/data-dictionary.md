# VaahanSafe Database Architecture — Data Dictionary (Migrations 0001–0003)

This data dictionary documents every table, column, constraint, relationship, and privacy classification established in Migrations `0001_identity.sql`, `0002_vehicle_emergency.sql`, and `0003_qr_inventory.sql`.

---

## 1. Migration 0001 — Identity & Authentication

### `users`
- **Purpose**: Authoritative customer master record.
- **Primary Key**: `id` (TEXT, format: `usr_[sortable_id]`).
- **Mutability**: Mutable.
- **Privacy Classification**: `ACCOUNT_PRIVATE` / PII.
- **Retention**: `RETENTION_POLICY_TBD` (Kept active; upon deletion request, transitions to `DELETION_PENDING` -> `ANONYMIZED`).

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque internal ID |
| `primary_phone` | TEXT | Yes | UNIQUE, E.164 normalized | ACCOUNT_PRIVATE | Verified mobile number |
| `primary_email` | TEXT | Yes | UNIQUE, lowercase normalized | ACCOUNT_PRIVATE | Verified email address |
| `full_name` | TEXT | Yes | | ACCOUNT_PRIVATE | Customer legal/display name |
| `onboarding_status` | TEXT | No | DEFAULT 'AUTHENTICATED' CHECK (...) | OPERATIONAL | Step in onboarding funnel |
| `status` | TEXT | No | DEFAULT 'ACTIVE' CHECK (...) | OPERATIONAL | Lifecycle state |
| `terms_accepted_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Terms of Service consent |
| `privacy_accepted_at`| TEXT | Yes | ISO-8601 UTC | AUDIT | Privacy policy consent |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Record creation UTC |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Record last modified UTC |
| `deleted_at` | TEXT | Yes | | AUDIT | Soft deletion / anonymization |

---

### `auth_identities`
- **Purpose**: Multi-provider authentication identity records linked to one user (Phone OTP, Google OAuth).
- **Primary Key**: `id` (TEXT, format: `aid_[sortable_id]`).
- **Foreign Keys**: `user_id` -> `users(id)` ON DELETE CASCADE.
- **Unique Constraint**: `UNIQUE(provider, provider_subject)`.
- **Mutability**: Mutable.
- **Privacy Classification**: `SECURITY_SENSITIVE`.
- **Retention**: Follows user lifecycle.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque internal identity ID |
| `user_id` | TEXT | No | REFERENCES users(id) | OPERATIONAL | Owning user |
| `provider` | TEXT | No | CHECK (PHONE, GOOGLE, EMAIL_OTP) | OPERATIONAL | Identity provider type |
| `provider_subject` | TEXT | No | | SECURITY_SENSITIVE | E.164 phone or OAuth sub ID |
| `normalized_identifier`| TEXT | Yes | | ACCOUNT_PRIVATE | Lookup index (phone/email) |
| `verified_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Provider verification timestamp |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Identity link created |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Identity link updated |

---

### `sessions`
- **Purpose**: Authenticated bearer sessions tracking active devices.
- **Primary Key**: `id` (TEXT, format: `ses_[sortable_id]`).
- **Foreign Keys**: `user_id` -> `users(id)` ON DELETE CASCADE.
- **Unique Constraint**: `token_hash` UNIQUE.
- **Mutability**: Mutable (tracks `last_seen_at`, `revoked_at`).
- **Privacy Classification**: `SECURITY_SENSITIVE`.
- **Retention**: Expired/revoked sessions pruned after 90 days.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque session identifier |
| `user_id` | TEXT | No | REFERENCES users(id) | OPERATIONAL | Authenticated user |
| `token_hash` | TEXT | No | UNIQUE | SECURITY_SENSITIVE | SHA-256 hash of session token |
| `user_agent` | TEXT | Yes | | OPERATIONAL | Client browser/device string |
| `ip_address` | TEXT | Yes | | SECURITY_SENSITIVE | Client IP at session issuance |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Session issued at |
| `last_seen_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Session last heartbeat |
| `expires_at` | TEXT | No | | OPERATIONAL | Session validity cutoff |
| `revoked_at` | TEXT | Yes | | SECURITY_SENSITIVE | Revocation timestamp |
| `revocation_reason`| TEXT | Yes | | AUDIT | Reason (logout, admin, rotation) |

---

### `addresses`
- **Purpose**: Shipping, billing, and profile physical addresses.
- **Primary Key**: `id` (TEXT, format: `adr_[sortable_id]`).
- **Foreign Keys**: `user_id` -> `users(id)` ON DELETE CASCADE.
- **Mutability**: Mutable.
- **Privacy Classification**: `ACCOUNT_PRIVATE` / PII.
- **Retention**: Follows user lifecycle.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque address ID |
| `user_id` | TEXT | No | REFERENCES users(id) | OPERATIONAL | Owning user |
| `recipient_name` | TEXT | No | | ACCOUNT_PRIVATE | Person receiving order |
| `phone` | TEXT | No | | ACCOUNT_PRIVATE | Local delivery contact phone |
| `line1` | TEXT | No | | ACCOUNT_PRIVATE | Street / House / Building |
| `line2` | TEXT | Yes | | ACCOUNT_PRIVATE | Apartment / Suite |
| `landmark` | TEXT | Yes | | ACCOUNT_PRIVATE | Local delivery landmark |
| `city` | TEXT | No | | ACCOUNT_PRIVATE | Delivery city |
| `state` | TEXT | No | | ACCOUNT_PRIVATE | Delivery state |
| `postal_code` | TEXT | No | | ACCOUNT_PRIVATE | 6-digit PIN code |
| `country_code` | TEXT | No | DEFAULT 'IN' | OPERATIONAL | ISO 3166-1 alpha-2 |
| `type` | TEXT | No | DEFAULT 'SHIPPING' CHECK (...) | OPERATIONAL | Address category |
| `is_default` | INTEGER | No | DEFAULT 0 CHECK (0, 1) | OPERATIONAL | User default flag |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Created timestamp |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Updated timestamp |

---

### `admin_users`
- **Purpose**: Internal operations, support agents, and privileged operators.
- **Primary Key**: `id` (TEXT, format: `adm_[sortable_id]`).
- **Unique Constraint**: `email` UNIQUE.
- **Mutability**: Mutable.
- **Privacy Classification**: `SECURITY_SENSITIVE`.
- **Retention**: Active while employed; deactivated on departure.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque admin identifier |
| `email` | TEXT | No | UNIQUE | SECURITY_SENSITIVE | Work email address |
| `name` | TEXT | No | | OPERATIONAL | Admin full name |
| `role` | TEXT | No | DEFAULT 'SUPPORT_AGENT' CHECK (...) | SECURITY_SENSITIVE | RBAC role |
| `status` | TEXT | No | DEFAULT 'ACTIVE' CHECK (...) | OPERATIONAL | Admin account status |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Created timestamp |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Updated timestamp |

---

## 2. Migration 0002 — Vehicle & Emergency

### `vehicles`
- **Purpose**: Customer registered vehicles protected by VaahanSafe.
- **Primary Key**: `id` (TEXT, format: `veh_[sortable_id]`).
- **Foreign Keys**: `user_id` -> `users(id)` ON DELETE RESTRICT (Prevents accidental cascading data loss).
- **Mutability**: Mutable.
- **Privacy Classification**: `ACCOUNT_PRIVATE` / Asset Data.
- **Retention**: Follows vehicle lifecycle.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque vehicle identifier |
| `user_id` | TEXT | No | REFERENCES users(id) | OPERATIONAL | Owning customer |
| `registration_number`| TEXT | No | | ACCOUNT_PRIVATE | Display registration (e.g. MH 12 AB 1234) |
| `registration_number_normalized`| TEXT | No | Indexed | OPERATIONAL | Stripped registration (MH12AB1234) |
| `vehicle_type` | TEXT | No | DEFAULT 'CAR' CHECK (...) | OPERATIONAL | Vehicle classification |
| `make` | TEXT | No | | OPERATIONAL | Manufacturer (Hyundai, Honda) |
| `model` | TEXT | No | | OPERATIONAL | Model line (Creta, City) |
| `variant` | TEXT | Yes | | OPERATIONAL | Trim / Variant |
| `year` | INTEGER | Yes | | OPERATIONAL | Manufacture / Registration year |
| `color` | TEXT | Yes | | OPERATIONAL | Primary vehicle color |
| `status` | TEXT | No | DEFAULT 'ACTIVE' CHECK (...) | OPERATIONAL | Vehicle state |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Created timestamp |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Updated timestamp |
| `deleted_at` | TEXT | Yes | | AUDIT | Deletion / transfer timestamp |

---

### `emergency_profiles`
- **Purpose**: Controls public projection and privacy preferences for an emergency scan.
- **Primary Key**: `id` (TEXT, format: `emp_[sortable_id]`).
- **Foreign Keys**: `vehicle_id` -> `vehicles(id)` ON DELETE CASCADE (1:1 with vehicle).
- **Unique Constraint**: `vehicle_id` UNIQUE.
- **Mutability**: Mutable.
- **Privacy Classification**: `PUBLIC_CONTROLLED` (Projected only per flags).
- **Retention**: Follows vehicle lifecycle.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque emergency profile ID |
| `vehicle_id` | TEXT | No | REFERENCES vehicles(id) UNIQUE | OPERATIONAL | Associated vehicle |
| `display_name` | TEXT | Yes | | PUBLIC_CONTROLLED | Name shown on public scan |
| `blood_group` | TEXT | Yes | CHECK ('A+', 'O+', etc.) | PUBLIC_CONTROLLED | Emergency medical blood group |
| `medical_notes` | TEXT | Yes | | PUBLIC_CONTROLLED | Critical medical alerts |
| `public_vehicle_details`| TEXT | Yes | | PUBLIC_CONTROLLED | Safe vehicle descriptors |
| `show_owner_name`| INTEGER | No | DEFAULT 1 CHECK (0, 1) | OPERATIONAL | Owner name visibility toggle |
| `show_blood_group`| INTEGER | No | DEFAULT 1 CHECK (0, 1) | OPERATIONAL | Blood group visibility toggle |
| `show_medical_notes`| INTEGER | No | DEFAULT 0 CHECK (0, 1) | OPERATIONAL | Medical notes visibility toggle |
| `show_vehicle_details`| INTEGER| No | DEFAULT 1 CHECK (0, 1) | OPERATIONAL | Vehicle display visibility toggle |
| `status` | TEXT | No | DEFAULT 'ACTIVE' CHECK (...) | OPERATIONAL | Profile status |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Created timestamp |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Updated timestamp |

---

### `emergency_contacts`
- **Purpose**: Emergency contacts callable/notifiable when a vehicle QR is scanned.
- **Primary Key**: `id` (TEXT, format: `emc_[sortable_id]`).
- **Foreign Keys**: `emergency_profile_id` -> `emergency_profiles(id)` ON DELETE CASCADE.
- **Mutability**: Mutable.
- **Privacy Classification**: `PUBLIC_CONTROLLED` (Phone exposed only if `is_enabled = 1`).
- **Retention**: Follows vehicle emergency profile.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque emergency contact ID |
| `emergency_profile_id`| TEXT| No | REFERENCES emergency_profiles(id) | OPERATIONAL | Parent emergency profile |
| `name` | TEXT | No | | PUBLIC_CONTROLLED | Contact display name |
| `relationship_label`| TEXT | No | | PUBLIC_CONTROLLED | Kinship (Spouse, Parent) |
| `phone` | TEXT | No | E.164 format | PUBLIC_CONTROLLED | Contact phone number |
| `priority` | INTEGER | No | DEFAULT 1 CHECK (1..5) | OPERATIONAL | Call priority ordering |
| `is_enabled` | INTEGER | No | DEFAULT 1 CHECK (0, 1) | OPERATIONAL | Contact active flag |
| `allow_call` | INTEGER | No | DEFAULT 1 CHECK (0, 1) | OPERATIONAL | Direct phone call permission |
| `allow_message` | INTEGER | No | DEFAULT 1 CHECK (0, 1) | OPERATIONAL | WhatsApp/SMS permission |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Created timestamp |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Updated timestamp |

---

## 3. Migration 0003 — QR Inventory & Lifecycle

### `qr_batches`
- **Purpose**: Factory manufacturing and print lot tracking.
- **Primary Key**: `id` (TEXT, format: `qrb_[sortable_id]`).
- **Unique Constraint**: `reference_code` UNIQUE (e.g. `BAT/VS/2026/001`).
- **Mutability**: Mutable.
- **Privacy Classification**: `OPERATIONAL`.
- **Retention**: Permanent manufacturing history.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque batch ID |
| `reference_code` | TEXT | No | UNIQUE | OPERATIONAL | Human-readable batch code |
| `quantity` | INTEGER | No | CHECK (quantity > 0) | OPERATIONAL | Sticker count in batch |
| `status` | TEXT | No | DEFAULT 'DRAFT' CHECK (...) | OPERATIONAL | Manufacturing state |
| `manufacturer_name`| TEXT| Yes | | OPERATIONAL | Print vendor name |
| `manufacturer_reference`| TEXT| Yes | | OPERATIONAL | Vendor job reference |
| `generated_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Generation timestamp |
| `exported_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Print CSV export timestamp |
| `printed_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Physical print timestamp |
| `created_by` | TEXT | Yes | | AUDIT | Admin user creator |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Batch record created |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Batch record updated |

---

### `qr_stickers`
- **Purpose**: Physical stickers and authoritative lifecycle states.
- **Primary Key**: `id` (TEXT, format: `qr_[sortable_id]`).
- **Foreign Keys**: 
  - `batch_id` -> `qr_batches(id)` ON DELETE RESTRICT
  - `replaced_by_qr_id` -> `qr_stickers(id)` ON DELETE SET NULL
- **Unique Constraints**:
  - `public_id` UNIQUE (Hot-path URL resolution)
  - `visible_code` UNIQUE (Printed label tracking)
- **Mutability**: Mutable.
- **Privacy Classification**: `PUBLIC` (`public_id`, `visible_code`) / `OPERATIONAL`.
- **Retention**: Permanent sticker lifecycle.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque internal sticker ID |
| `public_id` | TEXT | No | UNIQUE, Indexed | PUBLIC | Public QR resolver key |
| `visible_code` | TEXT | No | UNIQUE, Indexed | PUBLIC | Human-readable sticker label |
| `batch_id` | TEXT | No | REFERENCES qr_batches(id) | OPERATIONAL | Print batch reference |
| `status` | TEXT | No | DEFAULT 'PRINTED' CHECK (...) | OPERATIONAL | Authoritative lifecycle state |
| `current_distributor_id`| TEXT| Yes | | OPERATIONAL | Supply-chain distributor |
| `current_retailer_id`| TEXT | Yes | | OPERATIONAL | Supply-chain retailer |
| `activated_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Customer activation date |
| `replaced_by_qr_id`| TEXT | Yes | REFERENCES qr_stickers(id) | OPERATIONAL | Linkage to replacement QR |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Created timestamp |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Updated timestamp |

---

### `qr_activation_secrets`
- **Purpose**: Scratch secret authentication hashes and brute-force lockout safeguards.
- **Primary Key**: `id` (TEXT, format: `qse_[sortable_id]`).
- **Foreign Keys**: `qr_id` -> `qr_stickers(id)` ON DELETE CASCADE.
- **Unique Constraint**: `qr_id` UNIQUE.
- **Mutability**: Mutable (tracks attempts and consumption).
- **Privacy Classification**: `SECURITY_SENSITIVE`.
- **Retention**: Permanent hash audit record.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque secret ID |
| `qr_id` | TEXT | No | REFERENCES qr_stickers(id) UNIQUE| OPERATIONAL | Associated sticker |
| `secret_hash` | TEXT | No | | SECURITY_SENSITIVE | Cryptographic hash of scratch code |
| `hash_version` | TEXT | No | DEFAULT 'v1' | OPERATIONAL | Algorithm identifier |
| `failed_attempts`| INTEGER| No | DEFAULT 0 CHECK (>= 0) | SECURITY_SENSITIVE | Consecutive failures |
| `locked_until` | TEXT | Yes | ISO-8601 UTC | SECURITY_SENSITIVE | Temporary lockout cutoff |
| `consumed_at` | TEXT | Yes | ISO-8601 UTC | AUDIT | Consumed upon activation |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Secret record created |
| `updated_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Secret record updated |

---

### `qr_assignments`
- **Purpose**: Historical and current assignment of a QR sticker to a vehicle and user.
- **Primary Key**: `id` (TEXT, format: `qra_[sortable_id]`).
- **Foreign Keys**:
  - `qr_id` -> `qr_stickers(id)` ON DELETE RESTRICT
  - `vehicle_id` -> `vehicles(id)` ON DELETE RESTRICT
  - `user_id` -> `users(id)` ON DELETE RESTRICT
- **Partial Unique Indexes**:
  - `UNIQUE(qr_id) WHERE ended_at IS NULL` (At most one active assignment per sticker)
  - `UNIQUE(vehicle_id) WHERE ended_at IS NULL` (At most one active sticker per vehicle)
- **Mutability**: Mutable (`ended_at` closed when replaced/transferred).
- **Privacy Classification**: `OPERATIONAL` / `AUDIT`.
- **Retention**: Permanent assignment audit history.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque assignment ID |
| `qr_id` | TEXT | No | REFERENCES qr_stickers(id) | OPERATIONAL | Assigned sticker |
| `vehicle_id` | TEXT | No | REFERENCES vehicles(id) | OPERATIONAL | Assigned vehicle |
| `user_id` | TEXT | No | REFERENCES users(id) | OPERATIONAL | Owning user at assignment |
| `assignment_type`| TEXT | No | DEFAULT 'INITIAL' CHECK (...) | OPERATIONAL | INITIAL, REPLACEMENT, TRANSFER |
| `assigned_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Effective start timestamp |
| `ended_at` | TEXT | Yes | NULL = CURRENT ACTIVE | OPERATIONAL | Effective end timestamp |
| `end_reason` | TEXT | Yes | CHECK (REPLACED, etc.) | AUDIT | Reason assignment closed |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Record created timestamp |

---

### `qr_status_history`
- **Purpose**: Append-only audit trail of every QR lifecycle state transition.
- **Primary Key**: `id` (TEXT, format: `qsh_[sortable_id]`).
- **Foreign Keys**: `qr_id` -> `qr_stickers(id)` ON DELETE CASCADE.
- **Mutability**: Append-only (Never modified or deleted).
- **Privacy Classification**: `AUDIT`.
- **Retention**: Permanent operational audit log.

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque status history ID |
| `qr_id` | TEXT | No | REFERENCES qr_stickers(id) | OPERATIONAL | Sticker reference |
| `from_status` | TEXT | No | | OPERATIONAL | Previous lifecycle state |
| `to_status` | TEXT | No | | OPERATIONAL | New lifecycle state |
| `reason_code` | TEXT | No | | AUDIT | Structured reason code |
| `actor_type` | TEXT | No | CHECK (SYSTEM, USER, ADMIN, ...)| AUDIT | Entity executing change |
| `actor_id` | TEXT | Yes | | AUDIT | ID of executing actor |
| `metadata_json`| TEXT | Yes | Non-secret JSON | AUDIT | Minimized contextual metadata |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | AUDIT | Transition timestamp |

---

### `qr_activation_attempts`
- **Purpose**: Privacy-minimized fraud and rate-limiting telemetry for activation flows.
- **Primary Key**: `id` (TEXT, format: `qat_[sortable_id]`).
- **Foreign Keys**: `qr_id` -> `qr_stickers(id)` ON DELETE CASCADE.
- **Mutability**: Append-only.
- **Privacy Classification**: `SECURITY_SENSITIVE`.
- **Retention**: `RETENTION_POLICY_TBD` (Evaluated for 180-day rollover).

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque attempt ID |
| `qr_id` | TEXT | No | REFERENCES qr_stickers(id) | OPERATIONAL | Sticker attempted |
| `user_id` | TEXT | Yes | REFERENCES users(id) | OPERATIONAL | Authenticated user if present |
| `outcome` | TEXT | No | CHECK (SUCCESS, INVALID_SECRET, ...)| AUDIT | Result of activation attempt |
| `failure_reason_code`| TEXT| Yes | | AUDIT | Error classification |
| `request_fingerprint_hash`| TEXT| Yes| | SECURITY_SENSITIVE| Browser/device signature hash |
| `ip_hash` | TEXT | Yes | | SECURITY_SENSITIVE| One-way salted hash of IP |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | AUDIT | Attempt timestamp |

---

### `qr_scan_events`
- **Purpose**: Privacy-minimized analytics for QR emergency sticker scans.
- **Primary Key**: `id` (TEXT, format: `qse_[sortable_id]`).
- **Foreign Keys**: `qr_id` -> `qr_stickers(id)` ON DELETE CASCADE.
- **Mutability**: Append-only.
- **Privacy Classification**: `OPERATIONAL` / Analytics.
- **Retention**: `RETENTION_POLICY_TBD` (Aggregated periodically).

| Column | Type | Nullable | Constraints & Defaults | Privacy Class | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT | No | PRIMARY KEY | OPERATIONAL | Opaque scan event ID |
| `qr_id` | TEXT | No | REFERENCES qr_stickers(id) | OPERATIONAL | Scanned sticker |
| `scan_type` | TEXT | No | DEFAULT 'PUBLIC_RESOLVE' | OPERATIONAL | Scan event purpose |
| `result` | TEXT | No | CHECK (RESOLVED_ACTIVE, etc.) | OPERATIONAL | Resolution outcome |
| `city` | TEXT | Yes | | OPERATIONAL | Coarse geolocation |
| `state` | TEXT | Yes | | OPERATIONAL | State geolocation |
| `user_agent_family`| TEXT| Yes | | OPERATIONAL | Cleaned browser family |
| `referrer_class`| TEXT | Yes | | OPERATIONAL | Social, Browser, Camera App |
| `created_at` | TEXT | No | DEFAULT (datetime('now')) | OPERATIONAL | Scan timestamp |
