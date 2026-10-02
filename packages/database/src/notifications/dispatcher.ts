/**
 * VaahanSafe In-App Notification Dispatcher
 *
 * Centralized, authoritative helper to record and deliver in-app notifications
 * across all backend mutations (orders, payments, vehicles, QR activations, scans).
 */

import type { DatabaseClient } from "../client/d1";
import { getAuthoritativeDatabaseClient } from "../client/factory";
import type { Notification } from "@vaahansafe/notifications";

export interface CreateInAppNotificationParams {
  userId: string;
  eventType: string;
  category?: "ACCOUNT" | "SECURITY" | "SAFETY" | "COMMERCE" | "SUBSCRIPTION" | "FULFILMENT" | "SUPPORT" | "SYSTEM";
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  title: string;
  body: string;
  actionType?: "VIEW_QR" | "VIEW_ORDER" | "VIEW_SUBSCRIPTION" | "VIEW_SHIPMENT" | "VIEW_SUPPORT_TICKET" | "VIEW_SECURITY" | "NONE";
  actionTarget?: string;
  db?: DatabaseClient;
}

export async function createInAppNotification(
  dbOrParams: DatabaseClient | CreateInAppNotificationParams,
  maybeParams?: CreateInAppNotificationParams
): Promise<Notification> {
  const isFirstParamDb = "query" in dbOrParams && typeof dbOrParams.query === "function";
  const db = isFirstParamDb ? (dbOrParams as DatabaseClient) : ((dbOrParams as CreateInAppNotificationParams).db || getAuthoritativeDatabaseClient());
  const params: CreateInAppNotificationParams = isFirstParamDb ? maybeParams! : (dbOrParams as CreateInAppNotificationParams);

  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const intentId = `intent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const category = params.category || "ACCOUNT";
  const priority = params.priority || "NORMAL";
  const actionType = params.actionType || "NONE";
  const actionTarget = params.actionTarget || null;

  try {
    // 1. Record notification intent
    await db.execute(
      `INSERT INTO notification_intents (
         id, event_type, recipient_user_id, category, priority,
         template_key, template_version, payload_json, source_type,
         source_id, dedupe_key, status, created_at, dispatched_at
       ) VALUES (?, ?, ?, ?, ?, 'CANONICAL_IN_APP', 1, '{}', 'SYSTEM', ?, ?, 'PROCESSED', ?, ?)
       ON CONFLICT(dedupe_key) DO NOTHING`,
      [
        intentId,
        params.eventType,
        params.userId,
        category,
        priority,
        id,
        `dedupe_${id}`,
        now,
        now,
      ]
    );

    // 2. Insert in-app notification record
    await db.execute(
      `INSERT INTO notifications (
         id, user_id, intent_id, event_type, category, priority,
         title, body_safe, action_type, action_target, read_at, archived_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
      [
        id,
        params.userId,
        intentId,
        params.eventType,
        category,
        priority,
        params.title,
        params.body,
        actionType,
        actionTarget,
        now,
      ]
    );
  } catch (err) {
    console.error("[createInAppNotification] Error recording notification:", err);
  }

  return {
    id,
    userId: params.userId,
    intentId,
    eventType: params.eventType as any,
    category: category as any,
    priority: priority as any,
    title: params.title,
    bodySafe: params.body,
    actionType: actionType as any,
    actionTarget: actionTarget || undefined,
    createdAt: now,
  };
}
