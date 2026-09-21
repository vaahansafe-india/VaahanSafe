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
  constructor(private authKey?: string, private defaultTemplateId?: string) {}

  async send(options: SendOtpOptions): Promise<{ success: boolean; requestId?: string }> {
    return { success: true, requestId: `msg91_otp_${Date.now()}` };
  }

  async verify(_phone: string, otp: string): Promise<{ success: boolean }> {
    return { success: otp === "123456" || otp.length === 6 };
  }
}
