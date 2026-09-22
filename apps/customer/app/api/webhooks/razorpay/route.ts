import { NextRequest, NextResponse } from "next/server";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  verifyRazorpayWebhookSignature,
  type RazorpayWebhookPayload,
} from "@vaahansafe/payments";
import { fulfillPaidOnlineOrder } from "@vaahansafe/qr-core";

/**
 * Razorpay Signed Webhook Handler for Customer Portal.
 *
 * INVARIANTS:
 * - Reads raw request body directly to preserve cryptographic HMAC integrity.
 * - Compares HMAC-SHA256 signature against RAZORPAY_WEBHOOK_SECRET in constant time.
 * - Enforces database-backed idempotency using UNIQUE index on payment_webhook_events(provider, provider_event_id).
 * - Updates internal payment and order states authoritatively.
 * - Triggers QR allocation and service entitlement fulfillment idempotently.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Authoritative Signature Verification
    const isValid = await verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn("[RazorpayWebhook] Rejected invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse Raw Payload
    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const eventType = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const gatewayPaymentId = paymentEntity?.id;

    // Resolve internal VaahanSafe order ID from receipt or notes
    const internalOrderRef =
      orderEntity?.receipt ||
      paymentEntity?.notes?.vaahansafe_order_ref ||
      paymentEntity?.notes?.order_id;

    const providerEventId = gatewayPaymentId
      ? `${gatewayPaymentId}_${eventType}`
      : `${gatewayOrderId || payload.account_id}_${payload.created_at}_${eventType}`;

    const db = getAuthoritativeDatabaseClient();

    // 3. Database-backed Idempotency Check
    const eventRecordId = `pwe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await db.execute(
        `INSERT INTO payment_webhook_events (
           id, provider, provider_event_id, event_type, provider_order_id, provider_payment_id,
           processing_status, received_at, processed_at
         ) VALUES (?, 'RAZORPAY', ?, ?, ?, ?, 'RECEIVED', datetime('now'), datetime('now'))`,
        [eventRecordId, providerEventId, eventType, gatewayOrderId || null, gatewayPaymentId || null]
      );
    } catch {
      // Duplicate delivery caught safely
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // 4. Resolve Internal Order Record
    let order: {
      id: string;
      user_id: string;
      vehicle_id: string | null;
      status: string;
      total_minor: number;
    } | null = null;

    if (internalOrderRef) {
      const orders = await db.query<{
        id: string;
        user_id: string;
        vehicle_id: string | null;
        status: string;
        total_minor: number;
      }>(
        `SELECT id, user_id, vehicle_id, status, total_minor
         FROM orders
         WHERE id = ? OR order_number = ?
         LIMIT 1`,
        [internalOrderRef, internalOrderRef]
      );
      order = orders[0] || null;
    }

    // Fallback: search via payments table by provider_order_id
    if (!order && gatewayOrderId) {
      const payments = await db.query<{ order_id: string }>(
        `SELECT order_id FROM payments WHERE provider_order_id = ? LIMIT 1`,
        [gatewayOrderId]
      );
      if (payments[0]) {
        const orders = await db.query<{
          id: string;
          user_id: string;
          vehicle_id: string | null;
          status: string;
          total_minor: number;
        }>(
          `SELECT id, user_id, vehicle_id, status, total_minor
           FROM orders
           WHERE id = ?
           LIMIT 1`,
          [payments[0].order_id]
        );
        order = orders[0] || null;
      }
    }

    if (!order) {
      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'FAILED' WHERE id = ?`,
        [eventRecordId]
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 5. Authoritative State Transitions
    if (eventType === "payment.captured" || eventType === "order.paid") {
      // Update Payment Record
      await db.execute(
        `UPDATE payments
         SET status = 'SUCCESS',
             provider_payment_id = COALESCE(?, provider_payment_id),
             confirmed_at = COALESCE(confirmed_at, ?),
             updated_at = ?
         WHERE order_id = ?`,
        [gatewayPaymentId || null, now, now, order.id]
      );

      // Update Order Record
      await db.execute(
        `UPDATE orders
         SET status = 'PAID',
             paid_at = COALESCE(paid_at, ?),
             updated_at = ?
         WHERE id = ?`,
        [now, now, order.id]
      );

      // Authoritative Fulfillment & Entitlement Activation
      if (order.vehicle_id) {
        await fulfillPaidOnlineOrder({
          userId: order.user_id,
          vehicleId: order.vehicle_id,
          orderId: order.id,
          db,
        });
      }

      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'PROCESSED' WHERE id = ?`,
        [eventRecordId]
      );
    } else if (eventType === "payment.failed") {
      await db.execute(
        `UPDATE payments SET status = 'FAILED', updated_at = ? WHERE order_id = ?`,
        [now, order.id]
      );
      if (order.status !== "PAID") {
        await db.execute(
          `UPDATE orders SET status = 'PAYMENT_FAILED', updated_at = ? WHERE id = ?`,
          [now, order.id]
        );
      }
      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'PROCESSED' WHERE id = ?`,
        [eventRecordId]
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[RazorpayWebhook] Internal error processing webhook:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
