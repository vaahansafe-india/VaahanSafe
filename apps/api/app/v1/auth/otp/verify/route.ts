import { NextRequest, NextResponse } from "next/server";
import { phoneSchema } from "@vaahansafe/validation";
import { Msg91OtpAdapter } from "@vaahansafe/notifications";
import {
  handleMobileEntry,
  issueSession,
  serializeSessionCookie,
  OtpRequestGuard,
} from "@vaahansafe/auth";
import {
  getUserRepository,
  getAuthIdentityRepository,
  getSessionRepository,
  getCloudflareDatabaseClient,
} from "@vaahansafe/database";
import { getApiDatabase } from "../../../_db";

export const dynamic = "force-dynamic";

/**
 * Verify SMS OTP Endpoint (POST /v1/auth/otp/verify)
 *
 * Verifies code via MSG91, establishes persistent session in D1,
 * and sets HttpOnly cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body?.phone;
    const rawOtp = body?.otp;

    if (!rawPhone || !rawOtp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and OTP are required.", code: "ERR_MISSING_INPUT" },
        { status: 400 }
      );
    }

    const parsedPhone = phoneSchema.safeParse(rawPhone);
    if (!parsedPhone.success) {
      return NextResponse.json(
        { success: false, error: "Invalid mobile number format.", code: "ERR_INVALID_PHONE" },
        { status: 400 }
      );
    }

    const normalizedE164 = `+91${parsedPhone.data}`;
    const otpService = new Msg91OtpAdapter();
    const verified = await new OtpRequestGuard(getCloudflareDatabaseClient(), "API")
      .verify(normalizedE164, req, (challenge) => otpService.verify(normalizedE164, String(rawOtp).trim(), challenge.requestId, challenge.channel));

    if (!verified.success) {
      return NextResponse.json(
        { success: false, error: "Incorrect or expired verification code.", code: "ERR_OTP_INVALID" },
        { status: 400 }
      );
    }

    const db = getApiDatabase();
    const userRepo = getUserRepository(db);
    const identityRepo = getAuthIdentityRepository(db);
    const sessionRepo = getSessionRepository(db);

    const mobileResult = await handleMobileEntry(normalizedE164, userRepo, identityRepo);
    const user = mobileResult.user;

    // Issue new secure session
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

    const { rawToken, session } = await issueSession(user.id, sessionRepo, {
      userAgent,
      ipAddress,
    });

    const cookieHeader = serializeSessionCookie(rawToken);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: user.role,
          onboardingState: user.onboardingState,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      },
      { status: 200 }
    );

    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  } catch (error) {
    console.error("[ApiOtpVerify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Verification could not be completed. Please try again.", code: "ERR_VERIFICATION_FAILED" },
      { status: 500 }
    );
  }
}
