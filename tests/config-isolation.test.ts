import { describe, it, expect } from "vitest";
import { getClientConfig, getServerConfig, clientEnvSchema } from "@vaahansafe/config";

describe("Configuration & Environment Isolation (@vaahansafe/config)", () => {
  describe("Client Configuration Safety", () => {
    it("should parse only safe public environment variables", () => {
      const clientConfig = getClientConfig();

      expect(clientConfig.NODE_ENV).toBeDefined();
      expect(clientConfig.NEXT_PUBLIC_APP_ENV).toBeDefined();

      // Ensure secret keys are never present in client config
      const clientKeys = Object.keys(clientConfig);
      expect(clientKeys).not.toContain("SESSION_SECRET");
      expect(clientKeys).not.toContain("MSG91_AUTH_KEY");
      expect(clientKeys).not.toContain("CASHFREE_CLIENT_SECRET");
      expect(clientKeys).not.toContain("GOOGLE_CLIENT_SECRET");
    });

    it("clientEnvSchema rejects secret environment variable names", () => {
      const rawEnv = {
        NODE_ENV: "development",
        SESSION_SECRET: "should_be_stripped_secret",
      };

      const parsed = clientEnvSchema.parse(rawEnv);
      expect((parsed as Record<string, unknown>).SESSION_SECRET).toBeUndefined();
    });
  });

  describe("Server Configuration Isolation", () => {
    it("getServerConfig returns typed server configuration in server environment", () => {
      const serverConfig = getServerConfig({ strict: false });
      expect(typeof serverConfig).toBe("object");
    });

    it("throws a security violation if invoked in a browser window runtime", () => {
      // Simulate browser window global
      const originalWindow = (globalThis as unknown as { window?: unknown }).window;
      try {
        (globalThis as unknown as { window: unknown }).window = {};
        expect(() => getServerConfig()).toThrow(/Security Invariant Violation/);
      } finally {
        if (originalWindow === undefined) {
          delete (globalThis as unknown as { window?: unknown }).window;
        } else {
          (globalThis as unknown as { window: unknown }).window = originalWindow;
        }
      }
    });
  });
});
