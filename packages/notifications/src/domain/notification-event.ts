/**
 * Canonical Notification Event Types
 *
 * Represents business domain occurrences that warrant customer communication.
 * INVARIANT: OTP is an authentication capability, NOT a notification event.
 */

export const NOTIFICATION_EVENT_TYPES = [
  "ACCOUNT_WELCOME",
  "QR_ACTIVATED",
  "PAYMENT_SUCCEEDED",
  "SUBSCRIPTION_RENEWED",
  "SUBSCRIPTION_RENEWAL_FAILED",
  "SHIPMENT_UPDATED",
  "REPLACEMENT_APPROVED",
  "EMERGENCY_SCAN_ALERT",
  "SECURITY_CHANGED",
  "SUPPORT_UPDATED",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export function isNotificationEventType(type: string): type is NotificationEventType {
  return (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(type);
}
