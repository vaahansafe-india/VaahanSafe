import { NextResponse } from "next/server";
import { serializeClearSessionCookie, CUSTOMER_SESSION_COOKIE_NAME } from "@vaahansafe/auth";

export async function POST(req: Request) {
  const clearCookieHeader = serializeClearSessionCookie(CUSTOMER_SESSION_COOKIE_NAME, {
    path: "/",
  });

  return new NextResponse(
    JSON.stringify({ success: true, message: "Logged out successfully" }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clearCookieHeader,
      },
    }
  );
}

export async function GET(req: Request) {
  const clearCookieHeader = serializeClearSessionCookie(CUSTOMER_SESSION_COOKIE_NAME, {
    path: "/",
  });

  return NextResponse.redirect(new URL("/login", req.url), {
    headers: {
      "Set-Cookie": clearCookieHeader,
    },
  });
}
