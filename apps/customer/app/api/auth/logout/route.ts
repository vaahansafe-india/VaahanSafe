import { NextResponse } from "next/server";
import {
  serializeClearSessionCookie,
  CUSTOMER_SESSION_COOKIE_NAME,
  parseSessionCookie,
  hashSessionToken,
} from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";

async function performLogout(req: Request) {
  // 1. Invalidate session record in Cloudflare D1 with bounded timeout
  const revokePromise = (async () => {
    try {
      const cookieHeader = req.headers.get("cookie");
      const rawToken = parseSessionCookie(cookieHeader, CUSTOMER_SESSION_COOKIE_NAME);
      if (rawToken) {
        const tokenHash = await hashSessionToken(rawToken);
        const sessionRepo = getSessionRepository();
        await sessionRepo.revokeSession(tokenHash, "USER_LOGOUT");
      }
    } catch (err) {
      console.warn("[VaahanSafe Logout] Session revocation in D1 skipped or failed:", err);
    }
  })();

  // Guarantee logout response returns in under 1s even if external D1 or CLI is lagging
  await Promise.race([
    revokePromise,
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);

  // 2. Resolve authoritative base URL behind reverse proxies and Vercel Edge
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const loginUrl = new URL("/login", `${proto}://${host}`);

  // 3. Serialize compliant RFC 6265 expired cookie with Secure attribute
  const isProduction = process.env.NODE_ENV !== "development";
  const clearCookieHeader = serializeClearSessionCookie(CUSTOMER_SESSION_COOKIE_NAME, {
    path: "/",
    secure: isProduction,
  });

  // 4. Return JSON for programmatic callers, or 303 See Other redirect for browser forms
  const acceptsJson =
    req.headers.get("accept")?.includes("application/json") &&
    !req.headers.get("content-type")?.includes("application/x-www-form-urlencoded");

  const response = acceptsJson
    ? NextResponse.json({ success: true, redirect: loginUrl.toString() }, { status: 200 })
    : NextResponse.redirect(loginUrl, { status: 303 });

  // 5. Apply cookie clearing to headers and Next.js response cookies
  response.headers.set("Set-Cookie", clearCookieHeader);
  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });
  response.cookies.set("vs_admin_session", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  });

  return response;
}

export async function POST(req: Request) {
  return performLogout(req);
}

export async function GET(req: Request) {
  return performLogout(req);
}
