/**
 * Notification Priorities
 *
 * Explicit priority levels ensuring emergency safety and security events
 * are never treated as low-priority marketing notifications.
 */

export const NOTIFICATION_PRIORITIES = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export function isValidNotificationPriority(priority: string): priority is NotificationPriority {
  return (NOTIFICATION_PRIORITIES as readonly string[]).includes(priority);
}
