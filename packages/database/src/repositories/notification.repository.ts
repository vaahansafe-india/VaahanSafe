/**
 * VaahanSafe D1 Notification Repositories Implementation
 *
 * Implements NotificationIntentRepository, NotificationRepository,
 * NotificationDeliveryRepository, DeliveryAttemptRepository, and
 * NotificationPreferenceRepository against Cloudflare D1 with parameterized SQL.
 *
 * INVARIANT: User A must never access or mark read User B notifications (IDOR guard).
 */

import {
  NotificationIntent,
  NotificationIntentRepository,
  Notification,
  NotificationRepository,
  NotificationDelivery,
  NotificationDeliveryRepository,
  UpdateDeliveryStatusInput,
  NotificationDeliveryAttempt,
  DeliveryAttemptRepository,
  NotificationPreferenceRepository,
  UserNotificationPreference,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationActionType,
  IntentStatus,
  DeliveryStatus,
  AttemptResult,
} from "@vaahansafe/notifications";
import type { DatabaseClient } from "../client/d1";

interface DbNotificationIntentRow {
  id: string;
  event_type: string;
  recipient_user_id: string;
  category: string;
  priority: string;
  template_key: string;
  template_version: number;
  payload_json: string;
  source_type: string;
  source_id: string;
  dedupe_key: string;
  status: string;
  created_at: string;
  dispatched_at: string | null;
}

interface DbNotificationRow {
  id: string;
  user_id: string;
  intent_id: string;
  event_type: string;
  category: string;
  priority: string;
  title: string;
  body_safe: string;
  action_type: string | null;
  action_target: string | null;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
}

interface DbDeliveryRow {
  id: string;
  intent_id: string;
  notification_id: string | null;
  channel: string;
  provider: string;
  status: string;
  provider_message_id: string | null;
  attempt_count: number;
  last_failure_code: string | null;
  next_attempt_at: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
}

interface DbDeliveryAttemptRow {
  id: string;
  delivery_id: string;
  attempt_number: number;
  started_at: string;
  finished_at: string | null;
  result: string;
  normalized_error_code: string | null;
  provider_reference: string | null;
  request_id: string | null;
  created_at: string;
}

interface DbPreferenceRow {
  id: string;
  user_id: string;
  category: string;
  channel: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

function mapIntentRow(row: DbNotificationIntentRow): NotificationIntent {
  return {
    id: row.id,
    eventType: row.event_type as any,
    recipientUserId: row.recipient_user_id,
    category: row.category as NotificationCategory,
    priority: row.priority as NotificationPriority,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    payload: JSON.parse(row.payload_json || "{}"),
    sourceType: row.source_type,
    sourceId: row.source_id,
    dedupeKey: row.dedupe_key,
    status: row.status as IntentStatus,
    createdAt: row.created_at,
    dispatchedAt: row.dispatched_at || undefined,
  };
}

function mapNotificationRow(row: DbNotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    intentId: row.intent_id,
    eventType: row.event_type as any,
    category: row.category as NotificationCategory,
    priority: row.priority as NotificationPriority,
    title: row.title,
    bodySafe: row.body_safe,
    actionType: (row.action_type || "NONE") as NotificationActionType,
    actionTarget: row.action_target || undefined,
    readAt: row.read_at || undefined,
    archivedAt: row.archived_at || undefined,
    createdAt: row.created_at,
  };
}

function mapDeliveryRow(row: DbDeliveryRow): NotificationDelivery {
  return {
    id: row.id,
    intentId: row.intent_id,
    notificationId: row.notification_id || undefined,
    channel: row.channel as NotificationChannel,
    provider: row.provider as any,
    status: row.status as DeliveryStatus,
    providerMessageId: row.provider_message_id || undefined,
    attemptCount: row.attempt_count,
    lastFailureCode: row.last_failure_code || undefined,
    nextAttemptAt: row.next_attempt_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveredAt: row.delivered_at || undefined,
  };
}

