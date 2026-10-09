# Razorpay checkout and confirmation

VaahanSafe uses Razorpay for new QR purchases. Existing Cashfree records and its historical webhook handling are retained. Payment persistence uses the existing authoritative database factory, configured with Supabase in production.

## Server configuration

Configure `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_MODE=live`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in the customer server environment. The standalone API deployment needs the same settings if used for checkout. Secrets must never use `NEXT_PUBLIC_*`, enter source control, or be included in client bundles. The public checkout key ID is returned only with an authenticated server-created order.

Production customer variables were saved in Vercel. Preview environments deliberately do not use the live key. Missing provider configuration returns a recoverable error rather than a simulated order.

## Confirmation boundary

Checkout resolves an active catalog product and its INR price on the server, verifies the account's mobile and vehicle ownership, and records the provider order reference. Missing catalog data cannot create a fallback product. The browser callback verifies its signature and provider payment details but never marks an order paid. The return page only reads the authenticated owner's stored order status.

The webhook at `https://app.vaahansafe.com/api/webhooks/razorpay` accepts `payment.captured`, `order.paid`, and `payment.failed`. It verifies HMAC-SHA256 over the original request body, resolves the stored Razorpay order, and compares currency and amount against both payment and order. Financial writes and event acknowledgement commit in one database batch. Duplicate event IDs are idempotent, provider references are unique, and cancelled/refunded records do not regress.

A captured payment marks an eligible order paid. It does not allocate inventory, create a subscription, expose a Digital QR, or activate QR services. Existing fulfillment and activation workflows must satisfy their independent ownership and entitlement gates.

## Validation and rollout

- Focused signature, fail-closed configuration, mismatched payment, replay, malformed event, and storage outage tests.
- Payment package TypeScript validation and customer/API production builds.
- Read-only live Razorpay authentication succeeded; no charge or refund was initiated.
- Supabase uniqueness migration `20261009044537_razorpay_payment_integrity.sql` applied and recorded after duplicate-reference audit.
- Actual generated payment statements validated against PostgreSQL in a rollback-only transaction, including duplicate replay and cancelled/refunded states.

Production rollout requires merging the reviewed source, verifying the deployed webhook rejects unsigned requests, and registering the live webhook with the configured secret and three events. Until registration succeeds, this integration is not ready to accept live payments. A real purchase and captured webhook remain an owner-operated acceptance check.
