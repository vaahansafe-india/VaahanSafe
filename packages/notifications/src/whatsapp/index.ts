import type { WhatsAppProvider, WhatsAppSendOptions, ProviderSendResult } from "../ports/whatsapp-provider";
import { MSG91_TEMPLATE_CATALOG, getMsg91Template, buildMsg91Components } from "./catalog";
export * from "./catalog";

export interface SendWhatsAppMessageOptions {
  recipientPhone: string;
  templateName: string;
  templateParams?: Record<string, string>;
  languageCode?: string;
  correlationId?: string;
}
export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isRetryable?: boolean;
}
export interface IWhatsAppService {
  sendMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppMessageResult>;
}
export const MSG91_APPROVED_TEMPLATE_LANGUAGES = Object.fromEntries(
  Object.entries(MSG91_TEMPLATE_CATALOG).map(([name, contract]) => [name, contract.language]),
);
export function resolveTemplateLanguage(templateName: string, overrideLanguage?: string): string {
  const contract = getMsg91Template(templateName);
  if (overrideLanguage && overrideLanguage !== contract.language) throw new Error("MSG91_TEMPLATE_LANGUAGE_INVALID");
  return contract.language;
}

export class Msg91WhatsAppAdapter implements IWhatsAppService, WhatsAppProvider {
  constructor(
    private authKey = process.env.MSG91_AUTH_KEY || "",
    private senderNumber = process.env.MSG91_WHATSAPP_NUMBER || "",
    private namespace = process.env.MSG91_WHATSAPP_NAMESPACE || "",
  ) {}

  async sendMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppMessageResult> {
    const raw = options.recipientPhone.replace(/[\s()+-]/g, "");
    const phone = /^[6-9]\d{9}$/.test(raw) ? `91${raw}` : raw;
    if (!/^91[6-9]\d{9}$/.test(phone)) return { success: false, error: "MSG91_RECIPIENT_INVALID", isRetryable: false };
    if (!this.authKey || /^(test_)|replace_with|placeholder|dummy|your_/i.test(this.authKey) ||
        !/^91[6-9]\d{9}$/.test(this.senderNumber) || !this.namespace) {
      return { success: false, error: "MSG91_CONFIGURATION_MISSING", isRetryable: false };
    }
    let language: string;
    let components: ReturnType<typeof buildMsg91Components>;
    try {
      language = resolveTemplateLanguage(options.templateName, options.languageCode);
      components = buildMsg91Components(options.templateName, options.templateParams || {});
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "MSG91_TEMPLATE_INVALID", isRetryable: false };
    }
    try {
      const response = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
        method: "POST",
        headers: { authkey: this.authKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          integrated_number: this.senderNumber,
          content_type: "template",
          ...(options.correlationId ? { crqid: options.correlationId } : {}),
          payload: { messaging_product: "whatsapp", type: "template", template: {
            name: options.templateName, namespace: this.namespace,
            language: { code: language, policy: "deterministic" },
            to_and_components: [{ to: [phone], components }],
          } },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) return { success: false, error: `MSG91_HTTP_${response.status}`, isRetryable: response.status === 429 || response.status >= 500 };
      const data = await response.json() as { status?: string; type?: string; hasError?: boolean; request_id?: unknown };
      // An error with a correlation reference is still an error. Never invent references.
      if (data.hasError || data.status === "error" || data.type === "error" ||
          !(data.status === "success" || data.type === "success") ||
          typeof data.request_id !== "string" || !data.request_id.trim()) {
        return { success: false, error: "MSG91_PROVIDER_REJECTED", isRetryable: false };
      }
      return { success: true, messageId: data.request_id };
    } catch {
      // The request may have been accepted before a transport timeout. Automatic
      // retries here can send the same customer alert twice.
      return { success: false, error: "MSG91_DELIVERY_OUTCOME_UNKNOWN", isRetryable: false };
    }
  }

  async sendWhatsApp(options: WhatsAppSendOptions): Promise<ProviderSendResult> {
    const result = await this.sendMessage({ recipientPhone: options.recipientPhone, templateName: options.templateName,
      templateParams: options.parameters, languageCode: options.languageCode, correlationId: options.correlationId });
    return { success: result.success, providerMessageId: result.messageId, errorCode: result.error, isRetryable: result.isRetryable };
  }
}
