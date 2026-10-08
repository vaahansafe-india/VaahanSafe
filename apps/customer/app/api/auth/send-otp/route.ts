import { NextResponse } from "next/server";
import { phoneSchema } from "@vaahansafe/validation";
import { Msg91OtpAdapter, getOtpDeliveryAvailability } from "@vaahansafe/notifications";
import { SupabaseOtpRequestStore } from "@vaahansafe/database";
import { OtpRequestGuard, OtpRequestError, serializeOtpCookie } from "@vaahansafe/auth";

const headers = { "Cache-Control": "private, no-store" };
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ channels: getOtpDeliveryAvailability(), cooldownSeconds: 60, expiresInSeconds: 300 }, { headers });
}
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = phoneSchema.safeParse(body.phone);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400, headers });
    const channel = body.channel === undefined ? "WHATSAPP" : body.channel;
    if (channel !== "SMS" && channel !== "WHATSAPP") return NextResponse.json({ success: false, error: "Choose an available verification method." }, { status: 400, headers });
    if (!getOtpDeliveryAvailability()[channel as "SMS" | "WHATSAPP"]) return NextResponse.json({
      success: false, code: "OTP_CHANNEL_UNAVAILABLE",
      error: channel === "WHATSAPP" ? "WhatsApp verification is currently unavailable. Choose SMS if available." : "Mobile verification is temporarily unavailable. Please try again later.",
    }, { status: 503, headers });
    const phone = `+91${parsed.data}`;
    const guard = new OtpRequestGuard(new SupabaseOtpRequestStore(), "CUSTOMER");
    const reservation = await guard.reserve(phone, req, channel);
    let result;
    try {
      result = await new Msg91OtpAdapter().send({ phone, channel, otpLength: 6 });
    } catch {
      await guard.finishDispatch(reservation.id, { success: false });
      throw new Error("OTP dispatch unavailable");
    }
    await guard.finishDispatch(reservation.id, result);
    if (!result.success) return NextResponse.json({ success: false, error: "We couldn't send a verification code right now. Please try again." }, { status: 503, headers });
    return NextResponse.json({ success: true, maskedPhone: `+91 ••••• ${parsed.data.slice(-4)}`,
      channel: result.channel, cooldownSeconds: 60, expiresInSeconds: 300 }, {
        headers: { ...headers, "Set-Cookie": serializeOtpCookie("CUSTOMER", reservation.token, req) },
      });
  } catch (error) {
    if (error instanceof OtpRequestError) return NextResponse.json({ success: false, code: error.code, error: error.message }, { status: error.status, headers });
    console.error("[CUSTOMER OTP] Send unavailable");
    return NextResponse.json({ success: false, error: "We couldn't complete sign-in right now. Please try again." }, { status: 503, headers });
  }
}
