# VaahanSafe Database Architecture (Cloudflare D1 + SQLite)

Authoritative relational system of record for the VaahanSafe vehicle safety and emergency identification platform.

---

## Directory Structure

```
database/
├── migrations/
│   ├── 0001_identity.sql              # Users, Auth Identities, Sessions, Addresses, Admin Users
│   ├── 0002_vehicle_emergency.sql     # Vehicles, Emergency Profiles, Emergency Contacts
│   └── 0003_qr_inventory.sql          # QR Batches, Stickers, Activation Secrets, Assignments
│
├── seeds/
│   └── dev.sql                        # Synthetic development seed data for local testing
│
├── docs/
│   ├── erd.md                         # Authoritative Mermaid ER Diagram
│   ├── data-dictionary.md             # Complete table-by-table field dictionary & privacy classes
│   ├── index-strategy.md              # Query-driven index specifications & EXPLAIN QUERY PLAN proof
│   └── migration-policy.md            # Immutability, forward fixes, and deployment safety rules
│
└── README.md
```

---

## Key Invariants

1. **D1 is Relational Truth**: R2 stores objects/blobs; D1 stores relational structure and metadata.
2. **One-Current-Assignment**: Enforced at the database engine level via SQLite partial unique indexes (`WHERE ended_at IS NULL`).
3. **Scratch Secret Security**: Zero plaintext scratch codes are stored in D1. Only cryptographic hashes with lockout counters are persisted.
4. **Public Projection Privacy**: Public QR lookup queries ONLY approved emergency projection fields. Customer account profile, email, private phone, and sessions are strictly excluded.
5. **Money Uses Minor Units**: Monetary values are stored as integer minor units (paise). `REAL` and `FLOAT` are strictly forbidden.

---

## Database Commands

```bash
# Validate migrations, foreign keys, and security lints against in-memory SQLite:
npm run db:check

# Apply migrations to local emulation:
npm run db:migrate:local

# Seed local database with synthetic test data:
npm run db:seed:dev
```
