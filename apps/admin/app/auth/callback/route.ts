import { NextResponse } from "next/server";
import { adminOrigin } from "../../../lib/session";
export function GET() {
  const response = NextResponse.redirect(new URL("/login", adminOrigin()));
  response.cookies.set("vs_admin_oauth_state", "", {
    path: "/auth/callback",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
