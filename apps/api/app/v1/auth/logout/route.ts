import { NextRequest, NextResponse } from "next/server";
import {
  hashSessionToken,
  serializeClearSessionCookie,
  CUSTOMER_SESSION_COOKIE_NAME,
  ADMIN_SESSION_COOKIE_NAME,
} from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";
import { getApiAuthContext } from "../../_auth";
import { getApiDatabase } from "../../_db";

export const dynamic = "force-dynamic";

/**
 * Logout Endpoint (POST /v1/auth/logout)
 *
 * Cryptographically revokes current session in D1 and clears session cookies.
 */
export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);

  if (auth && auth.rawToken) {
    try {
      const db = getApiDatabase();
      const sessionRepo = getSessionRepository(db);
      const tokenHash = await hashSessionToken(auth.rawToken);
      await sessionRepo.revokeSession(tokenHash, "USER_LOGOUT");
    } catch (err) {
      console.warn("[ApiLogout] Error revoking session record:", err);
    }
  }

  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { status: 200 }
  );

  response.headers.append("Set-Cookie", serializeClearSessionCookie(CUSTOMER_SESSION_COOKIE_NAME));
  response.headers.append("Set-Cookie", serializeClearSessionCookie(ADMIN_SESSION_COOKIE_NAME));

  return response;
}
