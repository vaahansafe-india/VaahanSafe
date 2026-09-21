/**
 * Canonical Notification Categories
 *
 * Categorizes communications independently of delivery providers.
 * Used for preference routing, retention, and mandatory-policy evaluation.
 */

export const NOTIFICATION_CATEGORIES = [
  "ACCOUNT",
  "SECURITY",
  "SAFETY",
  "COMMERCE",
  "SUBSCRIPTION",
  "FULFILMENT",
  "SUPPORT",
  "SYSTEM",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export function isValidNotificationCategory(category: string): category is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(category);
}
