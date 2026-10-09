import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { SupabaseNotificationOutbox } from "@vaahansafe/database";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const expected = process.env.MSG91_WEBHOOK_SECRET || "";
  const supplied = request.headers.get("x-vaahansafe-webhook-secret") || "";
  if (
    expected.length < 32 ||
    Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(request.headers.get("content-length") || 0) > 16384)
    return NextResponse.json({ error: "Invalid report" }, { status: 413 });
  try {
    const raw = await request.text();
    if (raw.length > 16384)
      return NextResponse.json({ error: "Invalid report" }, { status: 413 });
    let report: Record<string, unknown>;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Invalid report");
      report = parsed;
    } catch {
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    }
    const event = String(report.eventName || "").toLowerCase();
    const status = ["delivered", "read", "failed", "sent"].includes(event)
      ? event
      : null;
    if (!status) return NextResponse.json({ received: true, ignored: true });
    // The account-level report also includes OTP/widget and campaign messages.
    // Acknowledge unrelated messages so they cannot auto-pause this webhook.
    if (
      report.integratedNumber !== process.env.MSG91_WHATSAPP_NUMBER ||
      typeof report.crqid !== "string" ||
      !/^delivery_[a-f0-9]{32}$/.test(report.crqid)
    )
      return NextResponse.json({ received: true, ignored: true });
    if (
      typeof report.requestId !== "string" ||
      !report.requestId.trim() ||
      report.requestId.length > 150
    )
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    // MSG91 documents ISO 8601 with timezone; numeric epochs are also accepted.
    const timestamp = Number(report.ts);
    const occurredAt =
      typeof report.ts === "string" &&
      /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(report.ts)
        ? new Date(report.ts)
        : new Date(
            Number.isFinite(timestamp) && timestamp > 0
              ? timestamp < 1e12
                ? timestamp * 1000
                : timestamp
              : NaN,
          );
    if (
      !Number.isFinite(occurredAt.getTime()) ||
      occurredAt.getTime() > Date.now() + 300_000
    )
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    const matched = await new SupabaseNotificationOutbox().recordReport(
      report.crqid,
      report.requestId,
      status,
      occurredAt.toISOString(),
    );
    return NextResponse.json({ received: true, matched });
  } catch {
    return NextResponse.json(
      { error: "Report could not be recorded" },
      { status: 503 },
    );
  }
}
