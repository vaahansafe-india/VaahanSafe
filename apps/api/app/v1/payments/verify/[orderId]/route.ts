import { NextRequest, NextResponse } from "next/server";
import { getApiDatabase } from "../../../_db";
import { getApiAuthContext } from "../../../_auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

/**
 * Authoritative Payment Status Verification Endpoint (GET /v1/payments/verify/:orderId)
 *
 * SECTION 04 & 09 (Rules 04 & 09) — NEVER TRUST PAYMENT REDIRECT:
 * Evaluates the authoritative database state of an order and its associated payment.
 * Browser return redirects must NEVER enable service without this verification.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getApiAuthContext(req);
    if (!auth)
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    const { orderId } = await params;
    const cleanOrderId = typeof orderId === "string" ? orderId.trim() : "";

    if (!cleanOrderId) {
      return NextResponse.json(
        { error: "Order identifier is required", code: "ERR_MISSING_ORDER_ID" },
        { status: 400 },
      );
    }

    const db = getApiDatabase();

    const record = await db.queryFirst<{
      id: string;
      order_number: string;
      order_status: string;
      total_minor: number;
      currency: string;
      paid_at: string | null;
      payment_id: string | null;
      payment_status: string | null;
      provider: string | null;
      confirmed_at: string | null;
    }>(
      `SELECT o.id, o.order_number, o.status AS order_status, o.total_minor, o.currency, o.paid_at,
              p.id AS payment_id, p.status AS payment_status, p.provider, p.confirmed_at
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE (o.id = ? OR o.order_number = ?) AND o.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [cleanOrderId, cleanOrderId, auth.user.id],
    );

    if (!record) {
      return NextResponse.json(
        {
          error: "Order not found in platform registry",
          code: "ERR_ORDER_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const isPaid =
      record.order_status === "PAID" || record.order_status === "FULFILLED";

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: record.id,
          orderNumber: record.order_number,
          orderStatus: record.order_status,
          isPaid,
          amountMinor: record.total_minor,
          currency: record.currency,
          paidAt: record.paid_at,
          payment: {
            id: record.payment_id,
            status: record.payment_status || "PENDING",
            provider: record.provider || "RAZORPAY",
            confirmedAt: record.confirmed_at,
          },
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("[ApiPaymentVerify] Order status unavailable");
    return NextResponse.json(
      {
        error: "Failed to verify order status.",
        code: "ERR_VERIFICATION_FAILED",
      },
      { status: 500 },
    );
  }
}
