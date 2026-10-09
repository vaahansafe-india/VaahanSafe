import { NextRequest, NextResponse } from "next/server";
import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import {
  processRazorpayWebhook,
  RazorpayWebhookError,
} from "@vaahansafe/payments";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const result = await processRazorpayWebhook(
      await req.text(),
      req.headers.get("x-razorpay-signature") || "",
      req.headers.get("x-razorpay-event-id"),
      getAuthoritativeDatabaseClient(),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RazorpayWebhookError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[Razorpay webhook] Processing unavailable");
    return NextResponse.json(
      { error: "Payment processing temporarily unavailable" },
      { status: 503 },
    );
  }
}
