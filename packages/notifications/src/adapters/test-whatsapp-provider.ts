/**
 * In-Memory Test WhatsApp Provider
 *
 * Implements WhatsAppProvider port for testing and simulation.
 * INVARIANT: Does NOT make live MSG91 network calls.
 */

import { WhatsAppProvider, WhatsAppSendOptions, ProviderSendResult } from "../ports/whatsapp-provider";

export class TestWhatsAppProvider implements WhatsAppProvider {
  public sentMessages: WhatsAppSendOptions[] = [];
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

  async sendWhatsApp(options: WhatsAppSendOptions): Promise<ProviderSendResult> {
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

    this.sentMessages.push(options);
    return {
      success: true,
      providerMessageId: `msg91_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  clear(): void {
    this.sentMessages = [];
    this.clearFailure();
  }
}
