import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@vaahansafe/ui/lib/server";
import { getUserRepository, getAuthIdentityRepository, getSessionRepository, getSupabaseAdminClient } from "@vaahansafe/database";
import { issueSession, validateSessionToken, CUSTOMER_SESSION_COOKIE_NAME, CUSTOMER_SESSION_MAX_AGE } from "@vaahansafe/auth";
import { safeReturnUrl, customerAuthOrigin } from "@/lib/auth-navigation";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) throw new Error("OAuth authorization code missing");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    const google = authUser?.identities?.find(identity => identity.provider === "google");
    if (userError || !authUser || !google || !authUser.email_confirmed_at || !authUser.email) throw new Error("Verified Google identity missing");
    const subject = google.id;
    const email = authUser.email.toLowerCase();
    const users = getUserRepository();
    const identities = getAuthIdentityRepository();
    const sessions = getSessionRepository();
    const existingIdentity = await identities.findByIdentity("GOOGLE", subject);
    const linkToken = request.cookies.get("vs_google_link")?.value;
    const linkSession = linkToken ? await validateSessionToken(linkToken, sessions) : null;
    if (linkToken && !linkSession) throw new Error("Secondary verification expired");
    if (linkSession && existingIdentity && existingIdentity.userId !== linkSession.userId) throw new Error("Google identity belongs to another account");
    let user = await users.findById(linkSession?.userId || existingIdentity?.userId || authUser.id);
    const emailOwner = await users.findByEmail(email);
    if (linkSession && emailOwner && emailOwner.id !== linkSession.userId) throw new Error("Email belongs to another account");
    if (!user && !linkSession) user = emailOwner;
    if (user && user.status !== "ACTIVE") throw new Error("Account unavailable");
    user = await users.save({ id: user?.id || authUser.id, email,
      name: user?.name || String(google.identity_data?.full_name || google.identity_data?.name || ""),
      ...(user ? {} : { role: "CUSTOMER" as const, status: "ACTIVE" as const, onboardingState: "AUTHENTICATED" as const }),
    });
    await identities.linkIdentity({ userId: user.id, provider: "GOOGLE", providerSubject: subject, normalizedIdentifier: email, verifiedAt: authUser.email_confirmed_at });
    const { error: profileError } = await getSupabaseAdminClient().from("users").update({ email_verified_at: authUser.email_confirmed_at }).eq("id", user.id);
    if (profileError) throw profileError;
    const phoneVerified = (await identities.findByUserId(user.id)).some(identity => identity.provider === "PHONE" && identity.providerSubject === user.phone && identity.verifiedAt);
    const returnUrl = safeReturnUrl(request.cookies.get("vs_google_return")?.value);
    const target = phoneVerified ? returnUrl : `/onboarding/verification?returnUrl=${encodeURIComponent(returnUrl)}`;
    const { rawToken } = await issueSession(user.id, sessions, { userAgent: request.headers.get("user-agent") || undefined });
    if (linkSession) await sessions.revokeSession(linkSession.tokenHash, "IDENTITY_LINKED");
    // Discard OAuth tokens after establishing the revocable customer session.
    await supabase.auth.signOut({ scope: "local" });
    const response = NextResponse.redirect(new URL(target, customerAuthOrigin(request.url)));
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, rawToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: CUSTOMER_SESSION_MAX_AGE,
    });
    response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_return", "", { maxAge: 0, path: "/auth/callback" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("[Customer Google] Callback failed", error);
    await supabase.auth.signOut({ scope: "local" });
    const response = NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
    response.cookies.set("vs_google_link", "", { maxAge: 0, path: "/auth/callback" });
    response.cookies.set("vs_google_return", "", { maxAge: 0, path: "/auth/callback" });
    return response;
  }
}