function mapAttemptRow(row: DbDeliveryAttemptRow): NotificationDeliveryAttempt {
  return {
    id: row.id,
    deliveryId: row.delivery_id,
    attemptNumber: row.attempt_number,
    startedAt: row.started_at,
    finishedAt: row.finished_at || undefined,
    result: row.result as AttemptResult,
    normalizedErrorCode: row.normalized_error_code || undefined,
    providerReference: row.provider_reference || undefined,
    requestId: row.request_id || undefined,
    createdAt: row.created_at,
  };
}

export class D1NotificationIntentRepository implements NotificationIntentRepository {
  constructor(private db: DatabaseClient) {}

  async findById(id: string): Promise<NotificationIntent | null> {
    const row = await this.db.queryFirst<DbNotificationIntentRow>(
      `SELECT * FROM notification_intents WHERE id = ?`,
      [id]
    );
    return row ? mapIntentRow(row) : null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<NotificationIntent | null> {
    const row = await this.db.queryFirst<DbNotificationIntentRow>(
      `SELECT * FROM notification_intents WHERE dedupe_key = ?`,
      [dedupeKey]
    );
    return row ? mapIntentRow(row) : null;
  }

  async findPendingIntents(limit = 50): Promise<NotificationIntent[]> {
    const rows = await this.db.query<DbNotificationIntentRow>(
      `SELECT * FROM notification_intents WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?`,
      [limit]
    );
    return rows.map(mapIntentRow);
  }

  async save(intent: NotificationIntent): Promise<void> {
    const sql = `
      INSERT INTO notification_intents (
        id, event_type, recipient_user_id, category, priority,
        template_key, template_version, payload_json, source_type,
        source_id, dedupe_key, status, created_at, dispatched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        dispatched_at = excluded.dispatched_at
    `;
    await this.db.execute(sql, [
      intent.id,
      intent.eventType,
      intent.recipientUserId,
      intent.category,
      intent.priority,
      intent.templateKey,
      intent.templateVersion,
      JSON.stringify(intent.payload || {}),
      intent.sourceType,
      intent.sourceId,
      intent.dedupeKey,
      intent.status,
      intent.createdAt,
      intent.dispatchedAt || null,
    ]);
  }

  async updateStatus(id: string, status: IntentStatus, dispatchedAt?: string): Promise<void> {
    await this.db.execute(
      `UPDATE notification_intents SET status = ?, dispatched_at = COALESCE(?, dispatched_at) WHERE id = ?`,
      [status, dispatchedAt || null, id]
    );
  }
}

export class D1NotificationRepository implements NotificationRepository {
  constructor(private db: DatabaseClient) {}

  async findById(id: string): Promise<Notification | null> {
    const row = await this.db.queryFirst<DbNotificationRow>(
      `SELECT * FROM notifications WHERE id = ?`,
      [id]
    );
    return row ? mapNotificationRow(row) : null;
  }

