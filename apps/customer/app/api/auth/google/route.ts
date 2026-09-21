import dns from "node:dns";
if (typeof dns !== "undefined" && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

import { NextResponse } from "next/server";
import { DOMAINS } from "@vaahansafe/config";
import {
  handleGoogleEntry,
  issueSession,
  serializeSessionCookie,
} from "@vaahansafe/auth";
import {
  getUserRepository,
  getAuthIdentityRepository,
  getSessionRepository,
  getNotificationRepositories,
} from "@vaahansafe/database";
import { sendWelcomeEmail } from "@vaahansafe/notifications";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const customerBase = origin || DOMAINS.customer || "http://localhost:3001";
  const redirectUri = `${customerBase}/api/auth/google`;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // If user cancelled on Google consent screen or an error occurred
  if (error) {
    return NextResponse.redirect(new URL("/login?error=google_cancelled", customerBase));
  }

  // If callback with authorization code
  if (code) {
    let profile: { sub: string; email: string; name?: string } | null = null;

    // Real Google OAuth Token Exchange
    if (clientId && clientSecret && code !== "simulated_google_oauth_code") {
      try {
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
          console.error("Google token exchange failed:", errText);
          return NextResponse.redirect(
            new URL("/login?error=token_exchange_failed", customerBase)
          );
        }

        const tokens = (await tokenRes.json()) as { access_token?: string };
        if (tokens.access_token) {
          const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (userRes.ok) {
            const rawProfile = (await userRes.json()) as {
              sub: string;
              email?: string;
              name?: string;
            };
            if (rawProfile.sub && rawProfile.email) {
              profile = {
                sub: rawProfile.sub,
                email: rawProfile.email,
                name: rawProfile.name,
              };
            }
          }
        }
      } catch (err) {
        console.error("Google OAuth callback exception:", err);
        return NextResponse.redirect(
          new URL("/login?error=auth_failed", customerBase)
        );
      }
    } else if (code === "simulated_google_oauth_code") {
      // Local development simulation
      profile = {
        sub: "simulated_google_sub_user_01",
        email: "demo.customer@vaahansafe.com",
        name: "Demo Customer",
      };
    }

    if (!profile || !profile.email || !profile.sub) {
      return NextResponse.redirect(
        new URL("/login?error=identity_missing", customerBase)
      );
    }

    // Connect to real Cloudflare D1 Repositories
    const userRepo = getUserRepository();
    const identityRepo = getAuthIdentityRepository();
    const sessionRepo = getSessionRepository();
    const notifRepos = getNotificationRepositories();

    // Execute Authoritative Google Entry State Machine
    const googleResult = await handleGoogleEntry(profile, userRepo, identityRepo);

    // If first-time user login: dispatch welcome email and record in Cloudflare D1
    if (googleResult.isNewUser) {
      try {
        const welcomeResult = await sendWelcomeEmail({
          to: profile.email,
          name: profile.name,
          phone: undefined,
          phoneVerified: false,
          authProvider: "GOOGLE",
          appUrl: customerBase,
          isFirstLogin: true,
        });

        const intentId = `notif_int_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        const now = new Date().toISOString();

        // 1. Authoritative Notification Intent in Cloudflare D1
        await notifRepos.intents.save({
          id: intentId,
          eventType: "ACCOUNT_WELCOME" as any,
          recipientUserId: googleResult.user.id,
          category: "ACCOUNT",
          priority: "NORMAL",
          templateKey: "WELCOME_V1",
          templateVersion: 1,
          payload: {
            email: profile.email,
            name: profile.name,
            phoneVerified: false,
            authProvider: "GOOGLE",
          },
          sourceType: "AUTH_REGISTRATION",
          sourceId: googleResult.user.id,
          dedupeKey: `welcome_${googleResult.user.id}`,
          status: "PROCESSED",
          createdAt: now,
          dispatchedAt: now,
        });

        // 2. Canonical In-App Notification in Cloudflare D1
        const notifId = `notif_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        await notifRepos.notifications.save({
          id: notifId,
          userId: googleResult.user.id,
          intentId,
          eventType: "ACCOUNT_WELCOME" as any,
          category: "ACCOUNT",
          priority: "NORMAL",
          title: "Welcome to VaahanSafe",
          bodySafe: "Action required: Verify your mobile number to link vehicle safety identities and emergency alerts.",
          actionType: "VIEW_SECURITY",
          actionTarget: "/onboarding/phone",
          createdAt: now,
        });

        // 3. Notification Delivery Record in Cloudflare D1
        const deliveryId = `del_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
        await notifRepos.deliveries.save({
          id: deliveryId,
          intentId,
          notificationId: notifId,
          channel: "EMAIL",
          provider: "EMAIL_PROVIDER" as any,
          status: welcomeResult.success ? "DELIVERED" : "FAILED_RETRYABLE",
          providerMessageId: welcomeResult.messageId || undefined,
          attemptCount: 1,
          createdAt: now,
          updatedAt: now,
          deliveredAt: welcomeResult.success ? now : undefined,
        });
      } catch (emailErr) {
        console.error("[VaahanSafe] Error sending first-login welcome email:", emailErr);
      }
    }

    // Issue Secure Session Token in Cloudflare D1
    const { rawToken } = await issueSession(googleResult.user.id, sessionRepo, {
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || undefined,
    });
    const cookieHeader = serializeSessionCookie(rawToken);

    // Forward to phone verification if unverified, otherwise to customer dashboard
    const isPhoneRequired =
      googleResult.user.onboardingState === "PHONE_REQUIRED" || !googleResult.user.phone;
    const targetUrl = new URL(
      isPhoneRequired ? "/onboarding/phone" : "/dashboard",
      customerBase
    );
    if (isPhoneRequired) {
      targetUrl.searchParams.set("returnUrl", "/dashboard");
    }

    const response = NextResponse.redirect(targetUrl);
    response.headers.set("Set-Cookie", cookieHeader);
    return response;
  }

  // Google OAuth Initiation
  if (clientId && clientId !== "placeholder_google_oauth_client_id") {
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "online");
    googleAuthUrl.searchParams.set("prompt", "select_account");

    return NextResponse.redirect(googleAuthUrl.toString());
  }

  // Graceful development fallback: simulated demo callback code
  return NextResponse.redirect(
    new URL("/api/auth/google?code=simulated_google_oauth_code", customerBase)
  );
}
