/**
 * Notification Intent Repository Port
 */

import { NotificationIntent } from "../domain/notification-intent";
import { IntentStatus } from "../domain/status";

export interface NotificationIntentRepository {
  findById(id: string): Promise<NotificationIntent | null>;
  findByDedupeKey(dedupeKey: string): Promise<NotificationIntent | null>;
  findPendingIntents(limit?: number): Promise<NotificationIntent[]>;
  save(intent: NotificationIntent): Promise<void>;
  updateStatus(id: string, status: IntentStatus, dispatchedAt?: string): Promise<void>;
}
