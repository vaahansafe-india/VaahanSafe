# Return to Origin (RTO) Architecture & Quarantine Policy

## 1. RTO Lifecycle

```
SHIPPED ──► DELIVERY_FAILED ──► RTO ──► RECEIVED_RTO
```

- When a courier package cannot be delivered (customer unavailable, incorrect address, customer refused package), the courier updates status to `DELIVERY_FAILED`.
- After delivery attempts are exhausted, the courier marks the parcel `RTO` (or `RTO_INITIATED`).
- When the package arrives back at the VaahanSafe central warehouse, operations marks the parcel `RECEIVED_RTO` (or `RTO_DELIVERED`).

---

## 2. Invariant 19: Why RTO Stickers Cannot Auto-Restock

A returned package presents significant security, safety, and quality risks:
1. **Packaging Exposure**: The tamper-evident seal or cardboard sleeve may have been opened or damaged during transit.
2. **Scratch Layer Tampering**: The silver scratch-off layer protecting the QR activation secret could have been partially scratched, exposing the secret.
3. **Counterfeiting / Substitution**: A bad actor could swap out the authentic sticker for a malicious QR.
4. **Physical Weathering / Damage**: Bent corners, creased adhesive, or water damage may compromise vehicle adherence.

### Mandatory Operational Rule:
**Under NO circumstances does `RECEIVED_RTO` automatically return the allocated QR sticker to `PRINTED` / available inventory.**

```
RECEIVED_RTO
     │
     ▼
QUARANTINE / PHYSICAL INSPECTION
     │
     ├─► SCRATCH INTACT & SEAL VALID ──► Manual Restock (Signed Ops Override + Audit)
     │
     └─► DAMAGED / EXPOSED / TAMPERED ──► RETIRED / DESTROYED
```

The reservation remains `ALLOCATED` or transitions to `QUARANTINED` pending physical inspection by operations staff.
