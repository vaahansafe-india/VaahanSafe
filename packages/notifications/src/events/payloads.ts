/**
 * Strongly-Typed Business Notification Payloads
 *
 * INVARIANT: Privacy & Least Privilege: Only the minimum information required
 * for communication is included. Full User, Vehicle, or Order objects are forbidden.
 */

export interface AccountWelcomePayload {
  displayName: string;
  accountCreatedDate: string;
}

export interface QrActivatedPayload {
  publicId: string;
  vehicleRegMasked: string;
  vehicleNickname?: string;
}

export interface PaymentSucceededPayload {
  orderId: string;
  orderNumber: string;
  amountDisplay: string;
  paymentId: string;
}

export interface SubscriptionRenewedPayload {
  subscriptionId: string;
  planName: string;
  nextBillingDate: string;
}

export interface SubscriptionRenewalFailedPayload {
  subscriptionId: string;
  planName: string;
  failureReason?: string;
}

export interface ShipmentUpdatedPayload {
  shipmentId: string;
  status: string;
  trackingNumber?: string;
  carrierName?: string;
}

export interface ReplacementApprovedPayload {
  replacementRequestId: string;
  originalPublicId: string;
  newPublicId?: string;
}

export interface EmergencyScanAlertPayload {
  vehicleMaskedReg: string;
  scannedAtFormatted: string;
  approximateLocation?: string;
}

export interface SecurityChangedPayload {
  changeType: string;
  occurredAt: string;
  actionSummary: string;
}

export interface SupportUpdatedPayload {
  ticketId: string;
  ticketSubject: string;
  status: string;
}

export type NotificationPayloadMap = {
  ACCOUNT_WELCOME: AccountWelcomePayload;
  QR_ACTIVATED: QrActivatedPayload;
  PAYMENT_SUCCEEDED: PaymentSucceededPayload;
  SUBSCRIPTION_RENEWED: SubscriptionRenewedPayload;
  SUBSCRIPTION_RENEWAL_FAILED: SubscriptionRenewalFailedPayload;
  SHIPMENT_UPDATED: ShipmentUpdatedPayload;
  REPLACEMENT_APPROVED: ReplacementApprovedPayload;
  EMERGENCY_SCAN_ALERT: EmergencyScanAlertPayload;
  SECURITY_CHANGED: SecurityChangedPayload;
  SUPPORT_UPDATED: SupportUpdatedPayload;
};
