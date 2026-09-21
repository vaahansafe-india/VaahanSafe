/**
 * In-Memory Test Email Provider
 *
 * Implements EmailProvider port for testing and simulation.
 * INVARIANT: Does NOT make live email provider network calls.
 */

import { EmailProvider, EmailSendOptions } from "../ports/email-provider";
import { ProviderSendResult } from "../ports/whatsapp-provider";

export class TestEmailProvider implements EmailProvider {
  public sentEmails: EmailSendOptions[] = [];
  public shouldFailWith?: { errorCode: string; isRetryable: boolean };
  public failureCountRemaining = 0;

  setFailure(errorCode: string, isRetryable: boolean, count = 1): void {
    this.shouldFailWith = { errorCode, isRetryable };
    this.failureCountRemaining = count;
  }

  clearFailure(): void {
    this.shouldFailWith = undefined;
    this.failureCountRemaining = 0;
  }

  async sendEmail(options: EmailSendOptions): Promise<ProviderSendResult> {
    if (this.shouldFailWith && this.failureCountRemaining > 0) {
      this.failureCountRemaining--;
      const err = this.shouldFailWith;
      if (this.failureCountRemaining === 0) {
        this.shouldFailWith = undefined;
      }
      return {
        success: false,
        errorCode: err.errorCode,
        isRetryable: err.isRetryable,
      };
    }

    this.sentEmails.push(options);
    return {
      success: true,
      providerMessageId: `email_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  clear(): void {
    this.sentEmails = [];
    this.clearFailure();
  }
}
