import { NextResponse } from "next/server";
import { verifyActivationProof } from "@/lib/activation-service";
import { serializeChallengeCookie } from "@/lib/crypto-helpers";
import { parseSessionCookie, validateSessionToken } from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const publicId = body?.publicId || body?.id;
    const scratchCode = body?.scratchCode || body?.code;

    if (!publicId || !scratchCode) {
      return NextResponse.json(
        { success: false, error: "QR code and activation code are required." },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // Optional user context
    const cookieHeader = req.headers.get("cookie");
    const rawSessionToken = parseSessionCookie(cookieHeader);
    let currentUserId: string | undefined;

    if (rawSessionToken) {
      const sessionRepo = getSessionRepository();
      const activeSession = await validateSessionToken(rawSessionToken, sessionRepo);
      if (activeSession) {
        currentUserId = activeSession.userId;
      }
    }

    const result = await verifyActivationProof({
      publicId,
      scratchCode,
      clientIp,
      userAgent,
      currentUserId,
    });

    if (!result.success || !result.challengeToken) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          isLocked: result.isLocked,
          lockedUntil: result.lockedUntil,
        },
        { status: result.isLocked ? 429 : 400 }
      );
    }

    // Set HttpOnly activation challenge cookie
    const challengeCookie = serializeChallengeCookie(result.challengeToken);
    const response = NextResponse.json({
      success: true,
      publicId: result.publicId,
      visibleCode: result.visibleCode,
      expiresAt: result.expiresAt,
    });

    response.headers.set("Set-Cookie", challengeCookie);
    return response;
  } catch (err) {
    console.error("[VaahanSafe Activate] Verify Proof error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't verify this activation code right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
