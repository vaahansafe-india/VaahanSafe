# MSG91 integration and live audit

Audited on 6 October 2026 in the logged-in VaahanSafe MSG91 account. No customer messages were sent. Integration code has been validated in the workspace; application builds have not been deployed.

## Live provider findings

The WhatsApp sender is `918639785897`, with namespace `28fc896d_7967_4778_9854_11a598207d4e`. Enabled and approved are separate provider states.

| Domain event | Provider template | Language | Ordered body variables |
| --- | --- | --- | --- |
| Account welcome | `vhn_welcome_v1` | en | display name |
| Completed QR activation | `vhn_qr_activated_v1` | en_US | VaahanSafe ID, masked vehicle registration |
| Verified payment | `vhn_payment_success_v1` | en | amount, order number |
| Shipment update | `vhn_shipment_update_v1` | en | status, tracking reference |
| Subscription renewed | `vhn_sub_renewed_v1` | en | plan, next billing date |
| Subscription renewal failed | `vhn_sub_failed_v1` | en | plan |
| Approved replacement | `vhn_replace_approved_v1` | en | original VaahanSafe ID |
| Account security change | `vhn_security_alert_v1` | en | change, occurrence time |
| Support update | `vhn_support_update_v1` | en | ticket reference, status |
| Scan notice | `vhn_qr_scan_notice_v2` | en_US | masked vehicle registration, scan time |

The first nine templates were approved at audit time. The scan notice v2 was created in MSG91 and is **pending review**. It removes v1's unsupported claim that contacts have been notified. V1 is excluded from the sender allowlist. Until v2 is approved and added to the catalog, WhatsApp scan notices fail closed; the public safety page and in-app channel remain independent.

The existing `vhn_security_passcode_v1` has a rejection indicator and category Utility. Attempting to create `vhn_auth_otp_v1` as Authentication, with Copy code, a security recommendation and five-minute expiry, returned **Error while creation**. No successful Authentication template creation was verified.

SendOTP has **no template** and the SMS sender selector has **no registered sender**. Production SMS requires the user's approved DLT sender, DLT template ID, exact approved content and the corresponding real MSG91 OTP template ID. Do not substitute the WhatsApp name for the SMS template ID.

## Server behavior

- `Msg91OtpAdapter` uses MSG91-generated and MSG91-verified SMS OTPs. It never generates codes, uses a security-alert template for OTPs, accepts test keys, or switches delivery channels implicitly.
- WhatsApp OTP stays unavailable until a real provider-owned MSG91 OTP Widget send/verify flow is configured and verified. A WhatsApp template alone is insufficient. The provider documents request-ID based verification and access-token validation.
- Customer, activation, API and admin OTP routes share D1 reservations, a 60-second phone cooldown, five sends per phone per fifteen minutes, twenty sends per trusted Cloudflare IP per fifteen minutes, five verification attempts and a five-minute expiry.
- A random, host-scoped HttpOnly cookie binds each challenge to its phone and surface. D1 stores HMAC hashes of token, phone and IP; no plaintext OTP, phone or IP is saved in the new table. Atomic conditional writes protect concurrent sends and verification. Already consumed challenges cannot be reused.
- `OTP_REQUEST_HASH_SECRET` must be the same server-side secret across surfaces to share phone/IP limits. Keep it stable for existing requests. `SESSION_SECRET` is a compatibility fallback.
- New OTP state uses `getCloudflareDatabaseClient`, explicitly excluding alternate database adapters. The versioned `0017_auth_otp_requests.sql` migration was applied successfully to production D1 and mirrored in both migration directories.
- Unavailable methods return HTTP 503 and calm, actionable copy. The UI checks server availability, defaults to SMS, shows unavailable methods clearly and offers Check again. Provider acceptance is required before advancing to code entry.
- WhatsApp sends require configured auth key, actual sender and namespace, an allowed template, exact language and only approved positional components. Rejected or ambiguous responses never create a success reference. HTTP 429/5xx and transport failures are retryable; configuration/template failures are permanent.
- OTP is excluded from the persistent notification-template registry. SMTP without credentials now returns a real configuration failure instead of simulated success.

## QR/API notification boundary

The emergency API now persists `EMERGENCY_SCAN_ALERT_V1` with masked variables and a real Cloudflare Queue producer. Missing queue bindings leave a recoverable PENDING intent instead of falsely recording PROCESSED. API success reports that an alert was recorded and separately reports whether it was queued. The public QR renderer receives no provider credentials and must remain independent of MSG91 availability.

Notification templates cannot grant payment, QR or subscription entitlements. Create payment notices only after authoritative payment verification. Activation notices require completed binding and entitlement; subscription notices require an actual plan transition. The existing replacement and subscription copy makes additional fulfilment/coverage claims; their producers must establish these facts before dispatch.

## Configuration and release requirements

Server-only variables:

```dotenv
MSG91_AUTH_KEY=<existing server-side auth key>
MSG91_OTP_TEMPLATE_ID=<actual approved SendOTP template ID>
MSG91_WHATSAPP_NUMBER=918639785897
MSG91_WHATSAPP_NAMESPACE=28fc896d_7967_4778_9854_11a598207d4e
OTP_REQUEST_HASH_SECRET=<shared stable server-side HMAC secret>
```

Real configured credentials and audited sender/namespace were synchronized to the local server environments for customer, activation, admin and API. No secrets were put in client configuration or this document. Configure production secrets in the actual deployment environment; local `.env` changes do not update deployed Workers.

After Meta approves scan notice v2, inspect its provider code and add its exact `en_US`, two-body-variable contract to `MSG91_TEMPLATE_CATALOG`. Do not mark pending or rejected templates approved based on the Enabled toggle.

The repository still contains pre-existing Supabase-backed customer/admin session and QR resolver paths, and no production notification consumer wiring was verified in this task. This work does not migrate those records or claim that every workflow is Cloudflare-only. A deployment must reconcile those existing paths with the repository's Cloudflare-only policy and verify the real queue consumer before calling the whole platform integrated.

No live OTP or delivery test was run because the necessary approved OTP resources are absent. The provider blockers must be resolved before a real phone-based acceptance test and application release.

## Official provider references

- [MSG91 WhatsApp OTP and authentication template contract](https://msg91.com/help/whatsapp/whatsapp-otp)
- [MSG91 OTP send and verify APIs](https://docs.msg91.com/otp)
- [MSG91 OTP Widget request-ID and token verification flow](https://docs.msg91.com/otp-widget)

Template submission evidence: `output/msg91/template-review.jpg`.
