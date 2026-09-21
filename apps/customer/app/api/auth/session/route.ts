import { NextResponse } from "next/server";
import { parseSessionCookie, validateSessionToken } from "@vaahansafe/auth";
import { getSessionRepository, getUserRepository } from "@vaahansafe/database";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const sessionToken = parseSessionCookie(cookieHeader);

    if (!sessionToken) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const sessionRepo = getSessionRepository();
    const userRepo = getUserRepository();

    const session = await validateSessionToken(sessionToken, sessionRepo);
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    const user = await userRepo.findById(session.userId);
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        onboardingState: user.onboardingState,
        status: user.status,
        phoneVerified: !!user.phone,
      },
    });
  } catch (err) {
    console.error("[VaahanSafe] Session validation error:", err);
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
}
