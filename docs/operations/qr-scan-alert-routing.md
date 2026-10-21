# Parking and emergency WhatsApp routing

For this feature the user explicitly approved retaining the existing Supabase
relational service with Cloudflare. Reports keep the existing Turnstile
verification, private R2 photo storage, entitlement checks and durable outbox.

Scanning alone records the ordinary scan notice. The finder must choose a
situation, consent and submit the protected report to send a parking or emergency
report. The entry page offers separate parking and accident actions.

| Report                                 | Owner                                                    | Emergency contacts                                                                |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Parking, lights, damage, other concern | Existing report alert, respecting saved channel settings | None                                                                              |
| Accident or emergency (`EMERGENCY`)    | Existing emergency report alert                          | WhatsApp to enabled contacts with `allow_message=1` on the active vehicle profile |

Contact destinations come from the database. The browser cannot supply them.
Emergency reports have their own cooldown, so a recent parking report does not
prevent an accident report. Repeat emergency reports still face the five-minute
QR cooldown and existing per-IP limits.
Duplicate contact numbers and the owner's number are excluded. Each report and
contact phone has a unique outbox dedupe key and a separately tracked delivery.
Current ownership, QR state, required entitlements, contact permission and the
original phone snapshot are checked again before delivery. Unsent contact alerts
expire after 15 minutes to avoid sending obsolete emergency information. Changing
or deleting a contact prevents subsequent attempts without deleting audit history.
Account notification preferences apply to the owner's alert; contact permission
applies independently to each emergency contact's WhatsApp alert.

On reports without viewer consent, contacts receive the masked vehicle reference, finder-reported situation, time
and optional finder-shared location. They receive no owner session, medical data,
private photo link or access to the owner's authenticated report. Photos and notes
remain in the owner's private report. Consent copy explains this distinction.

New reports with explicit viewer consent can include a private report-viewer link
that expires after 24 hours. It exposes the shared photos, note and location for
that report only, and the owner can revoke access earlier. See
[the viewer application](../../apps/view/README.md) for the current implementation.

The existing one-minute scheduler drains the outbox. MSG91 acceptance is tracked
as processing; authenticated delivery callbacks determine delivery. Ambiguous
external attempts are quarantined rather than sent twice.

## Release status, 21 October 2026

- Applied and recorded migration `20261021070842_qr_scan_report_emergency_contacts.sql`
  on the configured Supabase project. No historical contact alerts were backfilled.
- Verified MSG91 approval for `vhn_emergency_contact_report_v1` and all three
  report-viewer v2 templates. Approval remains checked during dispatch.
- Applied the versioned report-viewer migration. New consented reports can issue
  per-recipient, revocable links with a maximum 24-hour lifetime.
- QR, customer and viewer production deployments were verified ready on
  `60b4c69`; `view.vaahansafe.com` has valid domain configuration. The viewer
  serves from Cloudflare through the Vercel domain-routing project.
- The customer runtime uses `claim_notification_batch_v2` and refreshes all six
  report-template approval states. Older runtimes cannot claim contact intents.
- Cloudflare's existing Turnstile and private R2 integrations are reused. No new
  database, bucket or queue is required for this feature.

## Verification and rollout

Before deploying both applications, run their TypeScript checks, the focused QR
and notification tests, and the QR production build. The migration is already
applied; do not apply it twice.

```powershell
node tooling/scripts/verify-qr-alert-routing.mjs
node tooling/scripts/configure-emergency-contact-template.mjs --sync
node tooling/scripts/audit-qr-alert-routing.mjs
```

The PostgreSQL verification modifies existing real records only inside a
rollback-only transaction. It tests parking isolation, contact deduplication,
current permissions, expiry, entitlements, approval gating, legacy-worker
isolation, trusted destinations, separate emergency cooldown and duplicate delivery claims. It invokes no
message provider, and concurrent dispatchers cannot see its changes.

The full Supabase security advisor could not run with the configured CLI account
(HTTP 403). Direct privilege checks confirmed that the report tables have RLS and
that new routing RPCs are inaccessible to `anon` and `authenticated`.

After application deployment and provider approval, validate an explicitly
authorized real parking report and a real emergency report with consenting
recipients, including actual MSG91 delivery callbacks. No live test messages were
sent during implementation.

Local validation: 145 targeted QR/notification tests, the QR and customer
TypeScript checks, focused report UI/API lint, and the QR production build passed.
The build reports an existing camera-scanner hook dependency warning outside the
modified report flow.

Reference: [MSG91 template API](https://docs.msg91.com/en/whatsapp/template-bulk),
[Supabase function privileges](https://supabase.com/docs/guides/database/functions).
