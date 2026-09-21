/**
 * In-Memory Test Queue Producer
 *
 * Implements NotificationQueueProducer for local execution and unit tests.
 */

import { NotificationQueueProducer } from "../ports/queue-producer";
import { NotificationQueueMessageV1 } from "../queue/contract";

export class MemoryQueueProducer implements NotificationQueueProducer {
  public publishedMessages: NotificationQueueMessageV1[] = [];
  public shouldFail = false;

  async publish(message: NotificationQueueMessageV1): Promise<{ messageId: string }> {
    if (this.shouldFail) {
      throw new Error("Cloudflare NOTIFICATION_QUEUE publish failed: Service Unavailable");
    }

    this.publishedMessages.push(message);
    return { messageId: message.messageId };
  }

  clear(): void {
    this.publishedMessages = [];
    this.shouldFail = false;
  }
}