  async findByUserId(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    const rows = await this.db.query<DbNotificationRow>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows.map(mapNotificationRow);
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    const row = await this.db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL AND archived_at IS NULL`,
      [userId]
    );
    return row?.count ?? 0;
  }

  async markAsRead(id: string, userId: string, readAt?: string): Promise<boolean> {
    const now = readAt || new Date().toISOString();
    // IDOR security check: enforce user_id matches
    const res = await this.db.execute(
      `UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL`,
      [now, id, userId]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async markAsUnread(id: string, userId: string): Promise<boolean> {
    // IDOR security check: enforce user_id matches
    const res = await this.db.execute(
      `UPDATE notifications SET read_at = NULL WHERE id = ? AND user_id = ? AND read_at IS NOT NULL`,
      [id, userId]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async markAllAsRead(userId: string, readAt?: string): Promise<number> {
    const now = readAt || new Date().toISOString();
    const res = await this.db.execute(
      `UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`,
      [now, userId]
    );
    return res.rowsAffected ?? 0;
  }

  async markAsArchived(id: string, userId: string, archivedAt?: string): Promise<boolean> {
    const now = archivedAt || new Date().toISOString();
    // IDOR security check: enforce user_id matches
    const res = await this.db.execute(
      `UPDATE notifications SET archived_at = ? WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
      [now, id, userId]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async unarchive(id: string, userId: string): Promise<boolean> {
    // IDOR security check: enforce user_id matches
    const res = await this.db.execute(
      `UPDATE notifications SET archived_at = NULL WHERE id = ? AND user_id = ? AND archived_at IS NOT NULL`,
      [id, userId]
    );
    return (res.rowsAffected ?? 0) > 0;
  }

  async bulkMarkAsRead(ids: string[], userId: string, readAt?: string): Promise<number> {
    if (ids.length === 0) return 0;
    const now = readAt || new Date().toISOString();
    const placeholders = ids.map(() => "?").join(",");
    const res = await this.db.execute(
      `UPDATE notifications SET read_at = ? WHERE user_id = ? AND id IN (${placeholders}) AND read_at IS NULL`,
      [now, userId, ...ids]
    );
    return res.rowsAffected ?? 0;
  }

  async bulkMarkAsUnread(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;
    const placeholders = ids.map(() => "?").join(",");
    const res = await this.db.execute(
      `UPDATE notifications SET read_at = NULL WHERE user_id = ? AND id IN (${placeholders}) AND read_at IS NOT NULL`,
      [userId, ...ids]
    );
    return res.rowsAffected ?? 0;
  }

  async bulkArchive(ids: string[], userId: string, archivedAt?: string): Promise<number> {
    if (ids.length === 0) return 0;
    const now = archivedAt || new Date().toISOString();
    const placeholders = ids.map(() => "?").join(",");
    const res = await this.db.execute(
      `UPDATE notifications SET archived_at = ? WHERE user_id = ? AND id IN (${placeholders}) AND archived_at IS NULL`,
      [now, userId, ...ids]
    );
    return res.rowsAffected ?? 0;
  }

  async save(notification: Notification): Promise<void> {
    const sql = `
      INSERT INTO notifications (
        id, user_id, intent_id, event_type, category, priority,
        title, body_safe, action_type, action_target, read_at, archived_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        read_at = excluded.read_at,
        archived_at = excluded.archived_at
    `;
    await this.db.execute(sql, [
      notification.id,
      notification.userId,
      notification.intentId,
      notification.eventType,
      notification.category,
      notification.priority,
      notification.title,
      notification.bodySafe,
      notification.actionType || "NONE",
      notification.actionTarget || null,
      notification.readAt || null,
      notification.archivedAt || null,
      notification.createdAt,
    ]);
  }
}

export class D1NotificationDeliveryRepository implements NotificationDeliveryRepository {
  constructor(private db: DatabaseClient) {}

  async findById(id: string): Promise<NotificationDelivery | null> {
    const row = await this.db.queryFirst<DbDeliveryRow>(
      `SELECT * FROM notification_deliveries WHERE id = ?`,
      [id]
    );
    return row ? mapDeliveryRow(row) : null;
  }

  async findByIntentAndChannel(
    intentId: string,
    channel: NotificationChannel
  ): Promise<NotificationDelivery | null> {
    const row = await this.db.queryFirst<DbDeliveryRow>(
      `SELECT * FROM notification_deliveries WHERE intent_id = ? AND channel = ?`,
      [intentId, channel]
    );
    return row ? mapDeliveryRow(row) : null;
  }

  async findByIntentId(intentId: string): Promise<NotificationDelivery[]> {
    const rows = await this.db.query<DbDeliveryRow>(
      `SELECT * FROM notification_deliveries WHERE intent_id = ?`,
      [intentId]
    );
    return rows.map(mapDeliveryRow);
  }

