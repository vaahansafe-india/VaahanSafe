# VaahanSafe Physical Fulfilment Architecture

## 1. Core Architectural Axioms

VaahanSafe enforces strict domain separation across commercial, logistics, inventory, and vehicle identity subsystems:

```
COMMERCE                LOGISTICS                INVENTORY & IDENTIFICATION
========                =========                ==========================
  ORDER  ──(authoritative)──►  FULFILMENT  ──►  QR RESERVATION  ──►  QR STICKER
    │                                                   ▲
    ▼                                                   │
 PAYMENT (Cashfree)                                REPLACEMENT
                                                        │
                                                        ▼
                                                  VEHICLE ASSIGNMENT
```

### Strict Separation Rules:
1. **`Order ≠ Payment`**: An order captures commercial intent; payment captures authoritative financial settlement.
2. **`Payment ≠ Fulfilment`**: Confirmed payment creates fulfilment intent; fulfilment tracks physical warehouse packing and courier dispatch.
3. **`Fulfilment ≠ Shipment`**: Fulfilment tracks the operational completion of the physical order; shipment tracks the real-world transit of the physical parcel with a courier provider.
4. **`Shipment ≠ QR Activation`**: Delivery confirmation by a carrier (`DELIVERED`) **NEVER** activates the QR sticker. Activation remains governed by customer scratch-off verification (Phase 08).
5. **`Reservation ≠ Activation`**: Reserving a physical sticker for an online order does not activate the QR code.
6. **`Physical Purchase Uses Pre-Generated QR Inventory`**: Online purchases allocate stickers from the **same pre-generated Phase 08 inventory pool** (`qr_stickers`). There is **NO** separate `online_qr_stickers` table.

---

## 2. Two Acquisition Channels, One QR Infrastructure

```
OFFLINE ACQUISITION
===================
Admin Manufacturing Export (Phase 08)
       │
       ▼
Distributor Inventory (`WITH_DISTRIBUTOR`)
       │
       ▼
Retailer Counter (`WITH_RETAILER`)
       │
       ▼
Customer Buys Package in Store
       │
       ▼
Scratch & Scan Activation (Phase 08)
       │
       ▼
Authoritative `qr_stickers` (ACTIVATED) + `qr_assignments` (INITIAL)


ONLINE PHYSICAL PURCHASE
========================
Customer Orders on Web / App (Phase 10)
       │
       ▼
Authoritative Payment Confirmation (`PAID`)
       │
       ▼
Idempotent Fulfilment Creation (`fulfilments`)
       │
       ▼
Race-Safe Physical QR Reservation (`qr_reservations`)
       │
       ▼
Warehouse Packing (Zero Plaintext Scratch Secret Exposure)
       │
       ▼
Courier Shipment & Tracking (`shipments`)
       │
       ▼
Delivery to Customer Address (`DELIVERED`)
       │
       ▼
Scratch & Scan Activation (Phase 08)
       │
       ▼
Authoritative `qr_stickers` (ACTIVATED) + `qr_assignments` (INITIAL)
```

Both offline retail distribution and online e-commerce converge on the identical underlying database entities:
- `qr_stickers`
- `qr_assignments`
- `qr_status_history`
- `emergency_profiles`

---

## 3. Shipping & Fulfilment Boundary

```
packages/shipping/
├── src/
│   ├── fulfilment/        # Fulfilment entity, types, status, and transition policy
│   ├── allocation/        # Reservation model, eligibility policy, race-safe reserve/allocate
│   ├── shipments/         # Shipment entity, status, transition policy, and event normalizer
│   ├── replacements/      # Replacement request entity, eligibility, and atomic migration service
│   ├── ports/             # Abstract ports (Repositories, QrInventoryPort, ShippingProvider)
│   ├── errors/            # Normalized domain errors
│   └── index.ts           # Unified public package exports
```

The shipping package does not couple to specific courier SDKs, does not import MSG91 or email clients directly, and is **completely decoupled** from the public QR emergency resolver path (`qr.vaahansafe.com`).
