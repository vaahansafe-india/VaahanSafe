/**
 * Notification Queue Producer Port
 */

import { NotificationQueueMessageV1 } from "../queue/contract";

export interface NotificationQueueProducer {
  publish(message: NotificationQueueMessageV1): Promise<{ messageId: string }>;
}
