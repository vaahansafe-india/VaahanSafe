import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { ADMIN_SESSION_COOKIE_NAME } from "@vaahansafe/auth";
import {
  assertSameOrigin,
  requireAdmin,
  adminOrigin,
} from "../../../../lib/session";
import { adminFailure } from "../../../../lib/api";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const identity = await requireAdmin(undefined, { pendingEmail: true });
    const { error } = await getSupabaseAdminClient().rpc("admin_logout", {
      p_session: identity.sessionId,
      p_request: crypto.randomUUID(),
    });
    if (error) throw error;
    const response = NextResponse.redirect(
      new URL("/login", adminOrigin()),
      303,
    );
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    return adminFailure(error);
  }
}
