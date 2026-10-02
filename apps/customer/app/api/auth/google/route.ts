import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@vaahansafe/ui/lib/server";
import { issueSession } from "@vaahansafe/auth";
import { getSessionRepository } from "@vaahansafe/database";
import { getAuthenticatedCustomer } from "@/lib/session";
import { safeReturnUrl, customerAuthOrigin } from "@/lib/auth-navigation";

export async function GET(request: NextRequest) {
  try {
    const callback = new URL("/auth/callback", customerAuthOrigin(request.url));
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    });
    if (error || !data.url) throw error || new Error("Google authorization URL missing");
    const response = NextResponse.redirect(data.url);
    response.headers.set("Cache-Control", "no-store");
    // Use the exact allowlisted callback URL, without a query string.
    response.cookies.set("vs_google_return", safeReturnUrl(request.nextUrl.searchParams.get("returnUrl")), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/auth/callback", maxAge: 600,
    });
    if (request.nextUrl.searchParams.get("link") === "1") {
      const auth = await getAuthenticatedCustomer();
      if (!auth) return NextResponse.redirect(new URL("/login", request.url));
      const { rawToken } = await issueSession(auth.user.id, getSessionRepository(), { ttlSeconds: 600 });
      response.cookies.set("vs_google_link", rawToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/auth/callback" });
    } else {
      response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    }
    return response;
  } catch (error) {
    console.error("[Customer Google] Authorization unavailable", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
