/**
 * Notification Intent Domain Entity
 *
 * Represents an intent to notify a recipient following an authoritative business event.
 * INVARIANT: Represents desired communication; does NOT imply delivery has succeeded.
 */

import { NotificationEventType } from "./notification-event";
import { NotificationCategory } from "./category";
import { NotificationPriority } from "./priority";
import { IntentStatus } from "./status";

export interface NotificationIntent {
  id: string;
  eventType: NotificationEventType;
  recipientUserId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  templateKey: string;
  templateVersion: number;
  payload: Record<string, unknown>;
  sourceType: string;
  sourceId: string;
  dedupeKey: string;
  status: IntentStatus;
  createdAt: string;
  dispatchedAt?: string;
}

export interface CreateNotificationIntentInput {
  id?: string;
  eventType: NotificationEventType;
  recipientUserId: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  templateKey: string;
  templateVersion?: number;
  payload: Record<string, unknown>;
  sourceType: string;
  sourceId: string;
  dedupeKey: string;
  createdAt?: string;
}

export function createNotificationIntent(
  input: CreateNotificationIntentInput
): NotificationIntent {
  if (!input.recipientUserId) {
    throw new Error("recipientUserId is required to create a NotificationIntent");
  }
  if (!input.dedupeKey) {
    throw new Error("dedupeKey is required to create a NotificationIntent");
  }

  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id || `nint_${crypto.randomUUID()}`,
    eventType: input.eventType,
    recipientUserId: input.recipientUserId,
    category: input.category,
    priority: input.priority || "NORMAL",
    templateKey: input.templateKey,
    templateVersion: input.templateVersion ?? 1,
    payload: input.payload,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    dedupeKey: input.dedupeKey,
    status: "PENDING",
    createdAt: now,
  };
}
