import { getSupabaseAdminClient, SupabaseOtpRequestStore } from "@vaahansafe/database";
import { Msg91OtpAdapter, getOtpDeliveryAvailability } from "@vaahansafe/notifications";
import { OtpRequestGuard, OtpRequestError, serializeOtpCookie } from "@vaahansafe/auth";
import { NextResponse } from "next/server";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
export async function GET() {
  return NextResponse.json({ channels: getOtpDeliveryAvailability(), cooldownSeconds: 60, expiresInSeconds: 300 }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin();
    const body = await request.json();
    const db = getSupabaseAdminClient();
    const { data: ses, error } = await db
      .from("admin_sessions")
      .select("pending_phone,otp_sent_at,otp_attempts")
      .eq("id", identity.sessionId)
      .single();
    const { data: actor, error: actorError } = await db
      .from("admin_users")
      .select("verified_mobile")
      .eq("id", identity.id)
      .single();
    if (error || actorError) throw error || actorError;
    const provider = new Msg91OtpAdapter();
    const guard = new OtpRequestGuard(new SupabaseOtpRequestStore(), "ADMIN");
    if (body.action === "send") {
      const raw = String(body.phone || "").replace(/[\s()-]/g, "");
      const phone = raw.startsWith("+91")
        ? raw
        : raw.startsWith("91") && raw.length === 12
          ? `+${raw}`
          : `+91${raw}`;
      if (
        !/^\+91[6-9]\d{9}$/.test(phone) ||
        (actor.verified_mobile && actor.verified_mobile !== phone)
      )
        throw new AdminError(
          400,
          "INVALID_PHONE",
          "Use the mobile number registered to your admin account.",
        );
      if (ses.otp_sent_at && Date.now() - Date.parse(ses.otp_sent_at) < 60000)
        throw new AdminError(
          429,
          "RATE_LIMITED",
          "Please wait a minute before requesting another code.",
        );
      const rawChannel = body.channel;
      const channel = rawChannel === undefined ? "WHATSAPP" : rawChannel;
      if (channel !== "SMS" && channel !== "WHATSAPP")
        throw new AdminError(400, "OTP_CHANNEL_INVALID", "Choose an available verification method.");
      if (!getOtpDeliveryAvailability()[channel as "SMS" | "WHATSAPP"])
        throw new AdminError(503, "OTP_CHANNEL_UNAVAILABLE", "This verification method is currently unavailable. Choose SMS if available.");

      const { error: reserveError } = await db.rpc("admin_reserve_otp", {
        p_session: identity.sessionId,
        p_phone: phone,
        p_request: crypto.randomUUID(),
        p_channel: channel,
      });
      if (reserveError)
        throw new AdminError(
          429,
          "RATE_LIMITED",
          "A code request is already in progress, or the request limit was reached. Please try again later.",
        );
      const reservation = await guard.reserve(phone, request, channel);
      let result;
      try {
        result = await provider.send({ phone, channel });
      } catch {
        await guard.finishDispatch(reservation.id, { success: false });
        throw new Error("OTP provider unavailable");
      }
      await guard.finishDispatch(reservation.id, result);
      if (!result.success) throw new Error("OTP provider unavailable");
      const response = adminResponse({ sent: true, channel: result.channel, cooldownSeconds: 60, expiresInSeconds: 300 });
      response.headers.append("Set-Cookie", serializeOtpCookie("ADMIN", reservation.token, request));
      return response;
    }
    if (
      body.action !== "verify" ||
      !/^\d{6}$/.test(String(body.code || "")) ||
      !ses.pending_phone ||
      !ses.otp_sent_at ||
      Date.now() - Date.parse(ses.otp_sent_at) > 300000
    )
      throw new AdminError(
        400,
        "OTP_EXPIRED",
        "Request a fresh verification code and try again.",
      );
    if (ses.otp_attempts >= 5)
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Too many attempts. Request a new code after a minute.",
      );
    const { error: attemptError } = await db.rpc("admin_otp_attempt", {
      p_session: identity.sessionId,
      p_sent_at: ses.otp_sent_at,
      p_request: crypto.randomUUID(),
    });
    if (attemptError)
      throw new AdminError(
        429,
        "RATE_LIMITED",
        "Too many attempts, or this code expired. Request a fresh code.",
      );
    const verified = await guard.verify(ses.pending_phone, request, (challenge) => provider.verify(ses.pending_phone, String(body.code), challenge.requestId, challenge.channel));
    if (!verified.success)
      throw new AdminError(
        400,
        "OTP_INVALID",
        "We couldn't verify that code. Please try again.",
      );
    const { error: verifyError } = await db.rpc("admin_complete_phone", {
      p_session: identity.sessionId,
      p_sent_at: ses.otp_sent_at,
      p_phone: ses.pending_phone,
      p_request: crypto.randomUUID(),
    });
    if (verifyError) throw verifyError;
    return adminResponse({ verified: true });
  } catch (error) {
    if (error instanceof OtpRequestError) return adminFailure(new AdminError(error.status, error.code, error.message));
    return adminFailure(error);
  }
}
