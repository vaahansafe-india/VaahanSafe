import { NextResponse } from "next/server";
import { phoneSchema } from "@vaahansafe/validation";
import { Msg91OtpAdapter } from "@vaahansafe/notifications";
import {
  handleMobileEntry,
  verifyMobileForGoogleUser,
  issueSession,
  validateSessionToken,
  parseSessionCookie,
  serializeSessionCookie,
} from "@vaahansafe/auth";
import {
  getUserRepository,
  getAuthIdentityRepository,
  getSessionRepository,
  getQrActivationChallengeRepository,
} from "@vaahansafe/database";
import { parseCookie, hashToken, ACTIVATION_CHALLENGE_COOKIE_NAME } from "@/lib/crypto-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawPhone = body?.phone;
    const rawOtp = body?.otp;

    if (!rawPhone || !rawOtp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and verification code are required." },
        { status: 400 }
      );
    }

    const parsedResult = phoneSchema.safeParse(rawPhone);
    if (!parsedResult.success) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const tenDigitPhone = parsedResult.data;
    const normalizedE164 = `+91${tenDigitPhone}`;

    // Verify OTP via MSG91
    const otpService = new Msg91OtpAdapter();
    const verifyResult = await otpService.verify(normalizedE164, rawOtp);

    if (!verifyResult.success) {
      return NextResponse.json(
        { success: false, error: "That code couldn't be verified. Check the code and try again." },
        { status: 400 }
      );
    }

    const userRepo = getUserRepository();
    const identityRepo = getAuthIdentityRepository();
    const sessionRepo = getSessionRepository();
    const challengeRepo = getQrActivationChallengeRepository();

    // Check if user already has an active session
    const cookieHeader = req.headers.get("cookie");
    const existingRawToken = parseSessionCookie(cookieHeader);
    let activeSession = null;
    if (existingRawToken) {
      activeSession = await validateSessionToken(existingRawToken, sessionRepo);
    }

    let userId: string;
    let userRecord = null;

    if (activeSession) {
      userId = activeSession.userId;
      const verifyRes = await verifyMobileForGoogleUser(userId, normalizedE164, userRepo, identityRepo);
      if (!verifyRes.success) {
        if (verifyRes.conflict) {
          return NextResponse.json(
            { success: false, error: "This mobile number is already linked to another account." },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, error: "Failed to verify mobile number." },
          { status: 400 }
        );
      }
      userRecord = verifyRes.user || (await userRepo.findById(userId));
    } else {
      const mobileResult = await handleMobileEntry(normalizedE164, userRepo, identityRepo);
      userId = mobileResult.user.id;
      userRecord = mobileResult.user;
    }

    // Attach user to current activation challenge if one exists
    const rawChallengeToken = parseCookie(cookieHeader, ACTIVATION_CHALLENGE_COOKIE_NAME);
    if (rawChallengeToken) {
      const challengeTokenHash = await hashToken(rawChallengeToken);
      const challenge = await challengeRepo.findByTokenHash(challengeTokenHash);
      if (challenge) {
        await challengeRepo.attachUser(challenge.id, userId);
      }
    }

    // Issue Secure Session Token in Cloudflare D1
    const { rawToken } = await issueSession(userId, sessionRepo, {
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress:
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        undefined,
    });
    const sessionCookieHeader = serializeSessionCookie(rawToken);

    const maskedPhone = `+91 ••••• ${tenDigitPhone.slice(-4)}`;

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userRecord?.name || null,
        phone: normalizedE164,
        phoneVerified: true,
        maskedPhone,
      },
    });

    response.headers.set("Set-Cookie", sessionCookieHeader);
    return response;
  } catch (err) {
    console.error("[VaahanSafe Activate] Verify OTP exception:", err);
    return NextResponse.json(
      { success: false, error: "We couldn't complete verification right now. Please try again." },
      { status: 500 }
    );
  }
}
