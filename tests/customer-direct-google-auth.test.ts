import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as handleGoogleInit } from "../apps/customer/app/api/auth/google/route";

describe("Direct Server-Side Google OAuth", () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id-123.apps.googleusercontent.com";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.vaahansafe.com";
  });

  afterEach(() => {
    if (originalClientId !== undefined) process.env.GOOGLE_CLIENT_ID = originalClientId;
    else delete process.env.GOOGLE_CLIENT_ID;

    if (originalAppUrl !== undefined) process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    else delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("redirects directly to accounts.google.com and never to supabase.co", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      const request = new NextRequest("http://localhost:3001/api/auth/google?returnUrl=%2Fvehicles");
      const response = await handleGoogleInit(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeDefined();

    const targetUrl = new URL(location!);
    // Direct Google OAuth authorization endpoint
    expect(targetUrl.origin).toBe("https://accounts.google.com");
    expect(targetUrl.pathname).toBe("/o/oauth2/v2/auth");

    // Must never redirect to Supabase
    expect(location).not.toContain("supabase.co");

    // Correct parameters
    expect(targetUrl.searchParams.get("client_id")).toBe("test-google-client-id-123.apps.googleusercontent.com");
    expect(targetUrl.searchParams.get("response_type")).toBe("code");
    expect(targetUrl.searchParams.get("scope")).toBe("openid email profile");
    expect(targetUrl.searchParams.get("prompt")).toBe("select_account");
    expect(targetUrl.searchParams.get("redirect_uri")).toBe("http://localhost:3001/auth/callback");

    // CSRF state bound
    const stateParam = targetUrl.searchParams.get("state");
    expect(stateParam).toBeTruthy();

    const stateCookie = response.cookies.get("vs_google_state");
    expect(stateCookie).toBeDefined();
    expect(stateCookie?.value).toBe(stateParam);
    expect(stateCookie?.httpOnly).toBe(true);
    expect(stateCookie?.path).toBe("/auth/callback");

    // Return URL cookie bound
    const returnCookie = response.cookies.get("vs_google_return");
    expect(returnCookie).toBeDefined();
    expect(returnCookie?.value).toBe("/vehicles");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("uses production domain https://app.vaahansafe.com when requested in production mode", async () => {
    const request = new NextRequest("https://app.vaahansafe.com/api/auth/google?returnUrl=%2Fsettings");
    const response = await handleGoogleInit(request);

    const location = response.headers.get("location");
    const targetUrl = new URL(location!);

    expect(targetUrl.searchParams.get("redirect_uri")).toBe("https://app.vaahansafe.com/auth/callback");
  });
});
