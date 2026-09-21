/**
 * VaahanSafe Central Domain Types
 */

export * from "./identifiers";
export * from "./errors";
export * from "./ports";


// ==========================================
// USER & IDENTITY DOMAIN
// ==========================================
export type UserRole = "CUSTOMER" | "ADMIN" | "OPERATOR" | "DISTRIBUTOR" | "RETAILER" | "SUPPORT";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETION_PENDING" | "ANONYMIZED";

export type OnboardingState =
  | "AUTHENTICATED"
  | "PHONE_REQUIRED"
  | "PROFILE_REQUIRED"
  | "COMPLETED";

export interface User {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  role: UserRole;
  onboardingState: OnboardingState;
  status?: UserStatus;
  termsAcceptedAt?: string;
  privacyAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthProvider = "PHONE" | "GOOGLE" | "EMAIL_OTP";

export interface AuthIdentity {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
  normalizedIdentifier?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  token?: string; // Ephemeral plaintext token only present at creation/rotation time
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

export type RouteClass =
  | "PUBLIC"
  | "QR_EMERGENCY_PROFILE"
  | "ACTIVATION_SCRATCH_ENTRY"
  | "CUSTOMER_DASHBOARD"
  | "CHECKOUT"
  | "ADMIN";

export type StepUpPurpose =
  | "PHONE_CHANGE"
  | "QR_OWNERSHIP_TRANSFER"
  | "ACCOUNT_DELETION"
  | "ADMIN_HIGH_RISK"
  | "DUPLICATE_ACCOUNT_RESOLUTION";

export interface StepUpChallenge {
  id: string;
  userId: string;
  purpose: StepUpPurpose;
  targetResource?: string;
  channel: "PHONE" | "EMAIL";
  recipient: string;
  codeHash: string;
  expiresAt: string;
  verifiedAt?: string;
  attempts: number;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  displayName: string;
  alternatePhone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// VEHICLE & EMERGENCY DOMAIN
// ==========================================
export type VehicleType = "CAR" | "MOTORCYCLE" | "SCOOTER" | "TRUCK" | "BUS" | "COMMERCIAL" | "OTHER";

export interface Vehicle {
  id: string;
  customerId: string;
  registrationNumber: string; // e.g. MH12AB1234
  make: string;
  model: string;
  year?: number;
  type: VehicleType;
  primaryColor?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  emergencyMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  vehicleId?: string;
  customerId: string;
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  isPriority: boolean;
  notifyOnScan: boolean;
  createdAt: string;
}

export interface MedicalProfile {
  id: string;
  vehicleId: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies?: string[];
  medicalConditions?: string[];
  organDonor?: boolean;
  additionalNotes?: string;
  updatedAt: string;
}

// ==========================================
// QR & STICKER LIFECYCLE DOMAIN
// ==========================================
export type QrLifecycleState =
  | "PRINTED"
  | "IN_TRANSIT_DISTRIBUTOR"
  | "WITH_DISTRIBUTOR"
  | "WITH_RETAILER"
  | "SOLD"
  | "ACTIVATED"
  | "EXPIRED_UNSOLD"
  | "LOST_DAMAGED"
  | "REPLACED"
  | "BLOCKED";

export interface QrBatch {
  id: string;
  batchCode: string;
  quantity: number;
  printedAt: string;
  printerPartner?: string;
  notes?: string;
  status: "CREATED" | "PRINTED" | "DISPATCHED" | "COMPLETED";
}

export interface QrSticker {
  id: string;
  batchId: string;
  publicId: string; // Resolves at qr.vaahansafe.com/[publicId]
  status: QrLifecycleState;
  vehicleId?: string;
  activatedAt?: string;
  activatedByUserId?: string;
  replacementForStickerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QrActivationSecretRecord {
  id: string;
  qrId: string;
  secretHash: string;
  hashVersion: string;
  failedAttempts: number;
  lockedUntil?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QrAttemptOutcome =
  | "SUCCESS"
  | "INVALID_SECRET"
  | "QR_LOCKED"
  | "ALREADY_ACTIVATED"
  | "RATE_LIMITED"
  | "VEHICLE_MISMATCH";

export interface QrActivationAttemptRecord {
  id: string;
  qrId: string;
  userId?: string;
  outcome: QrAttemptOutcome;
  failureReasonCode?: string;
  requestFingerprintHash?: string;
  ipHash?: string;
  createdAt: string;
}

export interface QrScanEvent {
  id: string;
  stickerId: string;
  publicId: string;
  scannedAt: string;
  ipHash?: string;
  city?: string;
  state?: string;
  userAgent?: string;
  isEmergencyAlertTriggered: boolean;
}

export type QrPublicResolverState =
  | "ACTIVE"
  | "ACTIVATION_AVAILABLE"
  | "REPLACED"
  | "LOST_DAMAGED"
  | "BLOCKED"
  | "UNKNOWN";

export interface PublicEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPriority: boolean;
}

export interface PublicEmergencyProfile {
  qrPublicId: string;
  status: "ACTIVE";
  vehicleDisplay: string;
  vehicleType: VehicleType;
  approvedOwnerDisplayName?: string;
  bloodGroup?: string;
  approvedSafetyNotes?: string;
  approvedEmergencyContacts: PublicEmergencyContact[];
  profileUpdatedAt: string;
}


// ==========================================
// COMMERCE, PAYMENTS & SUBSCRIPTIONS
// ==========================================
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "FULFILLED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPricePaise: number;
  totalPricePaise: number;
}

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  amount: number; // In paise (INR)
  currency: string;
  status: OrderStatus;
  shippingAddressId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "USER_DROPPED" | "REFUNDED";

export interface Payment {
  id: string;
  orderId: string;
  gatewayOrderId: string; // Cashfree order ID
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  cfPaymentTime?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";

export interface Subscription {
  id: string;
  customerId: string;
  vehicleId?: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// SERVICE ENTITLEMENTS (HARD GATE PERMISSIONS)
// ==========================================
export type EntitlementCapability =
  | "DIGITAL_QR_ACCESS"
  | "SAFETY_VIEW_ACTIVE"
  | "EMERGENCY_ROUTING"
  | "SCAN_HISTORY_LOGGING"
  | "REPLACEMENT_ELIGIBLE";

export type EntitlementStatus = "ENABLED" | "SUSPENDED" | "REVOKED" | "EXPIRED";

export type EntitlementAcquisitionSource = "ONLINE_PURCHASE" | "RETAIL_ACTIVATION";

export interface ServiceEntitlement {
  id: string;
  userId: string;
  vehicleId: string;
  qrStickerId: string;
  capability: EntitlementCapability;
  status: EntitlementStatus;
  acquisitionSource: EntitlementAcquisitionSource;
  orderId?: string;
  verifiedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// OBSERVABILITY & SYSTEM DOMAIN
// ==========================================
export interface ServiceHealth {
  service: string;
  status: "ok" | "degraded" | "down";
  version?: string;
  timestamp: string;
  environment?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
