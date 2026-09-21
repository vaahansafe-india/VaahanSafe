/**
 * Notification Intent Producer & Reconciliation Service
 *
 * Implements resilient intent recording and queue dispatch.
 * INVARIANT: If Cloudflare Queue publication fails, the business transaction
 * and the persisted intent remain valid. The failure is logged and recoverable.
 */

import {
  NotificationIntent,
  CreateNotificationIntentInput,
  createNotificationIntent,
} from "../domain/notification-intent";
import { NotificationIntentRepository } from "../ports/notification-intent-repository";
import { NotificationQueueProducer } from "../ports/queue-producer";
import { createQueueMessageV1 } from "./contract";
import { NotificationLogger } from "../errors/notification-errors";

export interface RecordAndPublishResult {
  intent: NotificationIntent;
  published: boolean;
  error?: string;
}

export class NotificationProducerService {
  constructor(
    private intentRepo: NotificationIntentRepository,
    private queueProducer: NotificationQueueProducer
  ) {}

  /**
   * Persists a NotificationIntent in D1 and publishes a minimal V1 envelope to NOTIFICATION_QUEUE.
   * INVARIANT: Never throws if queue publication fails; returns published: false so caller knows
   * intent is safely recorded and recoverable.
   */
  async recordAndPublishIntent(
    input: CreateNotificationIntentInput
  ): Promise<RecordAndPublishResult> {
    // 1. Check dedupe key first to ensure idempotency
    const existing = await this.intentRepo.findByDedupeKey(input.dedupeKey);
    if (existing) {
      NotificationLogger.info("Duplicate notification intent suppressed by dedupe key", {
        intentId: existing.id,
        dedupeKey: input.dedupeKey,
        eventType: input.eventType,
      });
      return { intent: existing, published: existing.status !== "PENDING" };
    }

    // 2. Create and persist authoritative intent in D1
    const intent = createNotificationIntent(input);
    await this.intentRepo.save(intent);

    NotificationLogger.info("Notification intent persisted to D1", {
      intentId: intent.id,
      eventType: intent.eventType,
      category: intent.category,
      recipientUserId: intent.recipientUserId,
    });

    // 3. Attempt queue publication
    try {
      const queueMessage = createQueueMessageV1(intent.id, intent.eventType);
      await this.queueProducer.publish(queueMessage);

      // Update intent status to QUEUED
      await this.intentRepo.updateStatus(intent.id, "QUEUED");
      intent.status = "QUEUED";

      NotificationLogger.info("Notification message published to queue", {
        intentId: intent.id,
        eventType: intent.eventType,
      });

      return { intent, published: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      NotificationLogger.warn(
        "Queue publication failed; intent remains in PENDING state for background reconciliation",
        {
          intentId: intent.id,
          eventType: intent.eventType,
          error: errorMsg,
        }
      );

      return {
        intent,
        published: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Recovery worker: scans for PENDING intents and attempts to republish them.
   */
  async republishPendingIntents(limit = 20): Promise<{ recoveredCount: number }> {
    const pending = await this.intentRepo.findPendingIntents(limit);
    let recoveredCount = 0;

    for (const intent of pending) {
      try {
        const queueMessage = createQueueMessageV1(intent.id, intent.eventType);
        await this.queueProducer.publish(queueMessage);
        await this.intentRepo.updateStatus(intent.id, "QUEUED");
        recoveredCount++;
      } catch (err: unknown) {
        NotificationLogger.warn("Failed to republish pending intent", {
          intentId: intent.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { recoveredCount };
  }
}
