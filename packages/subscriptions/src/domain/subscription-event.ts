/**
 * VaahanSafe Subscription Events (Append-Only Audit & Timeline)
 *
 * INVARIANTS:
 * - Append-only historical record of all lifecycle triggers and renewals.
 * - Idempotency tracking prevents duplicate renewal applications.
 */

export type SubscriptionEventId = string & { readonly __brand: unique symbol };

export const SUBSCRIPTION_EVENT_TYPES = [
  "CREATED",
  "PAYMENT_CONFIRMED",
  "ACTIVATED",
  "RENEWAL_SUCCEEDED",
  "RENEWAL_FAILED",
  "PAST_DUE",
  "RECOVERED",
  "CANCELLATION_REQUESTED",
  "CANCELLED",
  "EXPIRED",
] as const;

export type SubscriptionEventType = (typeof SUBSCRIPTION_EVENT_TYPES)[number];

export interface SubscriptionEvent {
  id: SubscriptionEventId;
  subscriptionId: string;
  eventType: SubscriptionEventType;
  payloadJson?: string;
  createdAt: string;
}

export interface CreateSubscriptionEventParams {
  id?: string;
  subscriptionId: string;
  eventType: SubscriptionEventType;
  payload?: Record<string, unknown>;
  createdAt?: string;
}

/**
 * Generates an opaque SubscriptionEventId (sev_xxx).
 */
export function generateSubscriptionEventId(): SubscriptionEventId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = "sev_";
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as SubscriptionEventId;
}

/**
 * Creates an append-only SubscriptionEvent entity.
 */
export function createSubscriptionEvent(params: CreateSubscriptionEventParams): SubscriptionEvent {
  const now = new Date().toISOString();
  return {
    id: params.id ? (params.id as SubscriptionEventId) : generateSubscriptionEventId(),
    subscriptionId: params.subscriptionId.trim(),
    eventType: params.eventType,
    payloadJson: params.payload ? JSON.stringify(params.payload) : undefined,
    createdAt: params.createdAt || now,
  };
}
