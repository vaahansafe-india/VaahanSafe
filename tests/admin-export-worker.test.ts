import { describe, it, expect, vi, afterEach } from "vitest";
import { processExportJobs } from "../infrastructure/cloudflare/workers/admin-exports/src/index";
afterEach(() => vi.unstubAllGlobals());
const job = {
  id: "f0228fbb-41d0-4b0d-8205-a7f8801a3ac6",
  actor_id: "test-admin",
  module_key: "customers",
  status: "QUEUED",
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  object_key: null,
  updated_at: new Date().toISOString(),
};
function fixture(role: string, claim = true) {
  const transitions: Record<string, unknown>[] = [];
  const put = vi.fn().mockResolvedValue(undefined),
    del = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      const path = new URL(url).pathname;
      if (path.endsWith("rpc/admin_export_transition")) {
        const body = JSON.parse(String(options.body));
        transitions.push(body);
        return Response.json(
          body.p_to === "PROCESSING" && !claim
            ? null
            : { ...job, status: body.p_to },
        );
      }
      if (path.endsWith("admin_export_jobs")) {
        const status = new URL(url).searchParams.get("status");
        return Response.json(status === "eq.QUEUED" ? [job] : []);
      }
      if (path.endsWith("admin_users"))
        return Response.json([{ role, status: "ACTIVE" }]);
      if (path.endsWith("users"))
        return Response.json([
          {
            id: "customer-reference",
            full_name: "=HYPERLINK()",
            primary_phone: "+919876543210",
            primary_email: "person@example.com",
            status: "ACTIVE",
          },
        ]);
      throw new Error("Unexpected provider route");
    }),
  );
  return {
    env: {
      SUPABASE_URL: "https://test-only.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
      EXPORT_STORAGE: { put, delete: del },
    },
    put,
    transitions,
  };
}
describe("Asynchronous private exports", () => {
  it("masks personal fields, escapes spreadsheet formulas and completes through the audited transition RPC", async () => {
    const f = fixture("SUPER_ADMIN");
    await processExportJobs(f.env);
    expect(f.put).toHaveBeenCalledOnce();
    const [key, csv] = f.put.mock.calls[0]!;
    expect(key).toBe(`admin-exports/${job.actor_id}/${job.id}.csv`);
    expect(csv).not.toContain("9876543210");
    expect(csv).not.toContain("person@");
    expect(csv).toContain("'=HYPERLINK()");
    expect(f.transitions.map((t) => t.p_to)).toEqual(["PROCESSING", "READY"]);
    expect(f.transitions[1].p_count).toBe(1);
  });
  it("rechecks the actor role before touching customer records or R2", async () => {
    const f = fixture("OPS_ADMIN");
    await processExportJobs(f.env);
    expect(f.put).not.toHaveBeenCalled();
    expect(f.transitions.map((t) => t.p_to)).toEqual(["PROCESSING", "FAILED"]);
  });
  it("does not generate a duplicate export after a competing worker claims the job", async () => {
    const f = fixture("SUPER_ADMIN", false);
    await processExportJobs(f.env);
    expect(f.put).not.toHaveBeenCalled();
    expect(f.transitions.map((t) => t.p_to)).toEqual(["PROCESSING"]);
  });
});
