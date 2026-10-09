import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  password: vi.fn(),
  signOut: vi.fn(),
  query: vi.fn(),
  cookie: "a".repeat(48),
  session: null as Record<string, unknown> | null,
  actor: null as Record<string, unknown> | null,
  error: null as object | null,
  filters: [] as unknown[][],
  emailSend: vi.fn(),
}));
vi.mock("../apps/admin/lib/email-otp", () => ({
  sendAdminEmailChallenge: state.emailSend,
  EMAIL_CHALLENGE_COOKIE: "vs_admin_email_challenge",
  emailChallengeCookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/email-otp",
    maxAge: 300,
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (state.cookie ? { value: state.cookie } : undefined),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("@vaahansafe/auth", () => ({
  ADMIN_SESSION_COOKIE_NAME: "vs_admin_session",
  generateRawSessionToken: () => "a".repeat(48),
  hashSessionToken: async () => "b".repeat(64),
}));
vi.mock("@vaahansafe/database", () => ({
  getSupabaseClient: () => ({
    auth: { signInWithPassword: state.password, signOut: state.signOut },
  }),
  getSupabaseAdminClient: () => ({
    rpc: state.rpc,
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: (...args: unknown[]) => {
          state.filters.push([table, "eq", ...args]);
          return chain;
        },
        is: (...args: unknown[]) => {
          state.filters.push([table, "is", ...args]);
          return chain;
        },
        gt: (...args: unknown[]) => {
          state.filters.push([table, "gt", ...args]);
          return chain;
        },
        maybeSingle: async () => state.query(table),
        insert: async () => ({ error: null }),
      };
      return chain;
    },
  }),
}));

import { POST } from "../apps/admin/app/api/auth/password/route";
import {
  getAdminIdentity,
  requireAdmin,
  requireAdminPage,
} from "../apps/admin/lib/session";
import VerifyPhone from "../apps/admin/app/verify-phone/page";

const request = (
  email = "admin@vaahansafe.com",
  origin = "https://admin.vaahansafe.com",
) =>
  new Request("https://admin.vaahansafe.com/api/auth/password", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify({
      email,
      password: "unit-test-only-password",
      phoneVerified: true,
      role: "SUPER_ADMIN",
    }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ADMIN_ORIGIN", "https://admin.vaahansafe.com");
  state.cookie = "a".repeat(48);
  state.error = null;
  state.filters = [];
  state.session = {
    id: "session",
    admin_id: "admin",
    phone_verified_at: null,
    email_verified_at: new Date().toISOString(),
    step_up_at: null,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
  };
  state.actor = {
    id: "admin",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    email: "admin@vaahansafe.com",
    name: "Administrator",
  };
  state.query.mockImplementation(async (table: string) => ({
    data: table === "admin_sessions" ? state.session : state.actor,
    error: state.error,
  }));
  state.rpc.mockImplementation(async (name) => ({
    data: name === "admin_password_session" ? "session" : true,
    error: null,
  }));
  state.emailSend.mockResolvedValue("c".repeat(64));
  state.password.mockResolvedValue({
    data: {
      user: {
        id: "auth-user",
        email: "admin@vaahansafe.com",
        email_confirmed_at: new Date().toISOString(),
      },
    },
    error: null,
  });
  state.signOut.mockResolvedValue({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Admin password and email sign-in", () => {
  it("requires an email challenge after password authorization and session creation", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: { next: "/verify-email" },
    });
    const cookie = response.headers.get("set-cookie")!;
    for (const part of [
      "vs_admin_session=",
      "HttpOnly",
      "Secure",
      "SameSite=lax",
      "Max-Age=14400",
    ])
      expect(cookie).toContain(part);
    expect(state.rpc.mock.calls.map((call) => call[0])).toEqual([
      "admin_reserve_password_attempt",
      "admin_password_session",
    ]);
    expect(state.rpc.mock.invocationCallOrder[0]).toBeLessThan(
      state.password.mock.invocationCallOrder[0],
    );
    expect(state.password.mock.invocationCallOrder[0]).toBeLessThan(
      state.rpc.mock.invocationCallOrder[1],
    );
    expect(state.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(state.emailSend).toHaveBeenCalledWith({
      sessionId: "session",
      email: "admin@vaahansafe.com",
    });
  });
  it("denies wrong passwords without issuing a session", async () => {
    state.password.mockResolvedValue({
      data: { user: null },
      error: { status: 400 },
    });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(state.rpc.mock.calls.map((call) => call[0])).toEqual([
      "admin_reserve_password_attempt",
    ]);
  });
  it("rejects non-admin identities even with valid Supabase credentials", async () => {
    state.actor = null;
    expect((await POST(request())).status).toBe(401);
    expect(state.rpc).not.toHaveBeenCalledWith(
      "admin_password_session",
      expect.anything(),
    );
  });
  it("rejects an unconfirmed email before creating a session", async () => {
    state.password.mockResolvedValue({
      data: { user: { id: "auth-user", email: "admin@vaahansafe.com" } },
      error: null,
    });
    expect((await POST(request())).status).toBe(401);
    expect(state.rpc.mock.calls).toHaveLength(1);
  });
  it("fails closed when the session database rejects creation", async () => {
    state.rpc.mockImplementation(async (name: string) => ({
      data: true,
      error: name === "admin_password_session" ? { code: "FAIL" } : null,
    }));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("keeps same-origin and attempt limits before password verification", async () => {
    expect(
      (await POST(request(undefined, "https://other.example"))).status,
    ).toBe(403);
    expect(state.password).not.toHaveBeenCalled();
    state.rpc.mockResolvedValue({ data: false, error: null });
    expect((await POST(request())).status).toBe(429);
    expect(state.password).not.toHaveBeenCalled();
  });
  it("permits email-verified access without fabricating mobile verification", async () => {
    expect(await requireAdmin("customers")).toMatchObject({
      phoneVerified: false,
      stepUpAt: null,
    });
    expect(await requireAdminPage("customers")).toMatchObject({
      phoneVerified: false,
    });
    expect(state.filters).toContainEqual([
      "admin_sessions",
      "is",
      "revoked_at",
      null,
    ]);
    expect(state.filters).toContainEqual([
      "admin_users",
      "eq",
      "status",
      "ACTIVE",
    ]);
    expect(
      state.filters.some(
        (filter) =>
          filter[0] === "admin_sessions" &&
          filter[1] === "gt" &&
          filter[2] === "expires_at",
      ),
    ).toBe(true);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("retains role and fresh OTP checks for sensitive actions", async () => {
    await expect(
      requireAdmin("inventory", { stepUp: true }),
    ).rejects.toMatchObject({ code: "STEP_UP_REQUIRED" });
    state.actor!.role = "SUPPORT_AGENT";
    await expect(requireAdmin("payments")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("blocks password-only sessions and redirects them to email verification", async () => {
    state.session!.email_verified_at = null;
    await expect(requireAdmin("customers")).rejects.toMatchObject({
      code: "EMAIL_REQUIRED",
    });
    await expect(requireAdminPage("customers")).rejects.toThrow(
      "REDIRECT:/verify-email",
    );
    expect(await requireAdmin(undefined, { pendingEmail: true })).toMatchObject(
      { emailVerified: false },
    );
    await expect(VerifyPhone()).rejects.toThrow("REDIRECT:/verify-email");
  });
  it("does not issue a browser session when email dispatch fails", async () => {
    state.emailSend.mockRejectedValue(new Error("Sender unavailable"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("denies missing, expired, and invalid-role sessions", async () => {
    state.cookie = "";
    expect(await getAdminIdentity()).toBeNull();
    await expect(requireAdmin("customers")).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
    });
    state.cookie = "a".repeat(48);
    state.session!.created_at = new Date(
      Date.now() - 5 * 3600000,
    ).toISOString();
    expect(await getAdminIdentity()).toBeNull();
    state.session!.created_at = new Date().toISOString();
    state.actor!.role = "CUSTOMER";
    expect(await getAdminIdentity()).toBeNull();
  });
  it("moves old phone-verification bookmarks to the dashboard or login", async () => {
    await expect(VerifyPhone()).rejects.toThrow("REDIRECT:/");
    state.cookie = "";
    await expect(VerifyPhone()).rejects.toThrow("REDIRECT:/login");
  });
});
