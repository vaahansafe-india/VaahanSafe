import { NextResponse } from "next/server";
import { recognizeRetailQr } from "@/lib/activation-service";
import { parseSessionCookie, validateSessionToken } from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawId = body?.id || body?.publicId;

    if (!rawId || typeof rawId !== "string") {
      return NextResponse.json(
        { status: "INVALID", message: "QR identifier is required." },
        { status: 400 }
      );
    }

    // Optional user context from session
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

    const result = await recognizeRetailQr(rawId, currentUserId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[VaahanSafe Activate] Recognize error:", err);
    return NextResponse.json(
      {
        status: "UNAVAILABLE",
        message: "We couldn't verify this QR code right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
