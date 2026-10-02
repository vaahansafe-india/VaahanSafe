import { describe, expect, it } from "vitest";
import { safeReturnUrl, customerAuthOrigin } from "../apps/customer/lib/auth-navigation";

describe("Customer authentication destinations", () => {
  it.each([undefined, null, "", "https://example.com", "//example.com", "/\\example.com", "/login", "/auth/callback", "/api/auth/google", "/onboarding/phone", "/"])('rejects unsafe or looping destination %s', value => {
    expect(safeReturnUrl(value)).toBe("/dashboard");
  });
  it("preserves local app destinations and their filters", () => {
    expect(safeReturnUrl("/scan-history?range=7d#recent")).toBe("/scan-history?range=7d#recent");
  });
  it("keeps development auth local even when the deployment origin is configured", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://app.vaahansafe.com";
    try { expect(customerAuthOrigin("http://localhost:3001/api/auth/google", "development")).toBe("http://localhost:3001"); }
    finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previous; }
  });
});
