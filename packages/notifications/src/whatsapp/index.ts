export interface SendWhatsAppMessageOptions {
  recipientPhone: string;
  templateName: string;
  templateParams?: Record<string, string>;
}

export interface IWhatsAppService {
  sendMessage(options: SendWhatsAppMessageOptions): Promise<{ success: boolean; messageId?: string }>;
}

export class Msg91WhatsAppAdapter implements IWhatsAppService {
  constructor(private authKey?: string, private senderNumber?: string) {}

  async sendMessage(options: SendWhatsAppMessageOptions): Promise<{ success: boolean; messageId?: string }> {
    return { success: true, messageId: `msg91_wa_${Date.now()}` };
  }
}
