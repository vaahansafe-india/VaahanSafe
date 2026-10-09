# WhatsApp notification delivery

Supabase owns business data and the notification outbox. A service-only PostgreSQL trigger creates each canonical intent alongside the originating write. Vercel's customer app processes bounded batches outside database locks. Cloudflare remains monitoring/storage infrastructure. Authentication OTP uses its existing separate MSG91 widget flow.

## Approved template contracts

Live MSG91 approval was inspected on 9 October 2026. The rejected `vhn_security_passcode_v1` is excluded.

| Template | Business gate |
| --- | --- |
| `vhn_welcome_v1` | First server-verified mobile |
| `vhn_qr_activated_v1` | Owned activated QR with enabled, verified safety entitlement |
| `vhn_qr_scan_notice_v2` | Authorized active resolver telemetry; one event per QR/15-minute bucket |
| `vhn_payment_success_v1` | Confirmed provider payment matching owned order amount/currency |
| `vhn_shipment_update_v1` | Recorded shipment state transition |
| `vhn_sub_renewed_v1` | Confirmed matching PLAN payment and extended paid period |
| `vhn_sub_failed_v1` | Linked failed PLAN payment and past-due transition |
| `vhn_replace_approved_v1` | Approved replacement reaches shipped/completed state |
| `vhn_security_alert_v1` | Verified account contact changes; original verified destination snapshot |
| `vhn_support_update_v1` | Admin case linked to a real customer; case status changes |

Channel preferences and verified recipient contacts are loaded in the batch claim. Mandatory security channels remain enforced. No historical notifications are backfilled. Optional account/commerce/subscription/support WhatsApp channels require the saved settings opt-in. Safety and fulfilment defaults match the existing settings screen.

## Release sequence

1. Apply these versioned migrations in order and record them in `supabase_migrations.schema_migrations`: `20261009054850`, `20261009055600`, `20261009060509`. The SQL was compiled and its state machine exercised on real PostgreSQL in rollback-only transactions.
2. Configure customer-app server environment: existing MSG91 key, sender/namespace, independent random `MSG91_WEBHOOK_SECRET` and `NOTIFICATION_DISPATCH_SECRET`, and `NOTIFICATION_DISPATCH_ENABLED=false`. Never use `NEXT_PUBLIC_*` for secrets. Production region retains the existing MSG91-compatible region.
3. Deploy reviewed code. Verify unauthenticated scheduler and callback requests return 401. A valid fresh HMAC request with delivery disabled returns 503 without contacting providers.
4. Register an enabled MSG91 **On Outbound Report Received** webhook, POST JSON, at `https://app.vaahansafe.com/api/webhooks/msg91`. Header: `x-vaahansafe-webhook-secret` equals the private server environment value. Send only this body:

```json
{"crqid":"{{crqid}}","requestId":"{{requestId}}","eventName":"{{eventName}}","integratedNumber":"{{integratedNumber}}","ts":"{{ts}}"}
```

5. Store the dispatch key under `vaahansafe_notification_dispatch_secret` in Supabase Vault, then schedule `SELECT public.request_notification_drain();` every minute using Supabase Cron. Confirm the key never appears in migration files, logs or cron commands. `pg_net` headers contain only a timestamp and a short-lived HMAC proof, because its request queue is readable by database roles.
6. Enable dispatch after an empty-queue check and an authorized owner-only delivery test. Confirm actual provider callback correlation before claiming delivered status. Inspect failures and pending callbacks using the SQL below.

## Delivery semantics and operation

- Claims use `FOR UPDATE SKIP LOCKED` and an expiring lease. Unique event and intent/channel constraints prevent duplicate creation and sends. In-app rows are idempotent.
- Provider acceptance remains `PROCESSING`. Only the authenticated MSG91 delivery/read report confirms WhatsApp `DELIVERED`. OTP and unrelated campaign reports are acknowledged without modifying authentication state.
- Explicit temporary provider rejection retries at most three times with backoff. A transport timeout/crash is `DEAD_LETTERED` with an unknown-outcome code; review provider logs before any manual resend. No automatic SMS fallback or duplicate send occurs.
- No OTP, provider key, message body, private contact, medical or location field is included in the configured callback payload.
- Recurring billing and courier tracking remain dependent on real configured provider workflows; a template or database row does not create a financial agreement or a tracking event.

```sql
SELECT status, template_key, count(*) FROM public.notification_intents GROUP BY status, template_key;
SELECT channel, status, last_failure_code, count(*) FROM public.notification_deliveries GROUP BY channel, status, last_failure_code;
SELECT jobname, active FROM cron.job WHERE jobname='vaahansafe-notification-drain';
SELECT status, return_message, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

See [Supabase workflow audit](supabase-workflow-audit.md) for the 56-table source inventory and confirmed schema gaps repaired here. This implementation deliberately avoids customer-side bearer storage, synthetic business records and invented provider success.

References: [MSG91 callback format and retry behavior](https://msg91.com/help/webhook-new/how-to-receive-whatsapp-delivery-reports-via-webhook-new), [Supabase pg_net request-header exposure](https://supabase.com/docs/guides/troubleshooting/database-roles-can-read-request-headers-queued-by-pg_net-ad6357), [TanStack mutation invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations).
