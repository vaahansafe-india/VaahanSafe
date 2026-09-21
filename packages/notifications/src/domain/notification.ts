/**
 * Canonical In-App Notification Entity
 *
 * First-party VaahanSafe notification record displayed in the customer/admin UI.
 * INVARIANT: Unread status is UI state only and NEVER alters business state.
 */

import { NotificationEventType } from "./notification-event";
import { NotificationCategory } from "./category";
import { NotificationPriority } from "./priority";

export const NOTIFICATION_ACTION_TYPES = [
  "VIEW_QR",
  "VIEW_ORDER",
  "VIEW_SUBSCRIPTION",
  "VIEW_SHIPMENT",
  "VIEW_SUPPORT_TICKET",
  "VIEW_SECURITY",
  "NONE",
] as const;

export type NotificationActionType = (typeof NOTIFICATION_ACTION_TYPES)[number];

export interface Notification {
  id: string;
  userId: string;
  intentId: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  bodySafe: string;
  actionType: NotificationActionType;
  actionTarget?: string;
  readAt?: string;
  archivedAt?: string;
  createdAt: string;
}

export interface CreateNotificationInput {
  id?: string;
  userId: string;
  intentId: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  bodySafe: string;
  actionType?: NotificationActionType;
  actionTarget?: string;
  readAt?: string;
  archivedAt?: string;
  createdAt?: string;
}

export function createNotification(input: CreateNotificationInput): Notification {
  return {
    id: input.id || `notif_${crypto.randomUUID()}`,
    userId: input.userId,
    intentId: input.intentId,
    eventType: input.eventType,
    category: input.category,
    priority: input.priority || "NORMAL",
    title: input.title,
    bodySafe: input.bodySafe,
    actionType: input.actionType || "NONE",
    actionTarget: input.actionTarget,
    readAt: input.readAt,
    archivedAt: input.archivedAt,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}
