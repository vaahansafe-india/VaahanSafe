import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@vaahansafe/auth", () => ({
  CUSTOMER_SESSION_COOKIE_NAME: "vs_session",
}));
vi.mock("@vaahansafe/config", () => ({ isDiscoveryPath: () => false }));
import { middleware } from "../apps/customer/middleware";

describe("Razorpay delivery routing", () => {
  it("lets cookie-free provider deliveries reach the signature-verifying route", () => {
    const response = middleware(
      new NextRequest("https://app.vaahansafe.com/api/webhooks/razorpay", {
        method: "POST",
      }),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
  it.each(["/api/payments/verify", "/api/webhooks/razorpay-extra"])(
    "keeps customer authentication on %s",
    (path) => {
      expect(
        middleware(
          new NextRequest(`https://app.vaahansafe.com${path}`, {
            method: "POST",
          }),
        ).status,
      ).toBe(401);
    },
  );
  it("keeps the customer order page behind sign-in", () => {
    expect(
      middleware(
        new NextRequest("https://app.vaahansafe.com/orders"),
      ).headers.get("location"),
    ).toContain("/login");
  });
});
