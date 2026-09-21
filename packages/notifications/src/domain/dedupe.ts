/**
 * Stable Deduplication Key Generators
 *
 * Prevents duplicate notification intents and redundant queue dispatches.
 * INVARIANT: PII (phone numbers, email addresses, names) MUST NEVER be used as dedupe keys.
 */

export const DedupeKeys = {
  accountWelcome(userId: string): string {
    return `welcome:${userId}`;
  },

  qrActivated(qrAssignmentId: string): string {
    return `qr-activated:${qrAssignmentId}`;
  },

  paymentSuccess(paymentId: string): string {
    return `payment-success:${paymentId}`;
  },

  subscriptionRenewed(subscriptionEventId: string): string {
    return `renewal:${subscriptionEventId}`;
  },

  subscriptionRenewalFailed(subscriptionEventId: string): string {
    return `renewal-failed:${subscriptionEventId}`;
  },

  shipmentUpdated(shipmentId: string, status: string): string {
    return `shipment:${shipmentId}:${status.toLowerCase()}`;
  },

  replacementApproved(replacementId: string): string {
    return `replacement:${replacementId}:approved`;
  },

  securityChanged(auditEventId: string): string {
    return `security-change:${auditEventId}`;
  },

  supportUpdated(ticketId: string, updateId: string): string {
    return `support:${ticketId}:${updateId}`;
  },

  /**
   * Generates a time-bucketed dedupe key for emergency QR scans.
   * Window size prevents notification storming when a public QR is scanned repeatedly.
   *
   * @param vehicleId Authoritative vehicle identifier
   * @param windowSeconds Window length in seconds (defaults to 900 = 15 minutes)
   * @param timestamp Optional timestamp (defaults to Date.now())
   */
  emergencyScanAlert(
    vehicleId: string,
    windowSeconds = 900,
    timestamp: number = Date.now()
  ): string {
    const windowBucket = Math.floor(timestamp / (windowSeconds * 1000));
    return `scan-alert:${vehicleId}:${windowBucket}`;
  },
};
