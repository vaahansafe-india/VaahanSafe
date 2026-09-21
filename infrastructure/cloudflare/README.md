# Cloudflare Infrastructure Architecture — VaahanSafe

This directory contains deployment configuration standards, environment models, and resource topologies for deploying VaahanSafe to **Cloudflare Workers**.

---

## 1. Production Architecture Overview

The VaahanSafe platform runs on Cloudflare's global edge network:
- **Compute:** Cloudflare Workers (per-surface deployments using Next.js App Router)
- **Relational Persistence:** Cloudflare D1 (managed distributed SQLite)
- **Object Storage:** Cloudflare R2 (`PUBLIC_STORAGE`, `PRIVATE_STORAGE`, `EXPORT_STORAGE`)
- **Async Messaging:** Cloudflare Queues (`NOTIFICATION_QUEUE`, `ANALYTICS_QUEUE`, `COMMERCE_QUEUE`)
- **Abuse Protection:** Cloudflare Turnstile (server-verified smart challenge)
- **Edge Security:** DNS, WAF, SSL/TLS, and Web Analytics

---

## 2. Locked Logical Binding Contract

Application code interacts exclusively with these stable logical binding names:

| Binding Name | Resource Type | Purpose | Least-Privilege Surfaces |
|---|---|---|---|
| `DB` | Cloudflare D1 | Authoritative relational data | `qr`, `customer`, `activate`, `admin`, `api` |
| `PUBLIC_STORAGE` | Cloudflare R2 | Public vehicle assets & media | `web`, `blog`, `customer`, `admin`, `api` |
| `PRIVATE_STORAGE` | Cloudflare R2 | Private documents & invoices | `customer`, `admin`, `api` |
| `EXPORT_STORAGE` | Cloudflare R2 | Batch print files & audit exports | `admin`, `api` |
| `NOTIFICATION_QUEUE` | Cloudflare Queue | Asynchronous WhatsApp, SMS, email | `activate`, `admin`, `api` |
| `ANALYTICS_QUEUE` | Cloudflare Queue | Non-blocking scan event telemetry | `qr`, `admin`, `api` |
| `COMMERCE_QUEUE` | Cloudflare Queue | Post-payment fulfilment & orders | `customer`, `admin`, `api` |

---

## 3. Configuration Standards

1. **Format:** Surfaces configure deployment via `apps/<surface>/wrangler.jsonc`.
2. **Secrets:** Secret *values* never enter source control. Required secret *names* are declared in `wrangler.jsonc` and managed securely via Cloudflare dashboard or `wrangler secret put`.
3. **Local Secrets:** Local development uses `.dev.vars` (gitignored), templated by `.dev.vars.example`.
4. **Zero Fabricated IDs:** Configuration templates never invent database or bucket UUIDs.

---

## 4. Documentation Index

- [Resource Naming Standards](./resource-naming.md)
- [Environment Topology Matrix](./environment-matrix.md)
- [Surface-to-Binding Permission Matrix](./binding-matrix.md)
