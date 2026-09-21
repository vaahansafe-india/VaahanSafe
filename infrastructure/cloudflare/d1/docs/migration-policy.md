# VaahanSafe Database Architecture — Migration Policy & Lifecycle

This document governs the creation, review, testing, and execution of relational database schema migrations for **Cloudflare D1**.

---

## 1. Core Migration Principles

1. **Deterministic Sequential Ordering**:
   - Migrations follow strict lexicographical numbering: `0001_domain_description.sql`, `0002_...sql`.
   - Never use arbitrary names like `fix.sql`, `new.sql`, or `final.sql`.
2. **Immutability Invariant**:
   - Once a migration has been applied to any non-local environment (`development`, `staging`, or `production`), **it must NEVER be modified**.
   - Any correction, column addition, or index adjustment must be introduced as a new forward migration (e.g. `0004_fix_...sql`).
3. **Engine Compatibility**:
   - All migration SQL must adhere strictly to Cloudflare D1 / SQLite syntax.
   - Do NOT introduce PostgreSQL, MySQL, or unsupported dialect-specific keywords.
4. **Zero Production Mutation by Default**:
   - Local developer commands (`npm run dev`) must NEVER execute migrations against staging or production.
   - Production migrations require explicit flags, authentication, and operator review.

---

## 2. Environment Rollout Workflow

```
[Local Development]
  └─ Apply fresh SQLite / D1 local emulation
  └─ Run db:check and automated test suites
       ↓
[Pull Request / CI]
  └─ Automated migration from zero on clean SQLite instance
  └─ Security lint checks (zero plaintext secrets, zero REAL/FLOAT money)
       ↓
[Development Environment]
  └─ Apply migration to vaahansafe-dev-db
  └─ Run synthetic integration test
       ↓
[Staging Environment]
  └─ Apply migration to vaahansafe-staging-db
  └─ Verify full end-to-end regression and smoke tests
       ↓
[Production Gate (Explicit Approval Required)]
  └─ Verify backup / disaster recovery point
  └─ Operator executes guarded command:
     wrangler d1 migrations apply vaahansafe-prod-db --remote
```

---

## 3. Migration Immutability & Emergency Forward Fixes

If a migration contains a bug or omission after merging:
1. **DO NOT** edit the existing SQL file in `database/migrations/`.
2. Create the next sequential migration (e.g., `0004_patch_vehicle_indexes.sql`).
3. Apply the patch through the standard local -> staging -> production pipeline.
4. Record the incident in the system audit log.

---

## 4. Prohibited Schema Patterns (Automated Security Lints)

The following will immediately fail automated CI checks (`npm run db:check`):
1. **Plaintext Secrets**: Any column containing `scratch_code`, `activation_secret_plaintext`, `password_plaintext`, `otp`, `card_number`, or `cvv`.
2. **Float / Real Monetary Values**: Any column storing currency values as `REAL` or `FLOAT`. All money must be stored as integer minor units (paise for INR).
3. **Database Triggers for Business Magic**: Opaque state transitions hidden in SQLite triggers. Business orchestration belongs to domain services.
