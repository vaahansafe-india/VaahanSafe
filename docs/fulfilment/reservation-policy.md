# QR Reservation Policy & Concurrency Strategy

## 1. Reservation vs Allocation Lifecycle

```
RESERVED  ──(packing confirmed)──►  ALLOCATED  ──(cancelled/expired)──►  RELEASED
```

- **`RESERVED`**: A temporary claim placed on a printed physical QR sticker for an online order or approved replacement request.
- **`ALLOCATED`**: The sticker has been confirmed for packing and associated with an order item/fulfilment.
- **`RELEASED`**: The reservation was released (due to order cancellation or payment failure before irreversible packing), allowing the sticker to become available again.

---

## 2. Cloudflare D1 / SQLite Concurrency Strategy

In high-concurrency scenarios where multiple background workers or API requests attempt to reserve the same physical sticker, application-level checks (`SELECT ... then INSERT`) are vulnerable to race conditions.

To prevent double-reservation, VaahanSafe enforces **database-level partial unique indexes**:

```sql
-- Exactly ONE active reservation or allocation per physical QR sticker
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_reservations_active_qr 
    ON qr_reservations(qr_sticker_id) 
    WHERE status IN ('RESERVED', 'ALLOCATED');

-- Exactly ONE active reservation per fulfilment
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_reservations_active_fulfilment 
    ON qr_reservations(fulfilment_id) 
    WHERE status IN ('RESERVED', 'ALLOCATED');
```

### Race Scenario Proof:
1. Worker A and Worker B find eligible sticker `qr_123`.
2. Worker A executes `INSERT INTO qr_reservations ...` -> **Succeeds**.
3. Worker B executes `INSERT INTO qr_reservations ...` -> **SQLite rejects with `UNIQUE constraint failed: idx_qr_reservations_active_qr`**.
4. Worker B catches the error, retries eligibility query, and acquires the next unreserved sticker.

---

## 3. Reservation Idempotency

When a queue message retries (e.g. Cloudflare Queues at-least-once delivery):
1. `findActiveByFulfilmentId(fulfilmentId)` is executed first.
2. If an active reservation already exists for that fulfilment, it is reused.
3. No second physical QR is reserved or consumed.
