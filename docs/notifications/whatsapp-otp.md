# WhatsApp verification

WhatsApp is the default OTP channel for customer sign-in, new account creation,
Google-first phone completion, retail activation, admin phone verification, and
the API. Web and QR entry points use the customer or activation authentication
flow; they do not expose a separate provider credential or account database.

The existing MSG91 widget uses the approved Authentication template
`vhn_auth_otp_v1` in English. Both `body_1` and `button_1` map to MSG91's OTP
variable. Its primary mobile channel is WhatsApp and its code length is six.
Provider fallback is off and there are no demo credentials.

Configure `MSG91_AUTH_KEY` and `MSG91_WHATSAPP_OTP_WIDGET_ID` on servers. The
widget ID must identify this WhatsApp-primary configuration. Neither the auth key,
OTP, provider request reference, nor verified access token is returned to the UI.
The SMS path remains separate and requires an actual approved
`MSG91_OTP_TEMPLATE_ID`; it is never an implicit delivery fallback.

Sending calls the provider's `widget/sendOtp` API. Supabase retains the channel and
provider request ID on a hashed, cookie-bound challenge. Verification
uses that server reference with `widget/verifyOtp`, then validates the returned
access token with `widget/verifyAccessToken`. The verified phone must exactly
match the reserved challenge. Invisible verification and ambiguous success
responses are rejected.

The provider widget requires a minimum fifteen-minute expiry. VaahanSafe enforces
a stricter five-minute expiry in Supabase before contacting the verification provider,
plus the existing shared send cooldown, phone/IP limits, five verification
attempts, and atomic single consumption. Migration `20261008205438_supabase_otp_challenges`
creates `auth_otp_requests` and four typed, server-only RPCs. RLS is enabled;
anonymous and authenticated browser roles cannot read the table or call the RPCs.
Functions use `SECURITY INVOKER` and are granted only to `service_role`.
Transaction advisory locks serialize phone/IP reservations across all surfaces.
Configure the same `OTP_REQUEST_HASH_SECRET` in each server app; it keeps abuse
limits consistent without sharing or changing session signing secrets.

The owner requested Supabase for authentication persistence on 9 October 2026,
overriding the older Cloudflare-only repository instruction. OTP sends and
verification no longer call Cloudflare D1. Cloudflare monitoring and storage
configuration is independent of authentication.

As of 9 October 2026, the MSG91 widget mapping is saved and local configuration is
updated. All 41 focused OTP checks and customer, activation, admin, and API
production builds pass. A real server send test initially reached MSG91 but was
rejected with `Invalid Captcha Token`, because MSG91 documents widget CAPTCHA as
unsupported by its server OTP API. The owner explicitly approved disabling only
that widget CAPTCHA. After the saved change was independently verified, the
customer app returned HTTP 200 with a real MSG91 WhatsApp request recorded in D1.
The live customer verification request subsequently returned HTTP 200,
`success: true`, and issued the real `vs_session` cookie after MSG91 validated the
code and matching phone. Customer and activation Vercel projects now have the
widget ID configured for all environments. This validates the built local app
against the real production services; publishing the new source and checking the
deployed routes remain separate release steps. SMS is currently unavailable:
there is no configured valid SMS template ID and MSG91's SendOTP template list is
empty.

References: [OTP Widget API](https://docs.msg91.com/otp-widget),
[MSG91 integration guide](https://msg91.com/help/sendotp/how-to-integrate-the-new-login-with-otp-widget).
