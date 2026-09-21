/**
 * Notification Dead-Letter Contract & Handling
 *
 * Captures exhausted deliveries for operator diagnosis and manual recovery.
 * INVARIANT: Secrets, OTP, and sensitive customer PII must NEVER be placed in DLQ events.
 */

import { NotificationChannel } from "../domain/channel";

export interface DeadLetterRecord {
  intentId: string;
  deliveryId: string;
  channel: NotificationChannel;
  normalizedError: string;
  attemptCount: number;
  lastAttemptAt: string;
  correlationId?: string;
}

export interface DeadLetterHandler {
  recordDeadLetter(record: DeadLetterRecord): Promise<void>;
}

export class InMemoryDeadLetterHandler implements DeadLetterHandler {
  public readonly deadLetters: DeadLetterRecord[] = [];

  async recordDeadLetter(record: DeadLetterRecord): Promise<void> {
    this.deadLetters.push(record);
  }

  clear(): void {
    this.deadLetters.length = 0;
  }
}
