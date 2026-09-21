/**
 * Notification Delivery Repository Port
 */

import { NotificationDelivery } from "../domain/delivery";
import { NotificationChannel } from "../domain/channel";
import { DeliveryStatus } from "../domain/status";

export interface UpdateDeliveryStatusInput {
  providerMessageId?: string;
  attemptCount?: number;
  lastFailureCode?: string;
  nextAttemptAt?: string;
  deliveredAt?: string;
}

export interface NotificationDeliveryRepository {
  findById(id: string): Promise<NotificationDelivery | null>;
  findByIntentAndChannel(intentId: string, channel: NotificationChannel): Promise<NotificationDelivery | null>;
  findByIntentId(intentId: string): Promise<NotificationDelivery[]>;
  save(delivery: NotificationDelivery): Promise<void>;
  updateStatus(
    id: string,
    status: DeliveryStatus,
    updates?: UpdateDeliveryStatusInput
  ): Promise<void>;
}
