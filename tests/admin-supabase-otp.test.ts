import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rpc: vi.fn(), send: vi.fn(), verify: vi.fn(), requireAdmin: vi.fn(), assertOrigin: vi.fn(),
  session: { pending_phone: null as string | null, otp_sent_at: null as string | null, otp_attempts: 0 },
  actor: { verified_mobile: null as string | null },
}));
vi.mock("../apps/admin/lib/session", () => ({
  requireAdmin: state.requireAdmin,
  assertSameOrigin: state.assertOrigin,
  AdminError: class extends Error {
    constructor(public status: number, public code: string, message: string) { super(message); }
  },
}));
vi.mock("@vaahansafe/database", async () => ({
  SupabaseOtpRequestStore: (await import("../packages/database/src/repositories/supabase-otp.repository")).SupabaseOtpRequestStore,
  getSupabaseAdminClient: () => ({
    rpc: state.rpc,
    from: (table: string) => ({ select: () => ({ eq: () => ({ single: async () => ({
      data: table === "admin_sessions" ? state.session : state.actor, error: null,
    }) }) }) }),
  }),
}));
vi.mock("../packages/database/src/repositories/supabase-auth.repository", () => ({
  getSupabaseAdminClient: () => ({ rpc: state.rpc }),
}));
vi.mock("@vaahansafe/notifications", () => ({
  getOtpDeliveryAvailability: () => ({ WHATSAPP: true, SMS: false }),
  Msg91OtpAdapter: class { send = state.send; verify = state.verify; },
}));
import { POST } from "../apps/admin/app/api/auth/otp/route";
import { AdminError } from "../apps/admin/lib/session";

const phone = "+919876543210";
const request = (body: object, cookie?: string) => new Request("https://admin.vaahansafe.com/api/auth/otp", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "https://admin.vaahansafe.com", ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SESSION_SECRET", "unit-test-admin-otp-hash-secret");
  vi.stubEnv("OTP_REQUEST_HASH_SECRET", "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  state.session = { pending_phone: null, otp_sent_at: null, otp_attempts: 0 };
  state.actor = { verified_mobile: null };
  state.requireAdmin.mockResolvedValue({ id: "admin", sessionId: "session" });
  state.rpc.mockResolvedValue({ data: true, error: null });
  state.send.mockResolvedValue({ success: true, channel: "WHATSAPP", requestId: "provider-reference" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("Admin OTP with Supabase abuse controls", () => {
  it("sends without Turnstile only after both database reservations, with a protected cookie", async () => {
    const response = await POST(request({ action: "send", phone }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly; SameSite=Lax; Path=/; Max-Age=300; Secure");
    expect(state.requireAdmin).toHaveBeenCalledWith(undefined, { pendingPhone: true });
    expect(state.assertOrigin).toHaveBeenCalled();
    expect(state.rpc.mock.calls.map(call => call[0])).toEqual(["admin_reserve_otp", "auth_otp_reserve", "auth_otp_finish_dispatch"]);
    expect(state.rpc.mock.invocationCallOrder[1]).toBeLessThan(state.send.mock.invocationCallOrder[0]);
  });
  it.each(["admin_reserve_otp", "auth_otp_reserve"])("never dispatches when %s denies the request", async (operation) => {
    state.rpc.mockImplementation(async name => name === operation
      ? { data: false, error: name === "admin_reserve_otp" ? { code: "P0001" } : null }
      : { data: true, error: null });
    expect((await POST(request({ action: "send", phone }))).status).toBe(429);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("rejects missing sessions and wrong origins before provider dispatch", async () => {
    state.requireAdmin.mockRejectedValueOnce(new AdminError(401, "AUTH_REQUIRED", "Sign in."));
    expect((await POST(request({ action: "send", phone }))).status).toBe(401);
    state.assertOrigin.mockImplementationOnce(() => { throw new AdminError(403, "ORIGIN_REJECTED", "Reload."); });
    expect((await POST(request({ action: "send", phone }))).status).toBe(403);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("cannot change a previously verified admin mobile", async () => {
    state.actor.verified_mobile = "+919999999999";
    expect((await POST(request({ action: "send", phone }))).status).toBe(400);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("fails closed when Supabase challenge storage is unavailable", async () => {
    state.rpc.mockImplementation(async name => ({ data: true, error: name === "auth_otp_reserve" ? { code: "08006" } : null }));
    expect((await POST(request({ action: "send", phone }))).status).toBe(503);
    expect(state.send).not.toHaveBeenCalled();
  });
  it("does not mark a phone verified without a matching challenge", async () => {
    state.session = { pending_phone: phone, otp_sent_at: new Date().toISOString(), otp_attempts: 0 };
    expect((await POST(request({ action: "verify", code: "654321" }))).status).toBe(400);
    expect(state.verify).not.toHaveBeenCalled();
    expect(state.rpc.mock.calls.map(call => call[0])).not.toContain("admin_complete_phone");
  });
});
