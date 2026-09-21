# QR Replacement Domain Architecture

## 1. Overview

A replacement is a **controlled transfer of vehicle emergency identity** from a damaged, lost, or defective physical QR sticker to a new physical QR sticker.

### Non-Negotiable Invariants:
1. **Replacement $\neq$ Delete Old + Create New**:
   - The old QR sticker is **never deleted**.
   - Historical assignment records in `qr_assignments` are **never overwritten**.
2. **Same Physical Inventory**:
   - Replacement units come from the **same pre-generated Phase 08 inventory** (`qr_stickers`).
   - There is no separate "replacement sticker pool".
3. **No Redundant Data Duplication**:
   - We do not duplicate user profiles, vehicle records, or emergency contact lists into the QR sticker.
   - The vehicle emergency identity remains authoritative on `vehicles` and `emergency_profiles`; only the foreign key pointer in `qr_assignments` transitions.
4. **Ownership Verification Required**:
   - The requesting user must authoritatively own the vehicle to which the QR is currently assigned.
   - Supplying an arbitrary `oldQrStickerId` without vehicle ownership is rejected as an IDOR attempt.

---

## 2. Replacement Reasons

Replacements are restricted to a strictly controlled enum:
- `LOST`: Sticker was lost or detached from vehicle (triggers deactivation of old QR immediately upon approval).
- `DAMAGED`: Sticker is scratched, weathered, or unreadable.
- `PRINT_DEFECT`: Factory manufacturing or print defect.
- `DELIVERY_DAMAGE`: Damaged during parcel transit.
- `OTHER`: Exceptional operational circumstances requiring review.

---

## 3. Commercial & Payment Boundary

- If a replacement fee is required by business policy, the commercial transaction is managed exclusively by **Phase 10 Commerce**:
  ```
  REPLACEMENT_REQUEST (APPROVED)
          │
          ▼
  CREATE ORDER (Replacement Fee Product)
          │
          ▼
  PAYMENT_CONFIRMED
          │
          ▼
  ALLOCATE NEW PHYSICAL QR
  ```
- Free warranty replacements (e.g. `PRINT_DEFECT` or `DELIVERY_DAMAGE`) bypass payment and proceed directly to allocation.
