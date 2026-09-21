/**
 * Notification Preference Repository Port
 */

import { UserNotificationPreference } from "../preferences/policy";

export interface NotificationPreferenceRepository {
  findByUserId(userId: string): Promise<UserNotificationPreference[]>;
  savePreference(preference: UserNotificationPreference): Promise<void>;
  bulkSavePreferences(userId: string, preferences: UserNotificationPreference[]): Promise<void>;
}
