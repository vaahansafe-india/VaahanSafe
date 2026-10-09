import "server-only";
import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { getEmailService } from "@vaahansafe/notifications";
import { AdminError } from "./session";

export const EMAIL_CHALLENGE_COOKIE = "vs_admin_email_challenge";
export const emailChallengeCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/email-otp",
  maxAge: 300,
};
export function emailChallengeHash(challenge: string) {
  return createHash("sha256").update(challenge).digest("hex");
}
export function emailCodeHash(
  sessionId: string,
  challenge: string,
  code: string,
  email: string,
) {
  const secret =
    process.env.OTP_REQUEST_HASH_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Email verification unavailable");
  return createHmac("sha256", secret)
    .update(
      JSON.stringify([
        "admin-email-otp",
        sessionId,
        email.toLowerCase(),
        challenge,
        code,
      ]),
    )
    .digest("hex");
}
export function readEmailChallenge(request: Request) {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${EMAIL_CHALLENGE_COOKIE}=`))
    ?.slice(EMAIL_CHALLENGE_COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export function maskAdminEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name?.slice(0, 1)}•••@${domain}`;
}
export async function sendAdminEmailChallenge(identity: {
  sessionId: string;
  email: string;
}) {
  if (
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !process.env.SMTP_HOST ||
    !process.env.SMTP_FROM
  )
    throw new AdminError(
      503,
      "EMAIL_UNAVAILABLE",
      "Email verification is temporarily unavailable. Please try again shortly.",
    );
  const challenge = randomBytes(32).toString("hex");
  const code = String(randomInt(100000, 1000000));
  const hash = emailChallengeHash(challenge);
  const db = getSupabaseAdminClient();
  const { data: reserved, error } = await db.rpc("admin_reserve_email_otp", {
    p_session: identity.sessionId,
    p_challenge: hash,
    p_code: emailCodeHash(identity.sessionId, challenge, code, identity.email),
  });
  if (error) throw new Error("Email verification unavailable");
  if (reserved !== true)
    throw new AdminError(
      429,
      "RATE_LIMITED",
      "Please wait a minute before requesting another code. After several requests, wait 15 minutes.",
    );
  const delivery = await getEmailService().sendEmail({
    to: identity.email,
    subject: "Your VaahanSafe Admin verification code",
    text: `Your VaahanSafe Admin verification code is ${code}. It expires in five minutes. Never share this code. If you did not request this, contact your platform administrator.`,
    html: `<div style="font-family:Arial,sans-serif;background:#faf9f5;padding:32px;color:#292623"><p style="letter-spacing:2px;font-size:12px">VAAHANSAFE · OPERATIONS</p><h1 style="font-size:26px">Verify your work email.</h1><p>Use this code to complete your secure Admin sign-in or confirm your requested action.</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold">${code}</p><p>This code expires in five minutes. Never share it with anyone.</p><p>If you did not request this code, contact your platform administrator.</p></div>`,
  });
  const { data: recorded, error: dispatchError } = await db.rpc(
    "admin_email_otp_dispatch",
    {
      p_session: identity.sessionId,
      p_challenge: hash,
      p_success: delivery.success,
    },
  );
  if (!delivery.success || dispatchError || recorded !== true)
    throw new AdminError(
      503,
      "EMAIL_UNAVAILABLE",
      "We couldn't send your verification email right now. Please try again shortly.",
    );
  return challenge;
}
