BEGIN;
-- Existing historical Cashfree rows are preserved. These constraints protect Razorpay ownership and replay boundaries.
CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpay_order_unique
  ON public.payments(provider_order_id) WHERE provider = 'RAZORPAY' AND provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payments_razorpay_payment_unique
  ON public.payments(provider_payment_id) WHERE provider = 'RAZORPAY' AND provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_webhooks_razorpay_event_unique
  ON public.payment_webhook_events(provider_event_id) WHERE provider = 'RAZORPAY' AND provider_event_id IS NOT NULL;
COMMIT;
