/**
 * Notification, Intent, and Delivery Statuses
 */

/**
 * Status of the high-level intent representing desired business communication.
 */
export const INTENT_STATUSES = ["PENDING", "QUEUED", "PROCESSED", "FAILED"] as const;
export type IntentStatus = (typeof INTENT_STATUSES)[number];

/**
 * Status of individual channel deliveries.
 * Each channel (IN_APP, WHATSAPP, EMAIL) progresses through these states independently.
 */
export const DELIVERY_STATUSES = [
  "PENDING",
  "QUEUED",
  "PROCESSING",
  "DELIVERED",
  "FAILED_RETRYABLE",
  "FAILED_PERMANENT",
  "DEAD_LETTERED",
  "SUPPRESSED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/**
 * Result outcome of a single delivery attempt.
 */
export const ATTEMPT_RESULTS = ["SUCCESS", "RETRYABLE_FAILURE", "PERMANENT_FAILURE"] as const;
export type AttemptResult = (typeof ATTEMPT_RESULTS)[number];
