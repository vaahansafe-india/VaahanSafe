# Environment Topology Matrix — VaahanSafe

VaahanSafe strictly isolates resources, data, and external provider modes across four tiers.

---

## 1. Environment Tier Matrix

| Environment | Purpose | Persistence (D1 / R2 / Queues) | External Providers (Cashfree, MSG91, Email) | Domains |
|---|---|---|---|---|
| **`local`** | Individual developer iteration | Local emulation (`wrangler dev` in-memory SQLite, local buckets) | Mock / Sandbox only. Zero real money or real SMS. | `localhost:3000`–`3007` |
| **`development`** | Shared engineering integration | Dedicated development Cloudflare resources (`vaahansafe-dev-*`) | Cashfree Sandbox, MSG91 Test-safe template, mock email. | Feature branch preview hostnames |
| **`staging`** | Production-like QA & pre-release | Dedicated staging Cloudflare resources (`vaahansafe-staging-*`) | Sandbox / Test provider credentials with production-like topology. | `staging.vaahansafe.com` (or preview aliases) |
| **`production`** | Real customer safety & operations | Production-only Cloudflare resources (`vaahansafe-prod-*`) | Cashfree Live, MSG91 Live, Production Transactional Email. | Owned hostnames (`vaahansafe.com`, `qr.vaahansafe.com`, etc.) |

---

## 2. Invariants & Security Guardrails

```
LOCAL       ───✖───>  PROD D1
DEVELOPMENT ───✖───>  PROD R2
STAGING     ───✖───>  PROD QUEUE
LOCAL       ───✖───>  LIVE CASHFREE
DEVELOPMENT ───✖───>  LIVE MSG91
STAGING     ───✖───>  REAL CUSTOMER DATA
```

1. **Provider Mode Isolation**:
   - In `local`, `development`, and `staging`, payment mode MUST be `mock` or `sandbox`. Attempting to load live payment credentials throws an immediate runtime configuration error.
   - In `production`, payment mode MUST be `live`.
2. **Secret Non-Inheritance**:
   - Wrangler environments do NOT inherit secrets across tiers. Staging and production credentials must be set independently using `wrangler secret put --env <environment>`.
3. **No Production Data in Staging**:
   - Staging uses synthetic vehicle profiles and test stickers. Real customer records, emergency contacts, or medical data must never be imported into staging databases.
