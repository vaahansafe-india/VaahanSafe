---
description: Mandatory infrastructure rule requiring Cloudflare D1, real services, and forbidding local SQLite, localStorage auth, and dummy data fallbacks
globs: "**/*"
alwaysApply: true
---

# VaahanSafe Infrastructure & Real Services Mandate

VaahanSafe is a production platform. All monorepo subsystems must follow:

`UI → SERVER/API → DOMAIN SERVICE → CLOUDFLARE (D1/R2/Queues) / REAL PROVIDERS → REAL DATA`

### Prohibited Across Monorepo:
- ❌ `localStorage`, `sessionStorage`, `IndexedDB` for auth, accounts, or business state
- ❌ Local SQLite (`better-sqlite3`, `sqlite3`, `*.db` files)
- ❌ Dummy accounts, mock users, or hardcoded OTPs (123456, etc.)
- ❌ Dummy fallbacks on service failure

### Required:
- ✅ Cloudflare D1 as the single source of truth for persistent data
- ✅ Proper D1 migrations for all schema evolution (`database/migrations`, `infrastructure/cloudflare/d1/migrations`)
- ✅ Real MSG91 OTP for mobile authentication
- ✅ Real Google OAuth 2.0 with server-side token validation
- ✅ Mandatory verified-mobile requirement for all accounts
- ✅ Server-managed `HttpOnly` session cookies (`vs_session`)
- ✅ Server-verified Cloudflare Turnstile tokens
- ✅ Calm, user-friendly error messages without internal stack trace leakage
