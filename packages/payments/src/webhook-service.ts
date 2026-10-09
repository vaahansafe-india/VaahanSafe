import { verifyRazorpayWebhookSignature } from "./signatures/razorpay-signatures";
import type { RazorpayWebhookPayload } from "./types";
interface PaymentStore {
  queryFirst<T>(sql: string, params?: unknown[]): Promise<T | null>;
  batch(operations: { sql: string; params?: unknown[] }[]): Promise<boolean>;
}
export class RazorpayWebhookError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
/** The webhook is financial authority. QR inventory/entitlements are a separate fulfillment gate. */
export async function processRazorpayWebhook(
  rawBody: string,
  signature: string,
  providerEventId: string | null,
  db: PaymentStore,
) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET)
    throw new RazorpayWebhookError(
      503,
      "Payment verification temporarily unavailable",
    );
  if (
    !(await verifyRazorpayWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET,
    ))
  )
    throw new RazorpayWebhookError(401, "Invalid signature");
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new RazorpayWebhookError(400, "Malformed payload");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.event !== "string"
  )
    throw new RazorpayWebhookError(400, "Malformed payload");
  if (
    !["payment.captured", "order.paid", "payment.failed"].includes(
      payload.event,
    )
  )
    return { received: true, ignored: true };
  const entity = payload.payload?.payment?.entity;
  const success = payload.event !== "payment.failed";
  if (
    !entity ||
    !/^pay_[A-Za-z0-9]+$/.test(entity.id) ||
    !/^order_[A-Za-z0-9]+$/.test(entity.order_id) ||
    !Number.isSafeInteger(entity.amount) ||
    entity.amount <= 0 ||
    entity.currency !== "INR" ||
    (success
      ? entity.status !== "captured" || entity.captured !== true
      : entity.status !== "failed")
  )
    throw new RazorpayWebhookError(400, "Invalid payment event");
  const payment = await db.queryFirst<{
    id: string;
    order_id: string;
    amount_minor: number;
    currency: string;
    total_minor: number;
    order_currency: string;
    status: string;
    order_status: string;
  }>(
    `SELECT p.id, p.order_id, p.amount_minor, p.currency, p.status, o.total_minor, o.currency AS order_currency, o.status AS order_status
     FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.provider = 'RAZORPAY' AND p.provider_order_id = ? LIMIT 1`,
    [entity.order_id],
  );
  if (!payment)
    throw new RazorpayWebhookError(503, "Payment reference not recorded yet");
  if (
    Number(payment.amount_minor) !== entity.amount ||
    Number(payment.total_minor) !== entity.amount ||
    payment.currency !== entity.currency ||
    payment.order_currency !== entity.currency
  )
    throw new RazorpayWebhookError(400, "Payment details do not match");
  const orderEntity = payload.payload?.order?.entity;
  if (
    orderEntity &&
    (orderEntity.id !== entity.order_id ||
      orderEntity.amount !== entity.amount ||
      orderEntity.currency !== entity.currency ||
      (success &&
        (orderEntity.status !== "paid" || orderEntity.amount_due !== 0)))
  )
    throw new RazorpayWebhookError(400, "Order details do not match");
  const eventKey = providerEventId || `${entity.id}:${payload.event}`;
  if (eventKey.length > 256 || !/^[A-Za-z0-9:_-]+$/.test(eventKey))
    throw new RazorpayWebhookError(400, "Invalid event reference");
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`RAZORPAY:${eventKey}`),
  );
  const eventId = `pwe_rzp_${Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("")}`;
  const now = new Date().toISOString();
  // Primary-key idempotency avoids treating a storage outage as a duplicate. All writes commit together.
  const eligible = `EXISTS (SELECT 1 FROM payment_webhook_events WHERE id = ? AND processing_status = 'RECEIVED')`;
  const complete = await db.batch([
    {
      sql: `INSERT INTO payment_webhook_events (id, provider, provider_event_id, event_type, provider_order_id, provider_payment_id, processing_status, received_at)
      VALUES (?, 'RAZORPAY', ?, ?, ?, ?, 'RECEIVED', ?) ON CONFLICT DO NOTHING`,
      params: [
        eventId,
        eventKey,
        payload.event,
        entity.order_id,
        entity.id,
        now,
      ],
    },
    {
      sql: `UPDATE payments SET status = ?, provider_payment_id = ?, confirmed_at = COALESCE(confirmed_at, ?), updated_at = ?
      WHERE id = ? AND provider = 'RAZORPAY' AND provider_order_id = ? AND amount_minor = ? AND currency = ?
      AND status IN ('CREATED','PENDING','FAILED','EXPIRED') AND ${eligible}
      AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status IN ('CREATED','PENDING_PAYMENT','PAYMENT_PENDING','PAYMENT_FAILED','PAID'))`,
      params: [
        success ? "SUCCESS" : "FAILED",
        entity.id,
        success ? now : null,
        now,
        payment.id,
        entity.order_id,
        entity.amount,
        entity.currency,
        eventId,
        payment.order_id,
      ],
    },
    {
      sql: `UPDATE orders SET status = ?, paid_at = COALESCE(paid_at, ?), updated_at = ? WHERE id = ?
      AND status IN ('CREATED','PENDING_PAYMENT','PAYMENT_PENDING','PAYMENT_FAILED') AND ${eligible}
      AND EXISTS (SELECT 1 FROM payments WHERE id = ? AND status = ?)`,
      params: [
        success ? "PAID" : "PAYMENT_FAILED",
        success ? now : null,
        now,
        payment.order_id,
        eventId,
        payment.id,
        success ? "SUCCESS" : "FAILED",
      ],
    },
    {
      sql: `UPDATE payment_webhook_events SET processing_status = 'PROCESSED', processed_at = ? WHERE id = ? AND processing_status = 'RECEIVED'`,
      params: [now, eventId],
    },
  ]);
  if (!complete) throw new Error("Payment persistence unavailable");
  return { received: true };
}
