/**
 * Notification Preference Policies
 *
 * Distinguishes mandatory safety/security communications from optional service alerts.
 * INVARIANT: Critical security and transaction notifications cannot be opted out of via UI toggles.
 */

import { NotificationCategory } from "../domain/category";
import { NotificationChannel } from "../domain/channel";

export interface UserNotificationPreference {
  userId: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  enabled: boolean;
}

/**
 * Categories that are strictly MANDATORY and cannot be opted out of.
 */
export const MANDATORY_CATEGORIES: readonly NotificationCategory[] = ["SECURITY"] as const;

/**
 * Channels that are mandatory for specific categories.
 * For SECURITY category, Email and WhatsApp (or in-app) are mandatory.
 */
export function isChannelMandatoryForCategory(
  category: NotificationCategory,
  channel: NotificationChannel
): boolean {
  if (category === "SECURITY") {
    // In-app and Email are non-negotiably mandatory for account security alerts
    return channel === "IN_APP" || channel === "EMAIL";
  }
  return false;
}
