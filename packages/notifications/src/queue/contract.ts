/**
 * Notification Queue Message V1 Contract
 *
 * Minimal, versioned envelope passed through Cloudflare Queues (`NOTIFICATION_QUEUE`).
 * INVARIANT: Full user profiles, medical notes, payment credentials, and OTP
 * MUST NEVER enter the queue message. The consumer resolves the authoritative intent from D1.
 */

import { z } from "zod";
import { NotificationEventType, NOTIFICATION_EVENT_TYPES } from "../domain/notification-event";

export const NotificationQueueMessageV1Schema = z.object({
  version: z.literal(1),
  messageId: z.string().min(1),
  intentId: z.string().min(1),
  eventType: z.enum(NOTIFICATION_EVENT_TYPES),
  createdAt: z.string().min(1),
});

export type NotificationQueueMessageV1 = z.infer<typeof NotificationQueueMessageV1Schema>;

export function createQueueMessageV1(
  intentId: string,
  eventType: NotificationEventType,
  messageId?: string
): NotificationQueueMessageV1 {
  return {
    version: 1,
    messageId: messageId || `nmsg_${crypto.randomUUID()}`,
    intentId,
    eventType,
    createdAt: new Date().toISOString(),
  };
}

export function validateQueueMessageV1(raw: unknown): NotificationQueueMessageV1 {
  const parsed = NotificationQueueMessageV1Schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Malformed queue message envelope: ${JSON.stringify(parsed.error.format())}`);
  }
  return parsed.data;
}
