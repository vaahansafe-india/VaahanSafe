import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  send: vi.fn(),
  requireAdmin: vi.fn(),
  origin: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("../apps/admin/lib/session", () => ({
  requireAdmin: state.requireAdmin,
  assertSameOrigin: state.origin,
  AdminError: class extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));
vi.mock("@vaahansafe/database", () => ({
  getSupabaseAdminClient: () => ({ rpc: state.rpc }),
}));
vi.mock("@vaahansafe/notifications", () => ({
  getEmailService: () => ({ sendEmail: state.send }),
}));
import { POST } from "../apps/admin/app/api/auth/email-otp/route";
import {
  sendAdminEmailChallenge,
  emailCodeHash,
  emailChallengeHash,
} from "../apps/admin/lib/email-otp";
import { AdminError } from "../apps/admin/lib/session";
const challenge = "a".repeat(64);
const identity = {
  id: "admin",
  sessionId: "session",
  email: "admin@vaahansafe.com",
};
const request = (body: object, cookie = challenge) =>
  new Request("https://admin.vaahansafe.com/api/auth/email-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "https://admin.vaahansafe.com",
      ...(cookie ? { cookie: `vs_admin_email_challenge=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("OTP_REQUEST_HASH_SECRET", "unit-test-secret-32-characters-long");
  for (const name of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"])
    vi.stubEnv(name, "unit-test-only");
  state.requireAdmin.mockResolvedValue(identity);
  state.rpc.mockResolvedValue({ data: true, error: null });
  state.send.mockResolvedValue({ success: true });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("Admin email challenge", () => {
  it("sends only to the server account after reservation and returns no code", async () => {
    const response = await POST(
      request({
        action: "send",
        email: "attacker@example.com",
        sessionId: "forged",
      }),
    );
    expect(response.status).toBe(200);
    const sent = state.send.mock.calls[0][0];
    expect(sent.to).toBe(identity.email);
    const code = sent.text.match(/code is (\d{6})\./)[1];
    const json = await response.json();
    expect(JSON.stringify(json)).not.toContain(code);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/api/auth/email-otp");
    expect(state.rpc.mock.calls.map((call) => call[0])).toEqual([
      "admin_reserve_email_otp",
      "admin_email_otp_dispatch",
    ]);
    expect(state.rpc.mock.invocationCallOrder[0]).toBeLessThan(
      state.send.mock.invocationCallOrder[0],
    );
    expect(state.send.mock.invocationCallOrder[0]).toBeLessThan(
      state.rpc.mock.invocationCallOrder[1],
    );
    expect(state.rpc.mock.calls[0][1].p_code).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(state.rpc.mock.calls)).not.toContain(code);
  });
  it("does not send when database rate limits deny reservation", async () => {
    state.rpc.mockResolvedValue({ data: false, error: null });
    expect((await POST(request({ action: "send" }))).status).toBe(429);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("invalidates a failed delivery and never reports sent", async () => {
    state.send.mockResolvedValue({ success: false });
    const response = await POST(request({ action: "send" }));
    expect(response.status).toBe(503);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(state.rpc.mock.calls[1][1]).toMatchObject({ p_success: false });
  });
  it("fails closed for missing SMTP or failed database", async () => {
    vi.stubEnv("SMTP_PASS", "");
    await expect(sendAdminEmailChallenge(identity)).rejects.toMatchObject({
      code: "EMAIL_UNAVAILABLE",
    });
    expect(state.rpc).not.toHaveBeenCalled();
    vi.stubEnv("SMTP_PASS", "unit-test-only");
    state.rpc.mockResolvedValue({ data: null, error: { code: "FAIL" } });
    expect((await POST(request({ action: "send" }))).status).toBe(503);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("ties verification to the session and HttpOnly challenge, then clears it", async () => {
    const response = await POST(
      request({ action: "verify", code: "482739", sessionId: "forged" }),
    );
    expect(response.status).toBe(200);
    expect(state.rpc).toHaveBeenCalledWith(
      "admin_verify_email_otp",
      expect.objectContaining({
        p_session: "session",
        p_challenge: emailChallengeHash(challenge),
        p_code: emailCodeHash("session", challenge, "482739", identity.email),
      }),
    );
    expect(
      emailCodeHash("other-session", challenge, "482739", identity.email),
    ).not.toBe(emailCodeHash("session", challenge, "482739", identity.email));
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await response.json()).toMatchObject({
      data: { verified: true, next: "/" },
    });
  });
  it("rejects wrong, expired, exhausted or replayed challenges denied by Supabase", async () => {
    state.rpc.mockResolvedValue({ data: false, error: null });
    expect(
      (await POST(request({ action: "verify", code: "482739" }))).status,
    ).toBe(400);
  });
  it("rejects missing challenge and malformed codes before database verification", async () => {
    expect(
      (await POST(request({ action: "verify", code: "482739" }, ""))).status,
    ).toBe(400);
    expect(
      (await POST(request({ action: "verify", code: "123" }))).status,
    ).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it("requires a password-authenticated Admin session and same origin", async () => {
    state.requireAdmin.mockRejectedValueOnce(
      new AdminError(401, "AUTH_REQUIRED", "Sign in."),
    );
    expect((await POST(request({ action: "send" }))).status).toBe(401);
    state.origin.mockImplementationOnce(() => {
      throw new AdminError(403, "ORIGIN_REJECTED", "Reload.");
    });
    expect((await POST(request({ action: "send" }))).status).toBe(403);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("bounds request bodies before processing their contents", async () => {
    expect(
      (await POST(request({ action: "send", extra: "x".repeat(600) }))).status,
    ).toBe(413);
    expect(state.send).not.toHaveBeenCalled();
  });
});
