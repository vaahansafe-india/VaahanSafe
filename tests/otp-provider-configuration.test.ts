import { afterEach, describe, expect, it, vi } from "vitest";
import { Msg91OtpAdapter } from "../packages/notifications/src/otp";

afterEach(() => vi.unstubAllGlobals());
describe("MSG91 configuration fails closed", () => {
  it("does not send requests using a placeholder template", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    await expect(new Msg91OtpAdapter("replace_with_server_key", "replace_with_template").send({ phone: "+919876543210" })).rejects.toThrow("template is missing");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not contact a provider with malformed verification input", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect(await new Msg91OtpAdapter().verify("not-a-phone", "not-a-code")).toEqual({ success: false });
    expect(fetch).not.toHaveBeenCalled();
  });
});
