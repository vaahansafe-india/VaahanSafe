# Physical QR Allocation Policy

## 1. Single Inventory Source

All physical QR stickers fulfilling online orders originate strictly from Phase 08 manufacturing lots:

```
qr_batches (status = 'PRINTED')
     ↓
qr_stickers (status = 'PRINTED')
     ↓
Unreserved & Unassigned Warehouse Stock
     ↓
Online Order / Replacement Allocation
```

There is **NO** separate `online_qr_stickers` or `replacement_qr_inventory` table.

---

## 2. Centralized Eligibility Policy

A physical sticker in `qr_stickers` is eligible for online reservation if and only if:
1. `status = 'PRINTED'`
2. `current_distributor_id IS NULL` (not dispatched to offline distributors)
3. `current_retailer_id IS NULL` (not dispatched to retail counters)
4. `NOT EXISTS (SELECT 1 FROM qr_reservations WHERE qr_sticker_id = s.id AND status IN ('RESERVED', 'ALLOCATED'))`
5. `NOT EXISTS (SELECT 1 FROM qr_assignments WHERE qr_id = s.id AND ended_at IS NULL)`

```sql
SELECT s.id, s.public_id, s.visible_code, s.batch_id
FROM qr_stickers s
WHERE s.status = 'PRINTED'
  AND s.current_distributor_id IS NULL
  AND s.current_retailer_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM qr_reservations r 
    WHERE r.qr_sticker_id = s.id 
      AND r.status IN ('RESERVED', 'ALLOCATED')
  )
  AND NOT EXISTS (
    SELECT 1 FROM qr_assignments a 
    WHERE a.qr_id = s.id 
      AND a.ended_at IS NULL
  )
ORDER BY s.created_at ASC, s.id ASC
LIMIT 1;
```

---

## 3. Scratch Secret Security Invariant

Plaintext scratch codes exist only during initial factory manufacturing export (Phase 08).
- Shipping staff, warehouse packing staff, and backend fulfilment microservices have **ZERO access** to plaintext scratch secrets.
- The `QrInventoryPort` and database projection return only:
  ```typescript
  interface EligiblePhysicalQr {
    id: string;
    publicId: string;
    visibleCode: string;
    batchId: string;
  }
  ```
- No secret hash or scratch plaintext is ever queried or projected during packing, label printing, or shipment creation.
