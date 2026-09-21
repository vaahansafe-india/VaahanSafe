import { NextRequest, NextResponse } from "next/server";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  verifyCashfreeSignature,
  type CashfreeWebhookPayload,
} from "@vaahansafe/payments";
import { fulfillPaidOnlineOrder } from "@vaahansafe/qr-core";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const secretKey =
      process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET;

    // 1. Authoritative Signature Verification (Rule 06)
    const isValid = await verifyCashfreeSignature(rawBody, signature, timestamp, secretKey);
    if (!isValid) {
      console.warn("[CashfreeWebhook] Rejected invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse Raw Payload
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    const orderId = payload.data?.order?.order_id;
    const paymentId = payload.data?.payment?.cf_payment_id;
    const paymentStatus = payload.data?.payment?.payment_status;
    const eventType = payload.type;
    const providerEventId = paymentId
      ? `${paymentId}_${eventType}`
      : `${orderId}_${payload.event_time}_${eventType}`;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const db = getAuthoritativeDatabaseClient();

    // 3. Database-backed Idempotency Check (Rule 07)
    const eventRecordId = `pwe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await db.execute(
        `INSERT INTO payment_webhook_events (
           id, provider, provider_event_id, event_type, provider_order_id, provider_payment_id,
           processing_status, received_at, processed_at
         ) VALUES (?, 'CASHFREE', ?, ?, ?, ?, 'RECEIVED', datetime('now'), datetime('now'))`,
        [eventRecordId, providerEventId, eventType, orderId, paymentId || null]
      );
    } catch {
      // If duplicate constraint hit, acknowledge idempotently without duplicate side-effects
      return NextResponse.json({ status: "already_processed" }, { status: 200 });
    }

    // 4. Authoritative Order Lookup & State Machine Transition
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
      [orderId, orderId]
    );
    const order = orders[0];

    if (!order) {
      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'FAILED' WHERE id = ?`,
        [eventRecordId]
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS") {
      // Mark Payment Succeeded
      await db.execute(
        `UPDATE payments
         SET status = 'SUCCESS',
             provider_payment_id = ?,
             confirmed_at = ?,
             updated_at = ?
         WHERE order_id = ?`,
        [paymentId ? String(paymentId) : null, now, now, order.id]
      );

      // Mark Order Paid
      await db.execute(
        `UPDATE orders
         SET status = 'PAID',
             paid_at = ?,
             updated_at = ?
         WHERE id = ?`,
        [now, now, order.id]
      );

      // Fulfillment & Entitlement Activation
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
    } else if (paymentStatus === "FAILED" || paymentStatus === "USER_DROPPED") {
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
    console.error("[CashfreeWebhook] Internal error processing webhook:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
