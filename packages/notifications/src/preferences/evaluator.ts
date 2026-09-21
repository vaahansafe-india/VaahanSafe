/**
 * Central Notification Channel Preference Evaluator
 *
 * Resolves final deliverable channels based on:
 * 1. Event policy matrix defaults
 * 2. Mandatory security policy rules (security alerts override user opt-out)
 * 3. User opt-in/opt-out preferences
 * 4. Recipient contact capabilities (e.g. user must have verified email for Email channel)
 */

import { NotificationEventType } from "../domain/notification-event";
import { NotificationCategory } from "../domain/category";
import { NotificationChannel } from "../domain/channel";
import { getEligibleChannelsForEvent } from "../events/event-policy";
import { UserNotificationPreference, isChannelMandatoryForCategory } from "./policy";

export interface RecipientCapabilities {
  hasPhone: boolean;
  hasEmail: boolean;
}

export interface EvaluateChannelsInput {
  eventType: NotificationEventType;
  category: NotificationCategory;
  userPreferences?: UserNotificationPreference[];
  capabilities: RecipientCapabilities;
}

export function evaluateNotificationChannels(input: EvaluateChannelsInput): NotificationChannel[] {
  const defaultEligible = getEligibleChannelsForEvent(input.eventType);
  const preferences = input.userPreferences || [];

  const activeChannels: NotificationChannel[] = [];

  for (const channel of defaultEligible) {
    // 1. Check recipient capability
    if (channel === "WHATSAPP" && !input.capabilities.hasPhone) {
      continue;
    }
    if (channel === "EMAIL" && !input.capabilities.hasEmail) {
      continue;
    }

    // 2. Check if mandatory policy applies
    if (isChannelMandatoryForCategory(input.category, channel)) {
      activeChannels.push(channel);
      continue;
    }

    // 3. Evaluate user preferences
    const pref = preferences.find(
      (p) => p.category === input.category && p.channel === channel
    );

    if (pref) {
      if (pref.enabled) {
        activeChannels.push(channel);
      }
      // If pref.enabled is false, the channel is suppressed by user preference
    } else {
      // Default behavior when no explicit preference record exists:
      // IN_APP is always active by default.
      // EMAIL and WHATSAPP are active by default for transactional events.
      activeChannels.push(channel);
    }
  }

  return activeChannels;
}
