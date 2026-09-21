/**
 * Notification Delivery Domain Entity
 *
 * Tracks the delivery lifecycle of an intent over a specific communication channel.
 * INVARIANT: Each channel (In-App, WhatsApp, Email) executes and records state independently.
 */

import { NotificationChannel } from "./channel";
import { DeliveryStatus } from "./status";

export type DeliveryProvider = "INTERNAL" | "MSG91" | "EMAIL_PROVIDER" | "TEST_STUB";

export interface NotificationDelivery {
  id: string;
  intentId: string;
  notificationId?: string;
  channel: NotificationChannel;
  provider: DeliveryProvider;
  status: DeliveryStatus;
  providerMessageId?: string;
  attemptCount: number;
  lastFailureCode?: string;
  nextAttemptAt?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

export interface CreateDeliveryInput {
  id?: string;
  intentId: string;
  notificationId?: string;
  channel: NotificationChannel;
  provider: DeliveryProvider;
  status?: DeliveryStatus;
  providerMessageId?: string;
  attemptCount?: number;
  lastFailureCode?: string;
  nextAttemptAt?: string;
  createdAt?: string;
}

export function createNotificationDelivery(input: CreateDeliveryInput): NotificationDelivery {
  const now = input.createdAt || new Date().toISOString();
  return {
    id: input.id || `deliv_${crypto.randomUUID()}`,
    intentId: input.intentId,
    notificationId: input.notificationId,
    channel: input.channel,
    provider: input.provider,
    status: input.status || "PENDING",
    providerMessageId: input.providerMessageId,
    attemptCount: input.attemptCount ?? 0,
    lastFailureCode: input.lastFailureCode,
    nextAttemptAt: input.nextAttemptAt,
    createdAt: now,
    updatedAt: now,
  };
}
