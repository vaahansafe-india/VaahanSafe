import { afterEach, describe, expect, it, vi } from "vitest";
import { Msg91WhatsAppAdapter, MSG91_TEMPLATE_CATALOG, getMsg91TemplateVariableNames } from "../packages/notifications/src/whatsapp";
import { Msg91OtpAdapter } from "../packages/notifications/src/otp";
import { getTemplateDefinition } from "../packages/notifications/src/templates/registry";
import { REPORT_BUTTON_TEMPLATES, reportButtonTemplates } from "../packages/notifications/src/whatsapp/report-buttons";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const adapter = () => new Msg91WhatsAppAdapter("credential-fixture", "918639785897", "namespace-fixture");
const message = { recipientPhone: "+919876543210", templateName: "vhn_welcome_v1", templateParams: { "1": "Recipient" } };

describe("MSG91 provider contracts", () => {
  it("matches the approved payment text: amount then order number", () => {
    const rendered = getTemplateDefinition("PAYMENT_SUCCESS_V1").renderWhatsApp({ orderId: "internal-order", orderNumber: "VS-ORDER", amountDisplay: "₹499.00", paymentId: "payment-reference" });
    expect(rendered.parameters).toEqual({ "1": "₹499.00", "2": "VS-ORDER" });
  });
  it.each(Object.entries(MSG91_TEMPLATE_CATALOG))("sends exact approved components for %s", async (name, contract) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "success", request_id: "provider-reference" })));
    vi.stubGlobal("fetch", fetch);
    const parameters = Object.fromEntries(Array.from({ length: contract.bodyCount }, (_, i) => [String(i + 1), `value-${i + 1}`]));
    const buttons = reportButtonTemplates.find((template) => template.name === name)?.buttons ?? [];
    for (const [index, button] of buttons.entries()) {
      parameters[`button_${index + 1}`] = button.sample;
    }
    expect(await adapter().sendMessage({ ...message, templateName: name, templateParams: parameters })).toEqual({ success: true, messageId: "provider-reference" });
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/");
    const template = JSON.parse(request.body).payload.template;
    expect(template.namespace).toBe("namespace-fixture");
    expect(template.language.code).toBe(contract.language);
    const { components } = template.to_and_components[0];
    expect(Object.keys(components)).toEqual(getMsg91TemplateVariableNames(contract));
    for (const [index, { sample }] of buttons.entries()) {
      expect(components[`button_${index + 1}`]).toEqual({ type: "text", subtype: "url", value: sample });
    }
  });
  it("uses directions only for shared GPS and keeps the report proof out of message text", () => {
    const template = getTemplateDefinition("VEHICLE_SCAN_REPORT_V1");
    const names = REPORT_BUTTON_TEMPLATES.owner;
    const approved = new Set([names.report, names.directions]);
    const proof = "A".repeat(43);
    const report = {
      viewerUrl: `https://view.vaahansafe.com/r#${proof}`,
      vehicleMaskedReg: "MH••••1234",
      scannedAtFormatted: "21 Oct 2026, 14:00 IST",
      reason: "PARKING",
      locationText: "Finder-shared GPS (accuracy +/-20 m): https://www.google.com/maps/search/?api=1&query=19.076,72.8777",
    };
    expect(template.renderWhatsApp(report, approved)).toEqual({
      templateName: names.directions, languageCode: "en",
      parameters: { 1: report.vehicleMaskedReg, 2: "Parking / access concern", 3: report.scannedAtFormatted, button_1: proof, button_2: "19.076,72.8777" },
    });
    const noLocation = { ...report, locationText: "Location was not shared" };
    expect(template.renderWhatsApp(noLocation, approved)).toMatchObject({ templateName: names.report, parameters: { button_1: proof } });
    expect(template.renderWhatsApp(noLocation, approved).parameters).not.toHaveProperty("button_2");
    expect(template.renderWhatsApp(report, new Set()).templateName).toBe("vhn_vehicle_report_v2");
    expect(getTemplateDefinition("EMERGENCY_CONTACT_REPORT_V1")
      .renderWhatsApp({ ...report, reason: "EMERGENCY" }, approved).templateName)
      .toBe("vhn_emergency_contact_report_v2");
  });
  it("blocks an approved template if MSG91 rewrites its private report destination", async () => {
    const name = REPORT_BUTTON_TEMPLATES.owner.directions;
    const definition = reportButtonTemplates.find((template) => template.name === name)!;
    const buttons = definition.buttons.map(({ text, base }) => ({ type: "URL", text, url: base + "{{1}}" }));
    const language = {
      language: "en", status: "approved", is_disabled: 0,
      variables: ["body_1", "body_2", "body_3", "button_1", "button_2"],
      variable_type: { button_1: { type: "text", subtype: "url" }, button_2: { type: "text", subtype: "url" } },
      code: [{ type: "BUTTONS", buttons }],
    };
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json({
      status: "success", data: [{ name, namespace: "namespace-fixture", languages: [language] }],
    })));
    expect(await adapter().getTemplateApproval(name)).toBe("APPROVED");
    buttons[0].url = "https://m.9m.io/{{1}}";
    expect(await adapter().getTemplateApproval(name)).toBe("PENDING");
  });
  it("rejects aliases, extra variables, language mismatch and unapproved OTP templates before transmission", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    for (const override of [{ templateParams: { "1": "Name", name: "Name" } }, { languageCode: "en_US" }, { templateName: "vhn_security_passcode_v1" }, { templateName: "vhn_qr_scan_alert_v1" }, { templateName: "vhn_auth_otp_v1" }]) {
      expect((await adapter().sendMessage({ ...message, ...override })).success).toBe(false);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(() => getTemplateDefinition("AUTH_OTP_V1")).toThrow();
  });
  it("fails closed for missing sender and test credentials in every runtime", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.stubEnv("MSG91_WHATSAPP_NUMBER", "");
    expect((await new Msg91WhatsAppAdapter("credential-fixture").sendMessage(message)).success).toBe(false);
    expect((await new Msg91WhatsAppAdapter("test_auth_key", "918639785897", "namespace").sendMessage(message)).success).toBe(false);
    await expect(new Msg91OtpAdapter("test_auth_key", "approved-template").verify("+919876543210", "482910")).rejects.toThrow("credentials are missing");
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([{status:"error",request_id:"error-reference"},{status:"success"},{request_id:"reference"},{status:"success",hasError:true,request_id:"reference"}])("never turns an ambiguous response into success: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
    const result = await adapter().sendMessage(message);
    expect(result.success).toBe(false); expect(result.messageId).toBeUndefined();
  });
  it.each([400,401,429,500,503])("classifies HTTP %i correctly", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", {status})));
    expect((await adapter().sendWhatsApp({...message,parameters:{"1":"Recipient"}})).isRetryable).toBe(status===429 || status>=500);
  });
  it("uses provider generation with five-minute expiry and never dispatches WhatsApp implicitly", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({type:"success",request_id:"provider-reference"})));
    vi.stubGlobal("fetch", fetch);
    const otp = new Msg91OtpAdapter("credential-fixture", "approved-template-fixture");
    await expect(otp.send({phone:"+919876543210",channel:"WHATSAPP"})).rejects.toThrow("WhatsApp OTP configuration unavailable");
    expect(fetch).not.toHaveBeenCalled();
    expect((await otp.send({phone:"+919876543210"})).success).toBe(true);
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.searchParams.get("otp")).toBeNull();
    expect(url.searchParams.get("otp_expiry")).toBe("5");
  });
  it("rejects already-verified OTP responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({type:"success",message:"already_verified"}))));
    expect(await new Msg91OtpAdapter("credential-fixture").verify("+919876543210","482910")).toEqual({success:false});
  });
});
