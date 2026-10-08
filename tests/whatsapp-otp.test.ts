import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getOtpDeliveryAvailability,
  Msg91OtpAdapter,
} from "../packages/notifications/src/otp";
import { OtpRequestGuard } from "../packages/auth/src/otp/request-guard";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const phone = "+919876543210";
const requestId = "366974726d42303730383432";
const token = "signed.payload.signature";
const response = (data: unknown) => new Response(JSON.stringify(data));
const adapter = () =>
  new Msg91OtpAdapter("credential-fixture", undefined, "widget-fixture");

describe("Provider-owned WhatsApp OTP", () => {
  it("requires an actual widget configuration", async () => {
    vi.stubEnv("MSG91_AUTH_KEY", "credential-fixture");
    vi.stubEnv("MSG91_WHATSAPP_OTP_WIDGET_ID", "");
    expect(getOtpDeliveryAvailability().WHATSAPP).toBe(false);
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      adapterWithoutWidget().send({ phone, channel: "WHATSAPP" }),
    ).rejects.toThrow("configuration unavailable");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("asks MSG91 to generate a challenge without generating or supplying a code", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ type: "success", message: requestId }));
    vi.stubGlobal("fetch", fetch);
    expect(await adapter().send({ phone, channel: "WHATSAPP" })).toMatchObject({
      success: true,
      requestId,
      channel: "WHATSAPP",
    });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("https://control.msg91.com/api/v5/widget/sendOtp");
    expect(JSON.parse(options.body)).toEqual({
      widgetId: "widget-fixture",
      identifier: phone.slice(1),
    });
  });
  it("rejects invisible verification and ambiguous send responses", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          type: "success",
          message: requestId,
          invisibleVerified: true,
        }),
      )
      .mockResolvedValueOnce(response({ type: "success", message: "sent" }));
    vi.stubGlobal("fetch", fetch);
    expect((await adapter().send({ phone, channel: "WHATSAPP" })).success).toBe(
      false,
    );
    expect((await adapter().send({ phone, channel: "WHATSAPP" })).success).toBe(
      false,
    );
  });
  it("validates the access token with MSG91 and binds the resulting phone", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ type: "success", message: token }))
      .mockResolvedValueOnce(
        response({ type: "success", message: phone.slice(1) }),
      );
    vi.stubGlobal("fetch", fetch);
    expect(
      await adapter().verify(phone, "675829", requestId, "WHATSAPP"),
    ).toEqual({ success: true });
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      reqId: requestId,
      widgetId: "widget-fixture",
    });
    expect(fetch.mock.calls[1][0]).toBe(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
    );
    expect(JSON.parse(fetch.mock.calls[1][1].body)["access-token"]).toBe(token);
  });
  it("rejects tokens validated for another phone and missing identity proof", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ type: "success", message: token }))
      .mockResolvedValueOnce(
        response({ type: "success", message: "919876543211" }),
      )
      .mockResolvedValueOnce(response({ type: "success", message: token }))
      .mockResolvedValueOnce(response({ type: "success" }));
    vi.stubGlobal("fetch", fetch);
    expect(
      (await adapter().verify(phone, "675829", requestId, "WHATSAPP")).success,
    ).toBe(false);
    expect(
      (await adapter().verify(phone, "675829", requestId, "WHATSAPP")).success,
    ).toBe(false);
  });
  it("does not verify without a provider request reference or accept a plain success string", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ type: "success", message: "verified" }));
    vi.stubGlobal("fetch", fetch);
    expect(
      (await adapter().verify(phone, "675829", undefined, "WHATSAPP")).success,
    ).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    expect(
      (await adapter().verify(phone, "675829", requestId, "WHATSAPP")).success,
    ).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("uses the channel and reference stored on the server rather than client claims", async () => {
    vi.stubEnv("SESSION_SECRET", "security-fixture-at-least-sixteen");
    const db = {
      execute: vi.fn().mockResolvedValue({ success: true, rowsAffected: 1 }),
      queryFirst: vi
        .fn()
        .mockResolvedValue({
          id: "challenge-fixture",
          channel: "WHATSAPP",
          provider_request_id: requestId,
        }),
    };
    const guard = new OtpRequestGuard(db, "CUSTOMER");
    const reserved = await guard.reserve(
      phone,
      new Request("https://app.vaahansafe.com"),
      "WHATSAPP",
    );
    expect(db.execute.mock.calls[0][1]).toContain("WHATSAPP");
    const verify = vi.fn().mockResolvedValue({ success: true });
    expect(
      (
        await guard.verify(
          phone,
          new Request("https://app.vaahansafe.com", {
            headers: { cookie: `vs_customer_otp=${reserved.token}` },
          }),
          verify,
        )
      ).success,
    ).toBe(true);
    expect(verify).toHaveBeenCalledWith({ channel: "WHATSAPP", requestId });
  });
});
function adapterWithoutWidget() {
  return new Msg91OtpAdapter("credential-fixture", undefined, "");
}
