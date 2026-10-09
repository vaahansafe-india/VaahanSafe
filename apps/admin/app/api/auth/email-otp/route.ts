import { getSupabaseAdminClient } from "@vaahansafe/database";
import { adminResponse, adminFailure } from "../../../../lib/api";
import {
  AdminError,
  assertSameOrigin,
  requireAdmin,
} from "../../../../lib/session";
import {
  EMAIL_CHALLENGE_COOKIE,
  emailChallengeCookieOptions,
  emailChallengeHash,
  emailCodeHash,
  readEmailChallenge,
  sendAdminEmailChallenge,
  maskAdminEmail,
} from "../../../../lib/email-otp";

export async function GET(request: Request) {
  try {
    const identity = await requireAdmin(undefined, { pendingEmail: true });
    const { data, error } = await getSupabaseAdminClient()
      .from("admin_sessions")
      .select(
        "email_otp_challenge_hash,email_otp_delivered_at,email_otp_sent_at",
      )
      .eq("id", identity.sessionId)
      .single();
    if (error) throw new Error("Email verification unavailable");
    const challenge = readEmailChallenge(request);
    const sentAt = data?.email_otp_sent_at
      ? Date.parse(data.email_otp_sent_at)
      : 0;
    return adminResponse({
      email: maskAdminEmail(identity.email),
      sent:
        !!challenge &&
        data?.email_otp_challenge_hash === emailChallengeHash(challenge) &&
        !!data.email_otp_delivered_at &&
        sentAt > Date.now() - 300000,
      cooldownSeconds: Math.max(
        0,
        Math.ceil((sentAt + 60000 - Date.now()) / 1000),
      ),
      expiresInSeconds: 300,
    });
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin(undefined, { pendingEmail: true });
    // Small bounded bodies; never accept browser-supplied recipient or account.
    const reader = request.body?.getReader();
    let text = "";
    let length = 0;
    const decoder = new TextDecoder();
    if (reader)
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 512) {
          await reader.cancel();
          throw new AdminError(
            413,
            "INVALID_REQUEST",
            "Please reload and try again.",
          );
        }
        text += decoder.decode(value, { stream: true });
      }
    let body: { action?: string; code?: string };
    try {
      body = JSON.parse(text);
    } catch {
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Please reload and try again.",
      );
    }
    if (body?.action === "send") {
      const challenge = await sendAdminEmailChallenge(identity);
      const response = adminResponse({
        sent: true,
        email: maskAdminEmail(identity.email),
        cooldownSeconds: 60,
        expiresInSeconds: 300,
      });
      response.cookies.set(
        EMAIL_CHALLENGE_COOKIE,
        challenge,
        emailChallengeCookieOptions,
      );
      return response;
    }
    const challenge = readEmailChallenge(request);
    if (
      body?.action !== "verify" ||
      typeof body.code !== "string" ||
      !/^\d{6}$/.test(body.code) ||
      !challenge
    )
      throw new AdminError(
        400,
        "INVALID_CODE",
        "Enter the latest six-digit code sent to your email.",
      );
    const { data: verified, error } = await getSupabaseAdminClient().rpc(
      "admin_verify_email_otp",
      {
        p_session: identity.sessionId,
        p_challenge: emailChallengeHash(challenge),
        p_code: emailCodeHash(
          identity.sessionId,
          challenge,
          body.code,
          identity.email,
        ),
        p_request: requestId,
      },
    );
    if (error) throw new Error("Email verification unavailable");
    if (verified !== true)
      throw new AdminError(
        400,
        "INVALID_CODE",
        "This code is incorrect or has expired. Request a new code and try again.",
      );
    const response = adminResponse({ verified: true, next: "/" });
    response.cookies.set(EMAIL_CHALLENGE_COOKIE, "", {
      ...emailChallengeCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return adminFailure(error, requestId);
  }
}
