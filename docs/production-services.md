# Production service responsibilities

VaahanSafe application servers run on Vercel. Supabase PostgreSQL is the source
of truth for accounts, sessions, OTP challenges, vehicles, QR ownership and
entitlements, orders, payments, notification records, and media metadata.

Cloudflare provides R2 object storage and uptime/latency monitoring. Monitoring
may retain telemetry in its existing Cloudflare resources; those records are not
the application's account or business database. Application authentication does
not require Cloudflare Turnstile or a D1 binding.

MSG91 generates, delivers, and verifies WhatsApp OTP codes. Admin verification
requires an active authenticated admin session, the configured same-origin
check, and the existing Supabase reservation and verification functions. These
enforce account request limits, phone/IP limits, a one-minute resend cooldown,
five-minute challenge expiry, and at most five verification attempts. A phone
becomes verified only after MSG91 confirms the matching server-owned challenge.

Missing Supabase credentials cause a recoverable service failure. Application
servers never choose Cloudflare D1 as a fallback database or use memory storage
as production object storage. Legacy repository names containing `D1` can still
operate through the Supabase adapter; their name does not select the database.

Existing legacy migration files are retained as history. Do not reintroduce the
older Cloudflare database or Turnstile requirements into application sign-in.
