import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("Production database selection", () => {
  it("uses Supabase even when legacy Cloudflare credentials are present", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "unit-test-server-key");
    vi.stubEnv("CLOUDFLARE_API_TOKEN", "unit-test-legacy-token");
    vi.stubEnv("CLOUDFLARE_D1_DATABASE_ID", "legacy-database");
    const { getAuthoritativeDatabaseClient } = await import("../packages/database/src/client/factory");
    expect(getAuthoritativeDatabaseClient().dialect).toBe("postgres");
  });
  it("fails closed instead of falling back to D1 without Supabase credentials", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("CLOUDFLARE_API_TOKEN", "unit-test-legacy-token");
    vi.stubEnv("CLOUDFLARE_D1_DATABASE_ID", "legacy-database");
    const { getAuthoritativeDatabaseClient } = await import("../packages/database/src/client/factory");
    expect(() => getAuthoritativeDatabaseClient()).toThrow("Supabase server credentials are missing");
  });
});
