# Cloudflare Queue Contract & Idempotency (`NOTIFICATION_QUEUE`)

## 1. Versioned Queue Message Contract (`NotificationQueueMessageV1`)

Cloudflare Queues pass minimal envelopes between producers and consumers:

```typescript
export interface NotificationQueueMessageV1 {
  version: 1;
  messageId: string;
  intentId: string;
  eventType: NotificationEventType;
  createdAt: string;
}
```

### Invariants:
1. **Zero PII Envelope**: Queue messages contain ONLY metadata (`intentId`, `eventType`). Zero phone numbers, email addresses, names, medical details, or payment card details exist in the queue payload.
2. **Authoritative Source**: The consumer resolves the authoritative intent and validated variables directly from D1 by `intentId`.
3. **At-Least-Once Delivery**: Cloudflare Queues guarantee at-least-once delivery; consumers must be completely idempotent.

---

## 2. Idempotent Consumer Pipeline

When the consumer receives a message:
1. **Schema Check**: Validates `NotificationQueueMessageV1`.
2. **Intent Lookup**: Fetches `NotificationIntent` from D1.
3. **Idempotency Guard**: If `intent.status === 'PROCESSED'`, skips duplicate processing immediately.
4. **Channel Delivery Lookup**: Checks `notification_deliveries` for existing rows:
   - If a channel is already `DELIVERED`, it is skipped.
5. **Channel Independence**: Each channel runs isolated:
   - WhatsApp failure does NOT roll back or cancel In-App or Email.
   - Deliveries record individual attempt counts and provider message IDs.
