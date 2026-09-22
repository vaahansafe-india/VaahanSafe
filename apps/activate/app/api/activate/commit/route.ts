import { NextResponse } from "next/server";
import { activateRetailQr } from "@/lib/activation-service";
import { parseCookie, serializeClearChallengeCookie, ACTIVATION_CHALLENGE_COOKIE_NAME } from "@/lib/crypto-helpers";
import { parseSessionCookie, validateSessionToken } from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const rawSessionToken = parseSessionCookie(cookieHeader);
    const rawChallengeToken = parseCookie(cookieHeader, ACTIVATION_CHALLENGE_COOKIE_NAME);

    if (!rawSessionToken) {
      return NextResponse.json(
        { success: false, error: "Please sign in to complete activation." },
        { status: 401 }
      );
    }

    if (!rawChallengeToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Your activation session has expired. Please verify your physical QR code again.",
        },
        { status: 400 }
      );
    }

    const sessionRepo = getSessionRepository();
    const activeSession = await validateSessionToken(rawSessionToken, sessionRepo);
    if (!activeSession) {
      return NextResponse.json(
        { success: false, error: "Your session has expired. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const vehicleId = body?.vehicleId;

    if (!vehicleId || typeof vehicleId !== "string") {
      return NextResponse.json(
        { success: false, error: "A vehicle selection is required." },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await activateRetailQr({
      challengeToken: rawChallengeToken,
      vehicleId,
      userId: activeSession.userId,
      clientIp,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Success: clear the activation challenge cookie
    const clearCookieHeader = serializeClearChallengeCookie();
    const response = NextResponse.json(result);
    response.headers.set("Set-Cookie", clearCookieHeader);
    return response;
  } catch (err) {
    console.error("[VaahanSafe Activate] Commit exception:", err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't activate your QR right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
