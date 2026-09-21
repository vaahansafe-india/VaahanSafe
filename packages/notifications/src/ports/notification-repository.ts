/**
 * Canonical In-App Notification Repository Port
 *
 * Stores first-party user notifications.
 * INVARIANT: User A must never access or modify User B notifications (IDOR guard).
 */

import { Notification } from "../domain/notification";

export interface NotificationRepository {
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAsRead(id: string, userId: string, readAt?: string): Promise<boolean>;
  markAsUnread(id: string, userId: string): Promise<boolean>;
  markAllAsRead(userId: string, readAt?: string): Promise<number>;
  markAsArchived(id: string, userId: string, archivedAt?: string): Promise<boolean>;
  unarchive(id: string, userId: string): Promise<boolean>;
  bulkMarkAsRead(ids: string[], userId: string, readAt?: string): Promise<number>;
  bulkMarkAsUnread(ids: string[], userId: string): Promise<number>;
  bulkArchive(ids: string[], userId: string, archivedAt?: string): Promise<number>;
  save(notification: Notification): Promise<void>;
}
