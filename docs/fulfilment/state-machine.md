# Fulfilment & Shipment State Machines

## 1. Fulfilment State Machine

Fulfilment tracks the internal warehouse, packing, and dispatch lifecycle of an order:

```
PAID
  │
  ▼
PROCESSING
  │
  ▼
PACKED
  │
  ▼
SHIPPED
  │
  ▼
OUT_FOR_DELIVERY ──► DELIVERY_FAILED
  │                         │
  │                         ▼
  │                        RTO
  │                         │
  │                         ▼
  ▼                    RECEIVED_RTO (Quarantined)
DELIVERED
```

### Transition Matrix:
| From State | Allowed Target States | Description |
| :--- | :--- | :--- |
| `PAID` | `PROCESSING`, `CANCELLED` | Order payment authoritatively confirmed; warehouse queuing begins. |
| `PROCESSING` | `PACKED`, `CANCELLED` | QR sticker reserved and physically pulled from warehouse shelf. |
| `PACKED` | `SHIPPED`, `CANCELLED` | Packaging complete, label applied, awaiting courier pickup. |
| `SHIPPED` | `OUT_FOR_DELIVERY`, `DELIVERED`, `DELIVERY_FAILED` | Carrier has physical custody of parcel in transit. |
| `OUT_FOR_DELIVERY` | `DELIVERED`, `DELIVERY_FAILED` | Courier delivery executive is attempting final handover. |
| `DELIVERY_FAILED` | `OUT_FOR_DELIVERY`, `RTO` | Handover failed; courier may re-attempt or initiate return. |
| `RTO` | `RECEIVED_RTO` | Package is moving back to VaahanSafe central warehouse. |
| `DELIVERED` | *(Terminal)* | Customer received package. Delivered $\neq$ Activated. |
| `RECEIVED_RTO` | *(Terminal Quarantine)* | Package returned to warehouse. Cannot be auto-restocked. |
| `CANCELLED` | *(Terminal)* | Pre-dispatch cancellation; active reservations released. |

### Forbidden Transitions:
- `PAID → DELIVERED`: Physical steps cannot be skipped.
- `PACKED → RECEIVED_RTO`: Package never left warehouse; cannot be RTO'd.
- `DELIVERED → PROCESSING`: Terminal delivery cannot be undone.
- `CANCELLED → PAID`: Cancelled fulfilments cannot be revived without a new order.

---

## 2. Shipment State Machine

Shipment tracks the external carrier transit status:

```
PENDING
  │
  ▼
MANIFESTED
  │
  ▼
PICKED_UP
  │
  ▼
IN_TRANSIT
  │
  ▼
OUT_FOR_DELIVERY ──► DELIVERY_FAILED
  │                         │
  │                         ▼
  │                    RTO_INITIATED
  │                         │
  ▼                         ▼
DELIVERED              RTO_DELIVERED
```

### Out-of-Order Delayed Webhook Protection:
Courier webhooks often arrive out of sequence (e.g. `OUT_FOR_DELIVERY` webhook delayed by network congestion arrives *after* `DELIVERED` webhook was already committed).
- When a shipment is in `DELIVERED` or `RTO_DELIVERED`, any incoming non-terminal event is marked as stale (`shouldIgnoreShipmentEvent() === true`) and silently ignored.
- Under no circumstances is a terminal delivery state downgraded back to `IN_TRANSIT` or `OUT_FOR_DELIVERY`.
