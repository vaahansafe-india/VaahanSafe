/**
 * Canonical Notification Delivery Channels
 *
 * INVARIANT: Defines distinct communication surfaces.
 * Note: OTP is authentication infrastructure and is NOT a general notification channel.
 */

export const NOTIFICATION_CHANNELS = ["IN_APP", "WHATSAPP", "EMAIL"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export function isValidNotificationChannel(channel: string): channel is NotificationChannel {
  return (NOTIFICATION_CHANNELS as readonly string[]).includes(channel);
}
