import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedCustomer } from "@/lib/session";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  verifyRazorpayCheckoutSignature,
  getRazorpayPaymentGateway,
} from "@vaahansafe/payments";
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedCustomer();
    if (!auth)
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    const body = await req.json();
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      body;
    if (
      ![orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature].every(
        (v) => typeof v === "string" && v.length > 0 && v.length <= 128,
      )
    )
      return NextResponse.json(
        { success: false, error: "Invalid payment verification request" },
        { status: 400 },
      );
    const payment = await getAuthoritativeDatabaseClient().queryFirst<{
      provider_order_id: string;
      amount_minor: number;
      currency: string;
      status: string;
      order_status: string;
    }>(
      `SELECT p.provider_order_id, p.amount_minor, p.currency, p.status, o.status AS order_status FROM payments p JOIN orders o ON o.id = p.order_id
       WHERE o.id = ? AND o.user_id = ? AND p.provider = 'RAZORPAY' AND p.provider_order_id = ? LIMIT 1`,
      [orderId, auth.user.id, razorpayOrderId],
    );
    if (!payment || !payment.provider_order_id)
      return NextResponse.json(
        { success: false, error: "Payment attempt not found" },
        { status: 404 },
      );
    if (
      !(await verifyRazorpayCheckoutSignature(
        payment.provider_order_id,
        razorpayPaymentId,
        razorpaySignature,
        process.env.RAZORPAY_KEY_SECRET,
      ))
    )
      return NextResponse.json(
        { success: false, error: "Unable to verify this payment response" },
        { status: 400 },
      );
    const entity =
      await getRazorpayPaymentGateway().rawClient.getPayment(razorpayPaymentId);
    if (
      entity.order_id !== payment.provider_order_id ||
      entity.amount !== Number(payment.amount_minor) ||
      entity.currency !== payment.currency
    )
      return NextResponse.json(
        { success: false, error: "Payment details do not match" },
        { status: 400 },
      );
    // The callback authenticates the receipt. Only the signed webhook may change financial truth.
    return NextResponse.json(
      {
        success: true,
        orderId,
        status: payment.order_status,
        confirming: payment.status !== "SUCCESS",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    console.error("[Razorpay checkout] Verification unavailable");
    return NextResponse.json(
      {
        success: false,
        error: "We're confirming your payment. Please check your order status.",
      },
      { status: 503 },
    );
  }
}
