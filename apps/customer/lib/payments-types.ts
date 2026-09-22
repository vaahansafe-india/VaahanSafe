/**
 * VaahanSafe Payment & Billing Center Domain Contracts & Read Models
 *
 * Invariants:
 * - PAYMENT != ORDER != QR != SUBSCRIPTION != ENTITLEMENT
 * - Payment redirect return_url != Payment proof
 * - Only server-authoritative records from Cloudflare D1 & signed webhooks are rendered.
 * - All amounts are strictly integer minor units (paise) converted safely for display.
 */

export type AuthoritativePaymentStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "REFUND_PENDING";

export type PaymentPurposeCategory =
  | "QR_PURCHASE"
  | "SUBSCRIPTION"
  | "REPLACEMENT"
  | "OTHER";

export interface PaymentVehicleSummary {
  id: string;
  plateNumber: string;
  makeModel: string;
  vehicleType: string;
}

export interface PaymentQrSummary {
  id: string;
  publicId: string;
  visibleCode: string;
  status: string;
}

export interface PaymentBillingAddress {
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}

export interface PaymentLineItem {
  id: string;
  name: string;
  itemType: "PRODUCT" | "PLAN" | "REPLACEMENT_FEE" | "SHIPPING_FEE";
  quantity: number;
  unitPriceMinor: number;
  totalPriceMinor: number;
}

export interface VerificationMilestone {
  stage:
    | "ORDER_CREATED"
    | "PAYMENT_INITIATED"
    | "PROVIDER_PROCESSING"
    | "SERVER_VERIFIED"
    | "ORDER_UPDATED";
  label: string;
  description: string;
  timestamp: string | null;
  status: "COMPLETED" | "CURRENT" | "PENDING" | "FAILED";
}

export interface PaymentRecordItem {
  id: string;
  paymentReference: string; // Truncated/customer-safe reference
  provider?: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  orderId: string;
  orderNumber: string;
  status: AuthoritativePaymentStatus;
  statusLabel: string;
  amountMinor: number;
  currency: string;
  paymentMethod: string | null;
  purpose: PaymentPurposeCategory;
  purposeLabel: string;
  productDescription: string;
  createdAt: string;
  confirmedAt: string | null;
  attemptNumber: number;
  vehicle: PaymentVehicleSummary | null;
  qrSticker: PaymentQrSummary | null;
  billingAddress: PaymentBillingAddress | null;
  lineItems: PaymentLineItem[];
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  timeline: VerificationMilestone[];
  isInvoiceAvailable: boolean;
}

export interface PaymentSignalMetrics {
  totalConfirmedMinor: number;
  totalConfirmedCount: number;
  pendingCount: number;
  failedCount: number;
  lastVerifiedAt: string | null;
}

export interface PaymentPulseEvent {
  id: string;
  date: string;
  amountMinor: number;
  orderNumber: string;
  purposeLabel: string;
  status: AuthoritativePaymentStatus;
}

export interface PaymentStateComposition {
  confirmedCount: number;
  pendingCount: number;
  failedCount: number;
  totalCount: number;
  allConfirmed: boolean;
}

export interface PaymentPurposeItem {
  category: PaymentPurposeCategory;
  label: string;
  count: number;
  amountMinor: number;
  percentage: number;
}

export interface PaymentAttentionItem {
  id: string;
  paymentId: string;
  orderNumber: string;
  type: "PENDING_VERIFICATION" | "PAYMENT_FAILED" | "REQUIRES_ACTION";
  title: string;
  description: string;
  actionLabel: string;
  actionType: "REFRESH" | "RETRY" | "HELP";
}

export interface PaymentsPageData {
  payments: PaymentRecordItem[];
  signals: PaymentSignalMetrics;
  pulseEvents: PaymentPulseEvent[];
  stateComposition: PaymentStateComposition;
  purposeComposition: PaymentPurposeItem[];
  attentionItems: PaymentAttentionItem[];
  vehicles: Array<{ id: string; plateNumber: string; label: string }>;
}

export interface PaymentFilterState {
  status: string; // 'all' | 'confirmed' | 'pending' | 'failed'
  search: string;
  vehicleId: string; // 'all' | vehicle_id
  purpose: string; // 'all' | 'QR_PURCHASE' | 'SUBSCRIPTION' | 'REPLACEMENT'
  period: "30D" | "90D" | "6M" | "1Y" | "ALL";
}

export interface FinancialDocumentData {
  documentType: "INVOICE" | "RECEIPT";
  documentNumber: string;
  issuedAt: string;
  paidAt: string | null;
  orderNumber: string;
  status: "PAID" | "PENDING" | "FAILED";
  billingAddress: PaymentBillingAddress | null;
  items: PaymentLineItem[];
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalMinor: number;
  currency: string;
  paymentMethod: string | null;
  gatewayReference: string | null;
  vehicle: PaymentVehicleSummary | null;
  qrSticker: PaymentQrSummary | null;
}
