/**
 * VaahanSafe Branded Domain Identifiers (Value Objects)
 *
 * Prevents accidental cross-assignment of raw strings (e.g. passing a VehicleId to a UserId param).
 */

declare const Brand: unique symbol;
export type Branded<T, B> = T & { readonly [Brand]: B };

export type UserId = Branded<string, "UserId">;
export type VehicleId = Branded<string, "VehicleId">;
export type QrId = Branded<string, "QrId">;
export type QrPublicId = Branded<string, "QrPublicId">;
export type QrBatchId = Branded<string, "QrBatchId">;
export type OrderId = Branded<string, "OrderId">;
export type PaymentId = Branded<string, "PaymentId">;
export type SubscriptionId = Branded<string, "SubscriptionId">;
export type RetailerId = Branded<string, "RetailerId">;
export type DistributorId = Branded<string, "DistributorId">;
export type SupportTicketId = Branded<string, "SupportTicketId">;
export type AuditLogId = Branded<string, "AuditLogId">;

/**
 * Helper to safely construct branded IDs with validation
 */
function createIdBuilder<T extends string>(typeName: string) {
  return (value: string): T => {
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new Error(`[VaahanSafe Domain] Invalid ${typeName}: ID cannot be empty.`);
    }
    return value.trim() as T;
  };
}

export const toUserId = createIdBuilder<UserId>("UserId");
export const toVehicleId = createIdBuilder<VehicleId>("VehicleId");
export const toQrId = createIdBuilder<QrId>("QrId");
export const toQrPublicId = createIdBuilder<QrPublicId>("QrPublicId");
export const toQrBatchId = createIdBuilder<QrBatchId>("QrBatchId");
export const toOrderId = createIdBuilder<OrderId>("OrderId");
export const toPaymentId = createIdBuilder<PaymentId>("PaymentId");
export const toSubscriptionId = createIdBuilder<SubscriptionId>("SubscriptionId");
export const toRetailerId = createIdBuilder<RetailerId>("RetailerId");
export const toDistributorId = createIdBuilder<DistributorId>("DistributorId");
export const toSupportTicketId = createIdBuilder<SupportTicketId>("SupportTicketId");
export const toAuditLogId = createIdBuilder<AuditLogId>("AuditLogId");
