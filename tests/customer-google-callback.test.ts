import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const repos = vi.hoisted(() => ({
  users: { findById: vi.fn(), findByEmail: vi.fn(), save: vi.fn() },
  identities: { findByIdentity: vi.fn(), linkIdentity: vi.fn(), findByUserId: vi.fn() },
  sessions: { createSession: vi.fn(), findActiveByTokenHash: vi.fn(), revokeSession: vi.fn() },
}));

vi.mock("@vaahansafe/database", () => ({
  getUserRepository: () => repos.users,
  getAuthIdentityRepository: () => repos.identities,
  getSessionRepository: () => repos.sessions,
  getSupabaseAdminClient: () => null,
}));
vi.mock("@vaahansafe/ui/lib/server", () => ({ createClient: vi.fn() }));

import { GET } from "../apps/customer/app/auth/callback/route";

const existingUser = {
  id: "fe966ec7-3c37-4a7d-96e6-e684c5f30fce",
  email: "existing@example.com",
  phone: "+919876543210",
  status: "ACTIVE",
  role: "CUSTOMER",
  onboardingState: "COMPLETED",
};

function callback(extraCookies = "") {
  return new NextRequest("https://app.vaahansafe.com/auth/callback?code=authorization-code&state=bound-state", {
    headers: { cookie: `vs_google_state=bound-state; vs_google_return=/vehicles${extraCookies}` },
  });
}

describe("Customer Google callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("GOOGLE_CLIENT_ID", "unit-test-client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "unit-test-secret");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vaahansafe.com");
    vi.spyOn(console, "error").mockImplementation(() => {});
    repos.users.findById.mockImplementation(async (id: string) => {
      if (!id) throw new Error('invalid input syntax for type uuid: ""');
      return null;
    });
    repos.users.findByEmail.mockResolvedValue(null);
    repos.users.save.mockImplementation(async value => value);
    repos.identities.findByIdentity.mockResolvedValue(null);
    repos.identities.findByUserId.mockResolvedValue([]);
    repos.sessions.createSession.mockImplementation(async value => ({ ...value, id: "session-id" }));
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: "unit-test-access-token" }))
      .mockResolvedValueOnce(Response.json({ sub: "google-subject", email: "new@example.com", email_verified: true })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("creates a new Google account without an empty UUID lookup and requires mobile verification", async () => {
    const response = await GET(callback());
    expect(repos.users.findById).not.toHaveBeenCalled();
    expect(repos.users.save).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/), email: "new@example.com", onboardingState: "PHONE_REQUIRED",
    }));
    expect(response.headers.get("location")).toBe("https://app.vaahansafe.com/onboarding/phone?returnUrl=%2Fvehicles");
    const cookie = response.cookies.get("vs_session");
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(repos.sessions.createSession).toHaveBeenCalledOnce();
    expect(repos.sessions.createSession.mock.calls[0][0].tokenHash).not.toBe(cookie?.value);
    expect(response.cookies.get("vs_google_state")?.maxAge).toBe(0);
  });

  it("returns an existing Google user with verified mobile to their requested app page", async () => {
    repos.identities.findByIdentity.mockResolvedValue({ userId: existingUser.id });
    repos.users.findById.mockResolvedValue(existingUser);
    repos.users.save.mockResolvedValue(existingUser);
    repos.identities.findByUserId.mockResolvedValue([{ provider: "PHONE", providerSubject: existingUser.phone, verifiedAt: "2026-10-03T00:00:00Z" }]);
    const response = await GET(callback());
    expect(repos.users.findById).toHaveBeenCalledWith(existingUser.id);
    expect(response.headers.get("location")).toBe("https://app.vaahansafe.com/vehicles");
  });

  it("reuses an existing account by verified Google email without creating a duplicate", async () => {
    repos.users.findByEmail.mockResolvedValue(existingUser);
    repos.users.save.mockResolvedValue(existingUser);
    const response = await GET(callback());
    expect(repos.users.save).toHaveBeenCalledWith(expect.objectContaining({ id: existingUser.id }));
    expect(repos.identities.linkIdentity).toHaveBeenCalledWith(expect.objectContaining({ userId: existingUser.id }));
    expect(response.headers.get("location")).toContain("/onboarding/phone?");
  });

  it("rejects an unverified Google email before linking or issuing a session", async () => {
    vi.mocked(fetch).mockReset()
      .mockResolvedValueOnce(Response.json({ access_token: "unit-test-access-token" }))
      .mockResolvedValueOnce(Response.json({ sub: "google-subject", email: "new@example.com", email_verified: false }));
    const response = await GET(callback());
    expect(response.headers.get("location")).toContain("/login?error=auth_failed");
    expect(repos.users.save).not.toHaveBeenCalled();
    expect(repos.sessions.createSession).not.toHaveBeenCalled();
  });

  it("rejects a broken identity reference instead of creating an unrelated replacement account", async () => {
    repos.identities.findByIdentity.mockResolvedValue({ userId: existingUser.id });
    const response = await GET(callback());
    expect(response.headers.get("location")).toContain("/login?error=auth_failed");
    expect(repos.users.save).not.toHaveBeenCalled();
  });

  it("rejects linking a Google identity already owned by another account", async () => {
    repos.sessions.findActiveByTokenHash.mockResolvedValue({
      userId: existingUser.id, lastSeenAt: new Date().toISOString(),
    });
    repos.identities.findByIdentity.mockResolvedValue({ userId: "332dc6df-1f61-4eb4-89be-5a53517b419a" });
    const response = await GET(callback(`; vs_google_link=${"a".repeat(64)}`));
    expect(response.headers.get("location")).toContain("/login?error=auth_failed");
    expect(repos.identities.linkIdentity).not.toHaveBeenCalled();
    expect(repos.sessions.createSession).not.toHaveBeenCalled();
  });

  it("returns a recoverable failure without a session when the account database is unavailable", async () => {
    repos.users.findByEmail.mockRejectedValue(new Error("database unavailable"));
    const response = await GET(callback());
    expect(response.headers.get("location")).toContain("/login?error=auth_failed");
    expect(response.cookies.get("vs_session")).toBeUndefined();
    expect(repos.identities.linkIdentity).not.toHaveBeenCalled();
  });

  it("rejects mismatched CSRF state before contacting Google", async () => {
    const response = await GET(new NextRequest("https://app.vaahansafe.com/auth/callback?code=authorization-code&state=wrong-state"));
    expect(fetch).not.toHaveBeenCalled();
    expect(response.cookies.get("vs_session")).toBeUndefined();
  });
});
