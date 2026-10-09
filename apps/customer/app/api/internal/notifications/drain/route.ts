import { NextResponse } from "next/server";
import {
  runNotificationDelivery,
  verifyNotificationSchedule,
} from "../../../../../lib/notification-runtime";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!verifyNotificationSchedule(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.NOTIFICATION_DISPATCH_ENABLED !== "true")
    return NextResponse.json({ enabled: false }, { status: 503 });
  try {
    return NextResponse.json(await runNotificationDelivery(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("[Notifications] Outbox processing failed");
    return NextResponse.json(
      { error: "Delivery service unavailable" },
      { status: 503 },
    );
  }
}
