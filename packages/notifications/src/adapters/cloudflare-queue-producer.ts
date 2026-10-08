import type { NotificationQueueProducer } from "../ports/queue-producer";
import type { NotificationQueueMessageV1 } from "../queue/contract";
export interface NotificationQueueBinding { send(body: NotificationQueueMessageV1): Promise<void> }
/** Native Cloudflare Queue binding only. Unconfigured queues fail recoverably. */
export class CloudflareNotificationQueueProducer implements NotificationQueueProducer {
  constructor(private binding?: NotificationQueueBinding) {}
  async publish(message: NotificationQueueMessageV1) {
    if (!this.binding || typeof this.binding.send !== "function") throw new Error("NOTIFICATION_QUEUE_UNAVAILABLE");
    await this.binding.send(message);
    return { messageId: message.messageId };
  }
}
