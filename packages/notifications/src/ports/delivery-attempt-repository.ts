/**
 * Delivery Attempt Repository Port
 */

import { NotificationDeliveryAttempt } from "../domain/delivery-attempt";

export interface DeliveryAttemptRepository {
  record(attempt: NotificationDeliveryAttempt): Promise<void>;
  findByDeliveryId(deliveryId: string): Promise<NotificationDeliveryAttempt[]>;
}
