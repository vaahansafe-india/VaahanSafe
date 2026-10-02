export interface SendOtpOptions {
  phone: string;
  templateId?: string;
  otpLength?: number;
}

export interface IOtpService {
  send(options: SendOtpOptions): Promise<{ success: boolean; requestId?: string }>;
  verify(phone: string, otp: string, requestId?: string): Promise<{ success: boolean }>;
}

export class Msg91OtpAdapter implements IOtpService {
  constructor(
    private authKey = process.env.MSG91_AUTH_KEY,
    private defaultTemplateId = process.env.MSG91_OTP_TEMPLATE_ID,
  ) {}

  private async request(url: URL, method: "GET" | "POST") {
    if (!this.authKey || /replace_with|placeholder|dummy|your_/i.test(this.authKey)) throw new Error("MSG91 OTP credentials are missing");
    try {
      const response = await fetch(url, {
        method, headers: { authkey: this.authKey, "Content-Type": "application/json" },
        ...(method === "POST" ? { body: "{}" } : {}),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`MSG91 OTP provider HTTP ${response.status}`);
      return await response.json() as { type?: string; message?: string; request_id?: string };
    } catch {
      // Never propagate a fetch error containing a URL with a phone number or OTP.
      throw new Error("MSG91 OTP provider unavailable");
    }
  }

  async send(options: SendOtpOptions): Promise<{ success: boolean; requestId?: string }> {
    const templateId = options.templateId || this.defaultTemplateId;
    if (!templateId || /replace_with|placeholder|dummy|your_/i.test(templateId)) throw new Error("MSG91 approved OTP template is missing");
    if (!/^\+91[6-9]\d{9}$/.test(options.phone)) return { success: false };
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", templateId);
    url.searchParams.set("mobile", options.phone.slice(1));
    url.searchParams.set("otp_length", String(options.otpLength || 6));
    const result = await this.request(url, "POST");
    return { success: result.type === "success", requestId: result.request_id || (result.type === "success" ? result.message : undefined) };
  }

  async verify(phone: string, otp: string): Promise<{ success: boolean }> {
    if (!/^\+91[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(otp)) return { success: false };
    const url = new URL("https://control.msg91.com/api/v5/otp/verify");
    url.searchParams.set("mobile", phone.slice(1));
    url.searchParams.set("otp", otp);
    const result = await this.request(url, "GET");
    // Reject "already verified" responses; a fresh OTP must succeed for each login.
    return { success: result.type === "success" && /^(OTP verified success(?:fully)?|number_verified_successfully)$/i.test(result.message || "") };
  }
}
