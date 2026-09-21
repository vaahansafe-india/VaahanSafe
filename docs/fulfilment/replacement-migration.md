# Controlled QR Assignment Migration Service

## 1. Migration Protocol

The migration service (`executeAssignmentMigration`) executes the atomic transition between the old physical sticker and the new replacement sticker.

```
OLD STICKER (qr_active_001)                     NEW STICKER (qr_printed_002)
===========================                     ============================
Status: ACTIVATED                               Status: PRINTED
Assignment: ACTIVE (veh_demo_car)               Assignment: NONE
                   │                                          │
                   ▼                                          ▼
   1. Locate Active Assignment for Old QR (Verify Vehicle Ownership)
   2. Close Old Assignment (ended_at = NOW, end_reason = 'REPLACED')
   3. Create New Assignment (assignment_type = 'REPLACEMENT', vehicle_id = veh_demo_car)
   4. Transition Old QR status to 'REPLACED' (or 'LOST_DAMAGED')
   5. Set old_qr.replaced_by_qr_id = new_qr.id
   6. Record Immutable Audit Link in `sticker_replacements`
   7. Record QR Status History for Both Units
                   │                                          │
                   ▼                                          ▼
Status: REPLACED                                Status: ACTIVATED / ASSIGNED
Assignment: HISTORICAL (Ended)                  Assignment: CURRENT (Active)
Resolver: Safe REPLACED State                   Resolver: Active Emergency Profile
```

---

## 2. Resolver Security Behavior

### Old QR Resolver:
When a bystander or finder scans the **old physical QR** (`qr.vaahansafe.com/{oldPublicId}`):
- The resolver identifies that the sticker's status is `REPLACED`.
- It returns:
  ```json
  {
    "state": "REPLACED",
    "publicId": "7F3K9021",
    "visibleCode": "VS-7F3K-9021"
  }
  ```
- **Zero stale emergency contacts** are exposed.
- **Zero medical notes** are exposed.
- Safe customer guidance is rendered: "This QR sticker has been replaced with a newer sticker and is no longer active for vehicle safety."

### New QR Resolver:
Scanning the **new physical QR** resolves directly to the active emergency profile of `veh_demo_car`.

---

## 3. Preservation of Historical Data

- The old QR record in `qr_stickers` is **never deleted**.
- Historical assignment records in `qr_assignments` retain full audit trails (`assigned_at`, `ended_at`, `end_reason`).
- The `sticker_replacements` table guarantees bidirectional traceability between old and new stickers.
