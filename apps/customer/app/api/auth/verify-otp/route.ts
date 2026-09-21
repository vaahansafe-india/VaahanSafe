import { NextResponse } from "next/server";
import { phoneSchema } from "@vaahansafe/validation";
import { Msg91OtpAdapter, sendWelcomeEmail } from "@vaahansafe/notifications";
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
  getNotificationRepositories,
} from "@vaahansafe/database";

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

    // Validate phone number
    const parsedResult = phoneSchema.safeParse(rawPhone);
    if (!parsedResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't use that mobile number. Check it and try again.",
        },
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
        {
          success: false,
          error: "That code couldn't be verified. Check the code and try again.",
        },
        { status: 400 }
      );
    }

    const userRepo = getUserRepository();
    const identityRepo = getAuthIdentityRepository();
    const sessionRepo = getSessionRepository();
    const notifRepos = getNotificationRepositories();

    // Check if user already has an active session (e.g. Google-first user completing phone verification)
    const cookieHeader = req.headers.get("cookie");
    const existingRawToken = parseSessionCookie(cookieHeader);
    let activeSession = null;
    if (existingRawToken) {
      activeSession = await validateSessionToken(existingRawToken, sessionRepo);
    }

    let userId: string;
    let nextStep: string;
    let userRecord = null;

    if (activeSession) {
      // Google-first user completing mobile verification
      userId = activeSession.userId;
      const verifyRes = await verifyMobileForGoogleUser(userId, normalizedE164, userRepo, identityRepo);
      if (!verifyRes.success) {
        if (verifyRes.conflict) {
          return NextResponse.json(
            {
              success: false,
              error: "This mobile number is already linked to another account.",
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, error: "Failed to verify mobile number." },
          { status: 400 }
        );
      }
      userRecord = verifyRes.user || (await userRepo.findById(userId));
      nextStep = verifyRes.nextStep || "COMPLETE_PROFILE";
    } else {
      // Mobile-first login
      const mobileResult = await handleMobileEntry(normalizedE164, userRepo, identityRepo);
      userId = mobileResult.user.id;
      userRecord = mobileResult.user;
      nextStep = mobileResult.nextStep;
    }

    // If user has an email, dispatch welcome / phone verified email with VERIFIED status
    if (userRecord && userRecord.email) {
      try {
        const welcomeResult = await sendWelcomeEmail({
          to: userRecord.email,
          name: userRecord.name,
          phone: normalizedE164,
          phoneVerified: true,
          authProvider: "PHONE",
          appUrl: req.headers.get("origin") || "https://app.vaahansafe.com",
          isFirstLogin: false,
        });

        const intentId = `notif_int_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        const now = new Date().toISOString();

        await notifRepos.intents.save({
          id: intentId,
          eventType: "ACCOUNT_PHONE_VERIFIED" as any,
          recipientUserId: userId,
          category: "SECURITY",
          priority: "NORMAL",
          templateKey: "PHONE_VERIFIED_V1",
          templateVersion: 1,
          payload: {
            phone: normalizedE164,
            phoneVerified: true,
          },
          sourceType: "AUTH_VERIFICATION",
          sourceId: userId,
          dedupeKey: `phone_verified_${userId}_${tenDigitPhone}`,
          status: "PROCESSED",
          createdAt: now,
          dispatchedAt: now,
        });

        const notifId = `notif_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        await notifRepos.notifications.save({
          id: notifId,
          userId,
          intentId,
          eventType: "ACCOUNT_PHONE_VERIFIED" as any,
          category: "SECURITY",
          priority: "NORMAL",
          title: "Mobile Number Verified",
          bodySafe: `Your mobile number ${normalizedE164} is verified. Instant emergency alerts are now active for this account.`,
          actionType: "NONE",
          createdAt: now,
        });

        const deliveryId = `del_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        await notifRepos.deliveries.save({
          id: deliveryId,
          intentId,
          notificationId: notifId,
          channel: "EMAIL",
          provider: "EMAIL_PROVIDER" as any,
          status: welcomeResult.success ? "DELIVERED" : "FAILED_RETRYABLE",
          providerMessageId: welcomeResult.messageId || undefined,
          attemptCount: 1,
          createdAt: now,
          updatedAt: now,
          deliveredAt: welcomeResult.success ? now : undefined,
        });
      } catch (emailErr) {
        console.error("[VaahanSafe] Error dispatching phone verified email:", emailErr);
      }
    }

    // Issue Secure Session Token in Cloudflare D1
    const { rawToken } = await issueSession(userId, sessionRepo, {
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || undefined,
    });
    const sessionCookieHeader = serializeSessionCookie(rawToken);

    const response = NextResponse.json({
      success: true,
      nextStep,
    });

    response.headers.set("Set-Cookie", sessionCookieHeader);
    return response;
  } catch (err) {
    console.error("[VaahanSafe] Verify OTP exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't complete sign-in right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