  async save(delivery: NotificationDelivery): Promise<void> {
    const sql = `
      INSERT INTO notification_deliveries (
        id, intent_id, notification_id, channel, provider, status,
        provider_message_id, attempt_count, last_failure_code, next_attempt_at,
        created_at, updated_at, delivered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        provider_message_id = excluded.provider_message_id,
        attempt_count = excluded.attempt_count,
        last_failure_code = excluded.last_failure_code,
        next_attempt_at = excluded.next_attempt_at,
        updated_at = excluded.updated_at,
        delivered_at = excluded.delivered_at
    `;
    await this.db.execute(sql, [
      delivery.id,
      delivery.intentId,
      delivery.notificationId || null,
      delivery.channel,
      delivery.provider,
      delivery.status,
      delivery.providerMessageId || null,
      delivery.attemptCount,
      delivery.lastFailureCode || null,
      delivery.nextAttemptAt || null,
      delivery.createdAt,
      delivery.updatedAt,
      delivery.deliveredAt || null,
    ]);
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    updates: UpdateDeliveryStatusInput = {}
  ): Promise<void> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE notification_deliveries SET
        status = ?,
        provider_message_id = COALESCE(?, provider_message_id),
        attempt_count = COALESCE(?, attempt_count),
        last_failure_code = COALESCE(?, last_failure_code),
        next_attempt_at = ?,
        delivered_at = COALESCE(?, delivered_at),
        updated_at = ?
      WHERE id = ?
    `;
    await this.db.execute(sql, [
      status,
      updates.providerMessageId || null,
      updates.attemptCount ?? null,
      updates.lastFailureCode || null,
      updates.nextAttemptAt || null,
      updates.deliveredAt || null,
      now,
      id,
    ]);
  }
}

export class D1DeliveryAttemptRepository implements DeliveryAttemptRepository {
  constructor(private db: DatabaseClient) {}

  async record(attempt: NotificationDeliveryAttempt): Promise<void> {
    const sql = `
      INSERT INTO notification_delivery_attempts (
        id, delivery_id, attempt_number, started_at, finished_at,
        result, normalized_error_code, provider_reference, request_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await this.db.execute(sql, [
      attempt.id,
      attempt.deliveryId,
      attempt.attemptNumber,
      attempt.startedAt,
      attempt.finishedAt || null,
      attempt.result,
      attempt.normalizedErrorCode || null,
      attempt.providerReference || null,
      attempt.requestId || null,
      attempt.createdAt,
    ]);
  }

  async findByDeliveryId(deliveryId: string): Promise<NotificationDeliveryAttempt[]> {
    const rows = await this.db.query<DbDeliveryAttemptRow>(
      `SELECT * FROM notification_delivery_attempts WHERE delivery_id = ? ORDER BY attempt_number ASC`,
      [deliveryId]
    );
    return rows.map(mapAttemptRow);
  }
}

export class D1NotificationPreferenceRepository implements NotificationPreferenceRepository {
  constructor(private db: DatabaseClient) {}

  async findByUserId(userId: string): Promise<UserNotificationPreference[]> {
    const rows = await this.db.query<DbPreferenceRow>(
      `SELECT * FROM notification_preferences WHERE user_id = ?`,
      [userId]
    );
    return rows.map((r) => ({
      userId: r.user_id,
      category: r.category as NotificationCategory,
      channel: r.channel as NotificationChannel,
      enabled: r.enabled === 1,
    }));
  }

  async savePreference(preference: UserNotificationPreference): Promise<void> {
    const now = new Date().toISOString();
    const id = `pref_${crypto.randomUUID()}`;
    const sql = `
      INSERT INTO notification_preferences (
        id, user_id, category, channel, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, category, channel) DO UPDATE SET
        enabled = excluded.enabled,
        updated_at = excluded.updated_at
    `;
    await this.db.execute(sql, [
      id,
      preference.userId,
      preference.category,
      preference.channel,
      preference.enabled ? 1 : 0,
      now,
      now,
    ]);
  }

  async bulkSavePreferences(
    userId: string,
    preferences: UserNotificationPreference[]
  ): Promise<void> {
    for (const pref of preferences) {
      await this.savePreference({ ...pref, userId });
    }
  }
}
