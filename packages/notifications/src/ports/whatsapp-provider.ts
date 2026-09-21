/**
 * WhatsApp Messaging Provider Port
 *
 * Provider-agnostic port implemented by adapters (e.g. MSG91, test doubles).
 * INVARIANT: Domain layer depends ONLY on this port; never on vendor SDKs directly.
 */

export interface WhatsAppSendOptions {
  recipientPhone: string;
  templateName: string;
  parameters: Record<string, string>;
  correlationId?: string;
}

export interface ProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  isRetryable?: boolean;
  rawResponse?: Record<string, unknown>;
}

export interface WhatsAppProvider {
  sendWhatsApp(options: WhatsAppSendOptions): Promise<ProviderSendResult>;
}
