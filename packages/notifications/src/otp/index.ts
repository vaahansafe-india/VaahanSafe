export type OtpDeliveryChannel = "SMS" | "WHATSAPP";
export interface SendOtpOptions {
  phone: string;
  templateId?: string;
  otpLength?: number;
  channel?: OtpDeliveryChannel;
}
export interface SendOtpResult {
  success: boolean;
  requestId?: string;
  channel?: OtpDeliveryChannel;
  error?: string;
}
export interface IOtpService {
  send(options: SendOtpOptions): Promise<SendOtpResult>;
  verify(
    phone: string,
    otp: string,
    requestId?: string,
    channel?: OtpDeliveryChannel,
  ): Promise<{ success: boolean }>;
}
const configured = (value?: string) =>
  Boolean(
    value && !/^(test_)|replace_with|placeholder|dummy|your_/i.test(value),
  );
export function getOtpDeliveryAvailability() {
  return {
    SMS:
      configured(process.env.MSG91_AUTH_KEY) &&
      configured(process.env.MSG91_OTP_TEMPLATE_ID),
    WHATSAPP:
      configured(process.env.MSG91_AUTH_KEY) &&
      configured(process.env.MSG91_WHATSAPP_OTP_WIDGET_ID),
  };
}

/** Synchronous provider-owned OTP. Never generates codes or uses a notification template. */
export class Msg91OtpAdapter implements IOtpService {
  constructor(
    private authKey = process.env.MSG91_AUTH_KEY,
    private defaultTemplateId = process.env.MSG91_OTP_TEMPLATE_ID,
    private whatsappWidgetId = process.env.MSG91_WHATSAPP_OTP_WIDGET_ID,
  ) {}
  private async widgetRequest(
    method: "sendOtp" | "verifyOtp" | "verifyAccessToken",
    body: Record<string, string>,
  ) {
    if (!configured(this.authKey) || !configured(this.whatsappWidgetId))
      throw new Error("MSG91 WhatsApp OTP configuration unavailable");
    try {
      const response = await fetch(
        `https://api.msg91.com/api/v5/widget/${method}`,
        {
          method: "POST",
          headers: {
            authkey: this.authKey!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) {
        // Log operational metadata only: never payloads, phone numbers or codes.
        const rejected = await response.json().catch(() => ({})) as { code?: unknown };
        const code = String(rejected.code || "");
        console.error("[MSG91 OTP] Request rejected", { method, status: response.status, code: /^[a-zA-Z0-9_-]{1,32}$/.test(code) ? code : "PROVIDER_ERROR" });
        throw new Error("OTP provider request failed");
      }
      return (await response.json()) as {
        type?: string;
        message?: unknown;
        reqId?: unknown;
        request_id?: unknown;
        invisibleVerified?: boolean;
      };
    } catch {
      throw new Error("MSG91 WhatsApp OTP provider unavailable");
    }
  }
  private async request(url: URL, method: "GET" | "POST") {
    if (!configured(this.authKey))
      throw new Error("MSG91 OTP credentials are missing");
    try {
      const response = await fetch(url, {
        method,
        headers: { authkey: this.authKey!, "Content-Type": "application/json" },
        ...(method === "POST" ? { body: "{}" } : {}),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Provider request failed");
      return (await response.json()) as {
        type?: string;
        message?: string;
        request_id?: string;
      };
    } catch {
      throw new Error("MSG91 OTP provider unavailable");
    }
  }
  async send(options: SendOtpOptions): Promise<SendOtpResult> {
    if (
      !/^\+91[6-9]\d{9}$/.test(options.phone) ||
      (options.otpLength !== undefined && options.otpLength !== 6)
    ) {
      return { success: false, error: "Invalid OTP request" };
    }
    if (options.channel === "WHATSAPP") {
      const result = await this.widgetRequest("sendOtp", {
        widgetId: this.whatsappWidgetId!,
        identifier: options.phone.slice(1),
      });
      const reference = result.reqId || result.request_id || result.message;
      // Invisible verification must never replace the requested six-digit challenge.
      const success =
        result.type === "success" &&
        !result.invisibleVerified &&
        typeof reference === "string" &&
        /^[a-zA-Z0-9_-]{8,256}$/.test(reference);
      return {
        success,
        requestId: success ? (reference as string) : undefined,
        channel: "WHATSAPP",
      };
    }
    const templateId = options.templateId || this.defaultTemplateId;
    if (!configured(templateId))
      throw new Error("MSG91 approved OTP template is missing");
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", templateId!);
    url.searchParams.set("mobile", options.phone.slice(1));
    url.searchParams.set("otp_length", "6");
    url.searchParams.set("otp_expiry", "5");
    const result = await this.request(url, "POST");
    const reference = result.request_id || result.message;
    const success =
      result.type === "success" &&
      typeof reference === "string" &&
      Boolean(reference.trim());
    return {
      success,
      requestId: success ? reference : undefined,
      channel: "SMS",
    };
  }
  async verify(
    phone: string,
    otp: string,
    requestId?: string,
    channel: OtpDeliveryChannel = "SMS",
  ): Promise<{ success: boolean }> {
    if (!/^\+91[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(otp))
      return { success: false };
    if (channel === "WHATSAPP") {
      if (!requestId || !/^[a-zA-Z0-9_-]{8,256}$/.test(requestId))
        return { success: false };
      const verified = await this.widgetRequest("verifyOtp", {
        widgetId: this.whatsappWidgetId!,
        reqId: requestId,
        otp,
      });
      if (
        verified.type !== "success" ||
        typeof verified.message !== "string" ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(
          verified.message,
        )
      )
        return { success: false };
      // Never trust or decode a client JWT as authentication proof. MSG91 validates
      // its access token and the verified identity must match this server challenge.
      const identity = await this.widgetRequest("verifyAccessToken", {
        authkey: this.authKey!,
        "access-token": verified.message,
      });
      return {
        success:
          identity.type === "success" &&
          typeof identity.message === "string" &&
          identity.message.replace(/^\+/, "") === phone.slice(1),
      };
    }
    const url = new URL("https://control.msg91.com/api/v5/otp/verify");
    url.searchParams.set("mobile", phone.slice(1));
    url.searchParams.set("otp", otp);
    const result = await this.request(url, "GET");
    return {
      success:
        result.type === "success" &&
        /^(OTP verified success(?:fully)?|number_verified_successfully)$/i.test(
          result.message || "",
        ),
    };
  }
}
