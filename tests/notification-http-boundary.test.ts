import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

const recordReport = vi.hoisted(() => vi.fn().mockResolvedValue(true));
vi.mock("@vaahansafe/database", () => ({
  SupabaseNotificationOutbox: class {
    recordReport = recordReport;
  },
}));
vi.mock("@vaahansafe/auth", () => ({
  CUSTOMER_SESSION_COOKIE_NAME: "vs_session",
}));
vi.mock("@vaahansafe/config", () => ({ isDiscoveryPath: () => false }));
import { verifyNotificationSchedule } from "../apps/customer/lib/notification-runtime";
import { POST } from "../apps/customer/app/api/webhooks/msg91/route";
import { middleware } from "../apps/customer/middleware";

const secret = "fixture-secret-with-at-least-32-characters";
const report = () => ({
  crqid: `delivery_${"a".repeat(32)}`,
  requestId: "real-provider-reference",
  eventName: "delivered",
  integratedNumber: "919876543210",
  ts: Math.floor(Date.now() / 1000),
});
const request = (body: unknown, key = secret) =>
  new Request("https://app.vaahansafe.com/api/webhooks/msg91", {
    method: "POST",
    headers: { "x-vaahansafe-webhook-secret": key },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  vi.stubEnv("NOTIFICATION_DISPATCH_SECRET", secret);
  vi.stubEnv("MSG91_WEBHOOK_SECRET", secret);
  vi.stubEnv("MSG91_WHATSAPP_NUMBER", "919876543210");
  recordReport.mockReset().mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

describe("Short-lived scheduler authentication", () => {
  const signed = (seconds: number, key = secret) =>
    new Request("https://app.vaahansafe.com/api/internal/notifications/drain", {
      headers: {
        "x-vaahansafe-timestamp": String(seconds),
        "x-vaahansafe-signature": createHmac("sha256", key)
          .update(`notification-drain:${seconds}`)
          .digest("hex"),
      },
    });
  it("accepts a valid fresh proof", () =>
    expect(verifyNotificationSchedule(signed(1800000000), 1800000000000)).toBe(
      true,
    ));
  it("rejects expired, future, tampered and missing proofs", () => {
    expect(verifyNotificationSchedule(signed(1799999800), 1800000000000)).toBe(
      false,
    );
    expect(verifyNotificationSchedule(signed(1800000200), 1800000000000)).toBe(
      false,
    );
    expect(
      verifyNotificationSchedule(signed(1800000000, "wrong"), 1800000000000),
    ).toBe(false);
    expect(verifyNotificationSchedule(new Request("https://example.com"))).toBe(
      false,
    );
  });
});
describe("Provider report boundary", () => {
  it("rejects unauthenticated reports before touching the database", async () => {
    expect((await POST(request(report(), "wrong"))).status).toBe(401);
    expect(recordReport).not.toHaveBeenCalled();
  });
  it.each(["{", "null", "[]"])("rejects malformed reports: %s", async (body) =>
    expect((await POST(request(body))).status).toBe(400),
  );
  it("correlates only the server delivery ID and provider reference", async () => {
    expect((await POST(request(report()))).status).toBe(200);
    expect(recordReport).toHaveBeenCalledWith(
      `delivery_${"a".repeat(32)}`,
      "real-provider-reference",
      "delivered",
      expect.any(String),
    );
  });
  it("rejects implausible timestamps", async () => {
    for (const invalid of [
      { ts: 0 },
      { ts: Math.floor(Date.now() / 1000) + 3600 },
    ]) {
      expect((await POST(request({ ...report(), ...invalid }))).status).toBe(
        400,
      );
    }
    expect(recordReport).not.toHaveBeenCalled();
  });
  it("accepts MSG91's documented ISO timestamp format", async () => {
    expect(
      (await POST(request({ ...report(), ts: new Date().toISOString() })))
        .status,
    ).toBe(200);
    expect(recordReport).toHaveBeenCalled();
  });
  it("acknowledges unrelated OTP/campaign reports without modifying them", async () => {
    for (const other of [
      { crqid: "otp-request" },
      { integratedNumber: "other" },
    ]) {
      const response = await POST(request({ ...report(), ...other }));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ ignored: true });
    }
    expect(recordReport).not.toHaveBeenCalled();
  });
  it("returns retryable failure when persistence is unavailable", async () => {
    recordReport.mockRejectedValue(new Error("private database detail"));
    const response = await POST(request(report()));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database detail");
  });
  it.each(["/api/webhooks/msg91", "/api/internal/notifications/drain"])(
    "routes %s to its independent authentication",
    (path) => {
      expect(
        middleware(
          new NextRequest(`https://app.vaahansafe.com${path}`),
        ).headers.get("x-middleware-next"),
      ).toBe("1");
      expect(
        middleware(new NextRequest(`https://app.vaahansafe.com${path}-extra`))
          .status,
      ).toBe(401);
    },
  );
});
