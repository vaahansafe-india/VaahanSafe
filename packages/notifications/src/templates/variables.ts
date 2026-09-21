/**
 * Strict Zod Schemas for Template Variables
 *
 * INVARIANT: Arbitrary dictionaries are forbidden. Every template variable must
 * strictly conform to these validation rules before rendering occurs.
 */

import { z } from "zod";

export const AccountWelcomeVariablesSchema = z.object({
  displayName: z.string().min(1).max(100),
  accountCreatedDate: z.string().min(1),
});
export type AccountWelcomeVariables = z.infer<typeof AccountWelcomeVariablesSchema>;

export const QrActivatedVariablesSchema = z.object({
  publicId: z.string().min(4).max(16),
  vehicleRegMasked: z.string().min(1).max(20),
  vehicleNickname: z.string().max(50).optional(),
});
export type QrActivatedVariables = z.infer<typeof QrActivatedVariablesSchema>;

export const PaymentSuccessVariablesSchema = z.object({
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  amountDisplay: z.string().min(1),
  paymentId: z.string().min(1),
});
export type PaymentSuccessVariables = z.infer<typeof PaymentSuccessVariablesSchema>;

export const SubscriptionRenewedVariablesSchema = z.object({
  subscriptionId: z.string().min(1),
  planName: z.string().min(1),
  nextBillingDate: z.string().min(1),
});
export type SubscriptionRenewedVariables = z.infer<typeof SubscriptionRenewedVariablesSchema>;

export const SubscriptionRenewalFailedVariablesSchema = z.object({
  subscriptionId: z.string().min(1),
  planName: z.string().min(1),
  failureReason: z.string().max(200).optional(),
});
export type SubscriptionRenewalFailedVariables = z.infer<typeof SubscriptionRenewalFailedVariablesSchema>;

export const ShipmentUpdateVariablesSchema = z.object({
  shipmentId: z.string().min(1),
  status: z.string().min(1),
  trackingNumber: z.string().max(100).optional(),
  carrierName: z.string().max(100).optional(),
});
export type ShipmentUpdateVariables = z.infer<typeof ShipmentUpdateVariablesSchema>;

export const ReplacementApprovedVariablesSchema = z.object({
  replacementRequestId: z.string().min(1),
  originalPublicId: z.string().min(1),
  newPublicId: z.string().optional(),
});
export type ReplacementApprovedVariables = z.infer<typeof ReplacementApprovedVariablesSchema>;

export const EmergencyScanAlertVariablesSchema = z.object({
  vehicleMaskedReg: z.string().min(1),
  scannedAtFormatted: z.string().min(1),
  approximateLocation: z.string().max(200).optional(),
});
export type EmergencyScanAlertVariables = z.infer<typeof EmergencyScanAlertVariablesSchema>;

export const SecurityChangedVariablesSchema = z.object({
  changeType: z.string().min(1),
  occurredAt: z.string().min(1),
  actionSummary: z.string().min(1),
});
export type SecurityChangedVariables = z.infer<typeof SecurityChangedVariablesSchema>;

export const SupportUpdateVariablesSchema = z.object({
  ticketId: z.string().min(1),
  ticketSubject: z.string().min(1),
  status: z.string().min(1),
});
export type SupportUpdateVariables = z.infer<typeof SupportUpdateVariablesSchema>;
