/**
 * Notification Delivery Attempt Entity
 *
 * Append-only diagnostic record tracking individual delivery attempts.
 * INVARIANT: Secrets, OTP, and full payload bodies MUST NEVER be persisted in attempt records.
 */

import { AttemptResult } from "./status";

export interface NotificationDeliveryAttempt {
  id: string;
  deliveryId: string;
  attemptNumber: number;
  startedAt: string;
  finishedAt?: string;
  result: AttemptResult;
  normalizedErrorCode?: string;
  providerReference?: string;
  requestId?: string;
  createdAt: string;
}

export interface CreateDeliveryAttemptInput {
  id?: string;
  deliveryId: string;
  attemptNumber: number;
  startedAt?: string;
  finishedAt?: string;
  result: AttemptResult;
  normalizedErrorCode?: string;
  providerReference?: string;
  requestId?: string;
  createdAt?: string;
}

export function createDeliveryAttempt(input: CreateDeliveryAttemptInput): NotificationDeliveryAttempt {
  const now = input.createdAt || new Date().toISOString();
  return {
    id: input.id || `datt_${crypto.randomUUID()}`,
    deliveryId: input.deliveryId,
    attemptNumber: input.attemptNumber,
    startedAt: input.startedAt || now,
    finishedAt: input.finishedAt,
    result: input.result,
    normalizedErrorCode: input.normalizedErrorCode,
    providerReference: input.providerReference,
    requestId: input.requestId,
    createdAt: now,
  };
}
