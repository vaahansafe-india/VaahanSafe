# Payment, notification and analytics monitoring

The Cloudflare `vaahansafe-supabase-keepalive` Worker runs every ten minutes. It records measured service results in the existing D1 `status_probe_samples` table. Business records remain in the existing production database; these probes never change payment, order, entitlement or notification state.

Payments: authenticate a read-only live Razorpay orders request; discard its response records; check webhook backlog and confirmed-payment integrity with fixed aggregate SQL; check that the production callback route is reachable using HEAD. Pending checkout orders are not treated as outages.

Notifications: read MSG91 approval for the scan, vehicle report and emergency report templates using the shared template catalog (including `en_US`); check the active minute scheduler, a recent successful drain-shaped HTTP response, overdue pending or leased outbox work, attempts without a provider acceptance reference after ten minutes, and permanent delivery failures within 24 hours. Provider-accepted WhatsApp and SMTP sends can remain PROCESSING; missing delivery receipts alone do not degrade service availability. WhatsApp receipts pending beyond one hour are a separate read-only diagnostic, not a confirmed failed send. Business delivery records are never promoted to DELIVERED by monitoring. The HTTP response check matches the drain's response shape; pg_net does not retain response request URLs.

No order creation, payment attempt, message send, replay, backfill or public trigger is used. Only Cron calls providers. GET/HEAD `/services/payments` and `/services/notifications` read the latest saved D1 result. Public JSON contains only service, status, checkedAt and latencyMs. Missing or older-than-25-minute samples return UNKNOWN with HTTP 503; operational samples return 200; degraded/down results return 503. There is no fabricated uptime before checks were configured.

Customer Analytics is a separate capability in the existing status catalog (D1 migration `0019_status_analytics_monitor.sql`, mirrored in both migration directories). `/services/customer-analytics` projects the same saved-check fields. The scheduled query exercises scan reporting joins, document storage original sizes/types and document event joins using at most 100 rows per source, and checks the session ownership function exists. Empty sources are valid. No customer identity, document title, location or scan payload is returned. This establishes query availability, not correctness of every dashboard chart or a user's authenticated session.

## Localhost and Vercel

Run `npm run dev --workspace=@vaahansafe/status` and open http://localhost:3007. The prepared local environment points to the real Cloudflare capability endpoints.

Vercel deployment is intentionally pending. Import the three non-secret values from `apps/status/vercel.monitoring.env.example` into the existing status project's Production environment (and Preview if needed), then deploy the current status app with root directory `apps/status`. Keep its existing Cloudflare and Supabase environment settings. Provider secrets belong only to the Worker, never to the public status app. The updated app uses the scheduled measurement time/latency and preserves stale/unknown/down states.

`node tooling/scripts/configure-service-monitoring.mjs` prepares these settings locally. Add `--apply` to securely copy existing configured production credentials into Worker secrets and deploy the Worker. It preserves other secrets and remote variables. No credentials are exported to the Vercel example file.

For the analytics rollout, `--analytics-catalog` applies the versioned metadata migration idempotently. `--deploy-only` preserves the already provisioned secrets.

`node tooling/scripts/verify-service-monitoring.mjs` verifies real aggregate SQL and public projections. Add `--record` for a one-time execution of the exact scheduled probes, storing only real measured telemetry in D1. `node tooling/scripts/audit-service-monitoring.mjs --pipeline` reads aggregate processing states for diagnosis without printing customer payloads or credentials.

Checks establish provider access and processing health, not completion of every individual payment or delivery. Monitoring does not create incidents or send operational alert messages automatically. Probe target URLs stay server-side: they are omitted from the public status DTO, JSON and service detail panel.

`node tooling/scripts/audit-service-monitoring.mjs --notification-readiness` reads aggregate acceptance and attempt counts and verifies the existing Nodemailer SMTP connection/authentication without sending messages. This one-time SMTP check is separate from scheduled monitoring, which reads persisted email outcomes. The public history percentage is the proportion of successful monitor checks, not a WhatsApp or email delivery rate. Daily bars retain earlier unsuccessful checks after a current recovery.

## Verification and initial monitor error

Run `node tooling/scripts/verify-monitor-runtime.mjs` to execute the probes in the installed Cloudflare runtime against real read-only services. This caught the runtime rejecting `redirect: "error"`, which Node-only tests had accepted. Provider requests now use `redirect: "manual"` and fail closed on any non-2xx response without forwarding credentials to a redirect destination. Initial failed monitor samples are retained as actual failed checks; they do not establish a customer payment outage. No history is rewritten to make observed success appear higher.
