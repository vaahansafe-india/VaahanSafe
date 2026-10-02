import { NextRequest, NextResponse } from "next/server";
import { issueSession } from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "../../../../lib/session";
import { safeReturnUrl, customerAuthOrigin } from "../../../../lib/auth-navigation";

export async function GET(request: NextRequest) {
  try {
    const origin = customerAuthOrigin(request.url);
    const callback = new URL("/auth/callback", origin);
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("[Customer Google] GOOGLE_CLIENT_ID missing in environment");
      return NextResponse.redirect(new URL("/login?error=auth_unconfigured", request.url));
    }

    // Cryptographic CSRF state
    const state = crypto.randomUUID().replace(/-/g, "");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", callback.toString());
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "online");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    googleAuthUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(googleAuthUrl.toString());
    response.headers.set("Cache-Control", "no-store");

    const isSecure = process.env.NODE_ENV === "production";

    // Bind state parameter for CSRF validation in /auth/callback
    response.cookies.set("vs_google_state", state, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/auth/callback",
      maxAge: 600,
    });

    // Store return destination safely
    response.cookies.set("vs_google_return", safeReturnUrl(request.nextUrl.searchParams.get("returnUrl")), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/auth/callback",
      maxAge: 600,
    });

    if (request.nextUrl.searchParams.get("link") === "1") {
      const auth = await getAuthenticatedCustomer();
      if (!auth) return NextResponse.redirect(new URL("/login", request.url));
      const { rawToken } = await issueSession(auth.user.id, getSessionRepository(), { ttlSeconds: 600 });
      response.cookies.set("vs_google_link", rawToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 600,
        path: "/auth/callback",
      });
    } else {
      response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    }

    return response;
  } catch (error) {
    console.error("[Customer Google] Authorization initiation failed", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
