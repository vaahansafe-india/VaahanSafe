/**
 * Email Provider Port
 *
 * Provider-agnostic port implemented by email adapters (HTTP provider API, test doubles).
 * INVARIANT: Business logic is decoupled from any single email delivery provider.
 */

import { ProviderSendResult } from "./whatsapp-provider";

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  correlationId?: string;
}

export interface EmailProvider {
  sendEmail(options: EmailSendOptions): Promise<ProviderSendResult>;
}
