import { NextResponse } from "next/server";
import { adminOrigin } from "../../../../lib/session";
// Retired URLs remain safe bookmarks; Google cannot establish an admin session.
export function GET() {
  const response = NextResponse.redirect(new URL("/login", adminOrigin()));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
