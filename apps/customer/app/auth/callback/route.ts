import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@vaahansafe/ui/lib/server";
import { getUserRepository, getAuthIdentityRepository, getSessionRepository, getSupabaseAdminClient } from "@vaahansafe/database";
import { issueSession, validateSessionToken, CUSTOMER_SESSION_COOKIE_NAME, CUSTOMER_SESSION_MAX_AGE } from "@vaahansafe/auth";
import { safeReturnUrl, customerAuthOrigin } from "../../../lib/auth-navigation";

export async function GET(request: NextRequest) {
  const origin = customerAuthOrigin(request.url);
  const redirectUri = new URL("/auth/callback", origin).toString();

  // If user cancelled on Google consent screen
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    console.warn("[Customer Google] OAuth returned error from Google:", oauthError);
    const response = NextResponse.redirect(new URL("/login?error=google_cancelled", origin));
    response.cookies.set("vs_google_state", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_return", "", { maxAge: 0, path: "/auth/callback" });
    return response;
  }

  try {
    const code = request.nextUrl.searchParams.get("code");
    const stateParam = request.nextUrl.searchParams.get("state");
    const stateCookie = request.cookies.get("vs_google_state")?.value;

    if (!code) throw new Error("OAuth authorization code missing");

    // CSRF verification
    if (!stateParam || !stateCookie || stateParam !== stateCookie) {
      console.warn("[Customer Google] CSRF state mismatch or missing");
      throw new Error("CSRF state verification failed");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials unconfigured");
    }

    // Direct Google OAuth Token Exchange via official Google endpoint
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[Customer Google] Token exchange failed:", errText);
      throw new Error("Google token exchange failed");
    }

    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
      token_type?: string;
      expires_in?: number;
    };

    if (!tokens.access_token) {
      throw new Error("Google access token missing in exchange response");
    }

    // Fetch verified profile directly from Google OpenID UserInfo endpoint
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      throw new Error("Failed to retrieve Google user profile");
    }

    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!profile.sub || !profile.email) {
      throw new Error("Verified Google identity missing required fields");
    }

    const subject = profile.sub;
    const email = profile.email.toLowerCase();
    const verifiedAt = new Date().toISOString();

    const users = getUserRepository();
    const identities = getAuthIdentityRepository();
    const sessions = getSessionRepository();

    const existingIdentity = await identities.findByIdentity("GOOGLE", subject);
    const linkToken = request.cookies.get("vs_google_link")?.value;
    const linkSession = linkToken ? await validateSessionToken(linkToken, sessions) : null;

    if (linkToken && !linkSession) throw new Error("Secondary verification expired");
    if (linkSession && existingIdentity && existingIdentity.userId !== linkSession.userId) {
      throw new Error("Google identity belongs to another account");
    }

    let user = await users.findById(linkSession?.userId || existingIdentity?.userId || "");
    const emailOwner = await users.findByEmail(email);

    if (linkSession && emailOwner && emailOwner.id !== linkSession.userId) {
      throw new Error("Email belongs to another account");
    }
    if (!user && !linkSession) user = emailOwner;
    if (user && user.status !== "ACTIVE") throw new Error("Account unavailable");

    user = await users.save({
      id: user?.id || crypto.randomUUID(),
      email,
      name: user?.name || profile.name || "",
      ...(user ? {} : { role: "CUSTOMER" as const, status: "ACTIVE" as const, onboardingState: "AUTHENTICATED" as const }),
    });

    await identities.linkIdentity({
      userId: user.id,
      provider: "GOOGLE",
      providerSubject: subject,
      normalizedIdentifier: email,
      verifiedAt,
    });

    try {
      const adminClient = getSupabaseAdminClient();
      if (adminClient) {
        await adminClient.from("users").update({ email_verified_at: verifiedAt }).eq("id", user.id);
      }
    } catch {
      // Non-blocking sync
    }

    // Synchronize Supabase session with Google id_token if provided
    if (tokens.id_token) {
      try {
        const supabase = await createClient();
        await supabase.auth.signInWithIdToken({
          provider: "google",
          token: tokens.id_token,
        });
      } catch (err) {
        console.warn("[Customer Google] Optional Supabase id_token sync notice:", err);
      }
    }

    const phoneVerified = (await identities.findByUserId(user.id)).some(
      identity => identity.provider === "PHONE" && identity.providerSubject === user.phone && identity.verifiedAt
    );
    const returnUrl = safeReturnUrl(request.cookies.get("vs_google_return")?.value);
    const target = phoneVerified ? returnUrl : `/onboarding/verification?returnUrl=${encodeURIComponent(returnUrl)}`;

    const { rawToken } = await issueSession(user.id, sessions, {
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || undefined,
    });

    if (linkSession) await sessions.revokeSession(linkSession.tokenHash, "IDENTITY_LINKED");

    const response = NextResponse.redirect(new URL(target, origin));
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE,
    });
    response.cookies.set("vs_google_state", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_return", "", { maxAge: 0, path: "/auth/callback" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("[Customer Google] Callback failed", error);
    const response = NextResponse.redirect(new URL("/login?error=auth_failed", origin));
    response.cookies.set("vs_google_state", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_return", "", { maxAge: 0, path: "/auth/callback" });
    return response;
  }
}
