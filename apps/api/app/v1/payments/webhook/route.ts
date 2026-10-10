import { NextRequest, NextResponse } from "next/server";
import {
  processRazorpayWebhook,
  RazorpayWebhookError,
} from "@vaahansafe/payments";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  verifyCashfreeSignature,
  type CashfreeWebhookPayload,
} from "@vaahansafe/payments";
import { grantAuthoritativeEntitlements } from "@vaahansafe/qr-core";

/**
 * Universal Payments Webhook Endpoint for Central API (apps/api).
 *
 * Routes Razorpay to the shared verified financial handler and retains historical Cashfree handling.
 *
 * INVARIANTS:
 * - Direct raw request body cryptographic signature validation.
 * - Strict database-backed idempotency using payment_webhook_events(provider, provider_event_id).
 * - Razorpay confirms financial state; QR fulfillment remains a separate gate.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const razorpaySignature = req.headers.get("x-razorpay-signature");
    if (razorpaySignature) {
      try {
        return NextResponse.json(
          await processRazorpayWebhook(
            rawBody,
            razorpaySignature,
            req.headers.get("x-razorpay-event-id"),
            getAuthoritativeDatabaseClient(),
          ),
        );
      } catch (error) {
        if (error instanceof RazorpayWebhookError)
          return NextResponse.json(
            { error: error.message },
            { status: error.status },
          );
        throw error;
      }
    }
    const cashfreeSignature = req.headers.get("x-webhook-signature");
    const cashfreeTimestamp = req.headers.get("x-webhook-timestamp") || "";

    const db = getAuthoritativeDatabaseClient();
    const now = new Date().toISOString();

    const provider = "CASHFREE";
    let orderId: string | undefined;
    let paymentId: string | undefined;
    let paymentStatus: string | undefined;
    let eventType: string = "";
    let providerEventId: string = "";

    // Historical Cashfree deliveries retain their existing handler.
    if (cashfreeSignature) {
      const secretKey =
        process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_SECRET;
      const isValid = await verifyCashfreeSignature(
        rawBody,
        cashfreeSignature,
        cashfreeTimestamp,
        secretKey,
      );
      if (!isValid) {
        console.warn(
          "[PaymentsWebhook API] Rejected invalid Cashfree webhook signature",
        );
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }

      let payload: CashfreeWebhookPayload;
      try {
        payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
      } catch {
        return NextResponse.json(
          { error: "Malformed payload" },
          { status: 400 },
        );
      }

      orderId = payload.data?.order?.order_id;
      paymentId = payload.data?.payment?.cf_payment_id;
      paymentStatus = payload.data?.payment?.payment_status;
      eventType = payload.type;
      providerEventId = paymentId
        ? `${paymentId}_${eventType}`
        : `${orderId}_${payload.event_time}_${eventType}`;
    } else {
      return NextResponse.json(
        { error: "Unrecognized payment provider signature headers" },
        { status: 400 },
      );
    }

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { error: "Missing order reference" },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------
    // 3. Database-backed Idempotency Check
    // -------------------------------------------------------------
    const eventRecordId = `pwe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await db.execute(
        `INSERT INTO payment_webhook_events (
           id, provider, provider_event_id, event_type, provider_order_id, provider_payment_id,
           processing_status, received_at, processed_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'RECEIVED', datetime('now'), datetime('now'))`,
        [
          eventRecordId,
          provider,
          providerEventId,
          eventType,
          orderId || null,
          paymentId || null,
        ],
      );
    } catch {
      // Duplicate delivery acknowledged safely
      return NextResponse.json(
        { status: "already_processed" },
        { status: 200 },
      );
    }

    // -------------------------------------------------------------
    // 4. Authoritative Order Lookup
    // -------------------------------------------------------------
    let order: {
      id: string;
      user_id: string;
      vehicle_id: string | null;
      status: string;
      total_minor: number;
    } | null = null;

    if (orderId) {
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
        [orderId, orderId],
      );
      order = orders[0] || null;
    }

    // Fallback: search via payments table by provider_payment_id or provider_order_id
    if (!order && (paymentId || orderId)) {
      const payments = await db.query<{ order_id: string }>(
        `SELECT order_id FROM payments WHERE provider_payment_id = ? OR provider_order_id = ? LIMIT 1`,
        [paymentId || "", orderId || ""],
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
          [payments[0].order_id],
        );
        order = orders[0] || null;
      }
    }

    if (!order) {
      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'FAILED' WHERE id = ?`,
        [eventRecordId],
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // -------------------------------------------------------------
    // 5. State Machine Transition & Authoritative Fulfillment
    // -------------------------------------------------------------
    const isSuccess =
      eventType === "PAYMENT_SUCCESS_WEBHOOK" || paymentStatus === "SUCCESS";

    const isFailure =
      eventType === "PAYMENT_FAILED_WEBHOOK" ||
      paymentStatus === "FAILED" ||
      paymentStatus === "USER_DROPPED";

    if (isSuccess) {
      // Mark Payment Succeeded
      await db.execute(
        `UPDATE payments
         SET status = 'SUCCESS',
             provider_payment_id = COALESCE(?, provider_payment_id),
             confirmed_at = COALESCE(confirmed_at, ?),
             updated_at = ?
         WHERE order_id = ?`,
        [paymentId ? String(paymentId) : null, now, now, order.id],
      );

      // Mark Order Paid
      await db.execute(
        `UPDATE orders
         SET status = 'PAID',
             paid_at = COALESCE(paid_at, ?),
             updated_at = ?
         WHERE id = ?`,
        [now, now, order.id],
      );

      // Fulfillment & Entitlement Activation
      if (order.vehicle_id) {
        const assignedQrs = await db.query<{ id: string; public_id: string }>(
          `SELECT q.id, q.public_id
           FROM qr_stickers q
           JOIN qr_assignments a ON q.id = a.qr_id AND a.ended_at IS NULL
           WHERE a.vehicle_id = ?
           LIMIT 1`,
          [order.vehicle_id],
        );

        let qrStickerId = assignedQrs[0]?.id;

        if (!qrStickerId) {
          const availableStickers = await db.query<{
            id: string;
            public_id: string;
          }>(
            `SELECT s.id, s.public_id
             FROM qr_stickers s JOIN qr_batches b ON b.id = s.batch_id
             WHERE s.status = 'PRINTED' AND b.inventory_channel = 'ONLINE_SYSTEM'
               AND s.current_distributor_id IS NULL AND s.current_retailer_id IS NULL
               AND NOT EXISTS (SELECT 1 FROM qr_assignments a WHERE a.qr_id = s.id AND a.ended_at IS NULL)
               AND NOT EXISTS (SELECT 1 FROM qr_reservations r WHERE r.qr_sticker_id = s.id AND r.status IN ('RESERVED', 'ALLOCATED'))
             LIMIT 1`,
          );
          const candidate = availableStickers[0];
          if (candidate) {
            qrStickerId = candidate.id;
            await db.execute(
              `UPDATE qr_stickers SET status = 'ACTIVATED', activated_at = ?, updated_at = ? WHERE id = ?`,
              [now, now, candidate.id],
            );
            const assignmentId = `qra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await db.execute(
              `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
               VALUES (?, ?, ?, ?, 'INITIAL', ?)`,
              [
                assignmentId,
                candidate.id,
                order.vehicle_id,
                order.user_id,
                now,
              ],
            );
          }
        }

        if (qrStickerId) {
          await grantAuthoritativeEntitlements({
            userId: order.user_id,
            vehicleId: order.vehicle_id,
            qrStickerId,
            acquisitionSource: "ONLINE_PURCHASE",
            orderId: order.id,
            db,
          });
        }
      }

      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'PROCESSED' WHERE id = ?`,
        [eventRecordId],
      );
    } else if (isFailure) {
      await db.execute(
        `UPDATE payments SET status = 'FAILED', updated_at = ? WHERE order_id = ?`,
        [now, order.id],
      );
      if (order.status !== "PAID") {
        await db.execute(
          `UPDATE orders SET status = 'PAYMENT_FAILED', updated_at = ? WHERE id = ?`,
          [now, order.id],
        );
      }
      await db.execute(
        `UPDATE payment_webhook_events SET processing_status = 'PROCESSED' WHERE id = ?`,
        [eventRecordId],
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(
      "[PaymentsWebhook API] Internal error processing webhook:",
      err,
    );
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 },
    );
  }
}
