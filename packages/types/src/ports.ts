/**
 * VaahanSafe Provider-Independent Ports & Contracts
 *
 * Establishes explicit boundaries between Application/Domain logic and
 * Infrastructure Adapters (D1, R2, Queues, Cashfree, MSG91, Email).
 *
 * INVARIANT: Domain and application use cases depend ONLY on these interfaces.
 * Never import provider SDKs directly into business logic.
 */

import type {
  User,
  Session,
  AuthIdentity,
  AuthProvider,
  Vehicle,
  QrSticker,
  QrActivationSecretRecord,
  QrActivationAttemptRecord,
  EmergencyContact,
  Order,
  Payment,
  Subscription,
  PaymentStatus,
  MedicalProfile,
} from "./index";
import type {
  UserId,
  VehicleId,
  QrPublicId,
  OrderId,
  PaymentId,
  SubscriptionId,
} from "./identifiers";

// ==========================================
// 01. REPOSITORY PORTS
// ==========================================

export interface UserRepository {
  findById(id: UserId | string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: Partial<User> & { id: string }): Promise<User>;
}

export interface SessionRepository {
  createSession(session: {
    id?: string;
    userId: string;
    tokenHash: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: string;
    createdAt?: string;
    lastSeenAt?: string;
  }): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findActiveByTokenHash(tokenHash: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  touchSession(tokenHash: string, lastSeenAt?: string): Promise<boolean>;
  revokeSession(tokenHash: string, reason?: string): Promise<boolean>;
  revokeSessionById?(id: string, userId: string, reason?: string): Promise<boolean>;
  revokeAllUserSessions(userId: string, reason?: string, exceptTokenHash?: string): Promise<number>;
  cleanupExpiredSessions(): Promise<number>;
}

export interface AuthIdentityRepository {
  findById(id: string): Promise<AuthIdentity | null>;
  findByIdentity(provider: AuthProvider, providerSubject: string): Promise<AuthIdentity | null>;
  findByUserId(userId: string): Promise<AuthIdentity[]>;
  findByNormalizedIdentifier(provider: AuthProvider, normalizedIdentifier: string): Promise<AuthIdentity[]>;
  linkIdentity(identity: {
    id?: string;
    userId: string;
    provider: AuthProvider;
    providerSubject: string;
    normalizedIdentifier?: string;
    verifiedAt?: string;
  }): Promise<AuthIdentity>;
  unlinkIdentity(userId: string, provider: AuthProvider): Promise<boolean>;
}

export interface VehicleRepository {
  findById(id: VehicleId | string): Promise<Vehicle | null>;
  findByCustomerId(customerId: UserId | string): Promise<Vehicle[]>;
  findByRegistration(reg: string): Promise<Vehicle | null>;
  save(vehicle: Partial<Vehicle>): Promise<Vehicle>;
}

export interface QrRepository {
  findByPublicId(publicId: QrPublicId | string): Promise<QrSticker | null>;
  findById(id: string): Promise<QrSticker | null>;
  save(sticker: Partial<QrSticker>): Promise<QrSticker>;
  transitionStatus(
    stickerId: string,
    nextStatus: string,
    context?: Record<string, unknown>
  ): Promise<QrSticker>;
}

export interface QrActivationSecretRepository {
  findByQrId(qrId: string): Promise<QrActivationSecretRecord | null>;
  saveSecret(record: {
    id?: string;
    qrId: string;
    secretHash: string;
    hashVersion?: string;
    failedAttempts?: number;
    lockedUntil?: string | null;
    consumedAt?: string | null;
  }): Promise<QrActivationSecretRecord>;
  recordFailedAttempt(qrId: string, lockedUntil?: string | null): Promise<QrActivationSecretRecord>;
  resetFailedAttempts(qrId: string): Promise<QrActivationSecretRecord>;
  consumeSecret(qrId: string): Promise<QrActivationSecretRecord>;
}

export interface QrActivationAttemptRepository {
  recordAttempt(attempt: {
    id?: string;
    qrId: string;
    userId?: string;
    outcome: QrActivationAttemptRecord["outcome"];
    failureReasonCode?: string;
    requestFingerprintHash?: string;
    ipHash?: string;
  }): Promise<void>;
  countRecentAttempts(qrId: string, windowSeconds?: number): Promise<number>;
}

export interface EmergencyProfileRepository {
  findByVehicleId(vehicleId: VehicleId | string): Promise<{
    contacts: EmergencyContact[];
    medical?: MedicalProfile | null;
  }>;
  saveContact(contact: Partial<EmergencyContact>): Promise<EmergencyContact>;
  deleteContact(contactId: string): Promise<boolean>;
}

export interface SubscriptionRepository {
  findById(id: SubscriptionId | string): Promise<Subscription | null>;
  findByVehicleId(vehicleId: VehicleId | string): Promise<Subscription | null>;
  findByCustomerId(customerId: UserId | string): Promise<Subscription[]>;
  save(sub: Partial<Subscription>): Promise<Subscription>;
}

export interface OrderRepository {
  findById(id: OrderId | string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  save(order: Partial<Order>): Promise<Order>;
}

export interface PaymentRepository {
  findById(id: PaymentId | string): Promise<Payment | null>;
  findByOrderId(orderId: OrderId | string): Promise<Payment[]>;
  findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null>;
  save(payment: Partial<Payment>): Promise<Payment>;
}

export interface AuditRecord {
  id: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export interface AuditRepository {
  record(audit: AuditRecord): Promise<void>;
}

// ==========================================
// 02. OBJECT STORAGE PORT (R2) & METADATA
// ==========================================

export type StorageVisibility = "PUBLIC" | "PRIVATE" | "INTERNAL" | "CONTROLLED";
export type BucketClass = "PUBLIC" | "PRIVATE" | "EXPORT";
export type AssetStatus = "UPLOADING" | "READY" | "QUARANTINED" | "DELETED";

export type OwnerType =
  | "USER"
  | "VEHICLE"
  | "SUPPORT_TICKET"
  | "BLOG_POST"
  | "GALLERY_ITEM"
  | "DOCUMENT"
  | "ORDER"
  | "QR_BATCH"
  | "REPORT"
  | "SYSTEM";

export type UploadPurpose =
  | "USER_PROFILE_IMAGE"
  | "VEHICLE_IMAGE"
  | "SUPPORT_ATTACHMENT"
  | "BLOG_COVER"
  | "BLOG_INLINE_IMAGE"
  | "GALLERY_IMAGE"
  | "PUBLIC_DOCUMENT"
  | "PRIVATE_DOCUMENT"
  | "INVOICE"
  | "QR_PRINT_EXPORT"
  | "QR_MANIFEST"
  | "ADMIN_REPORT";

export interface MediaAsset {
  id: string;
  bucket: BucketClass;
  objectKey: string;
  ownerType: OwnerType;
  ownerId: string;
  visibility: StorageVisibility;
  mimeType: string;
  sizeBytes: number;
  sha256?: string | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  status: AssetStatus;
  originalFilename?: string | null;
  storageEtag?: string | null;
  variantOfAssetId?: string | null;
  readyAt?: string | null;
  quarantinedAt?: string | null;
  deletedAt?: string | null;
  metadataJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetRepository {
  findById(id: string): Promise<MediaAsset | null>;
  findByObjectKey(objectKey: string): Promise<MediaAsset | null>;
  findByOwner(ownerType: OwnerType, ownerId: string): Promise<MediaAsset[]>;
  save(asset: MediaAsset): Promise<MediaAsset>;
  updateStatus(
    id: string,
    status: AssetStatus,
    updates?: Partial<MediaAsset>
  ): Promise<MediaAsset>;
  delete(id: string): Promise<boolean>;
}

export interface StorageObjectMeta {
  key: string;
  size: number;
  contentType: string;
  visibility: StorageVisibility;
  etag?: string;
  uploadedAt: string;
  customMetadata?: Record<string, string>;
}

export interface PutObjectInput {
  key: string;
  data: ArrayBuffer | Uint8Array | ReadableStream;
  contentType?: string;
  visibility: StorageVisibility;
  customMetadata?: Record<string, string>;
}

export interface ObjectStorage {
  put(input: PutObjectInput): Promise<StorageObjectMeta>;
  get(key: string): Promise<{ data: ReadableStream | ArrayBuffer; meta: StorageObjectMeta } | null>;
  head(key: string): Promise<StorageObjectMeta | null>;
  delete(key: string): Promise<boolean>;
  createSignedReadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  createSignedUploadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(key: string): string;
}

// ==========================================
// 03. ASYNC QUEUE & EVENT PORTS
// ==========================================

export interface QueueMessage<T = unknown> {
  version: 1;
  eventId: string;
  type: string;
  occurredAt: string;
  correlationId?: string;
  payload: T;
}

export interface QueuePublisher<T = unknown> {
  publish(message: QueueMessage<T>): Promise<{ messageId: string }>;
  publishBatch?(messages: QueueMessage<T>[]): Promise<{ publishedCount: number }>;
}

export interface DeadLetterPolicy {
  maxRetries: number;
  backoffSeconds: number;
  deadLetterQueueName: string;
}

// ==========================================
// 04. PAYMENT GATEWAY PORT
// ==========================================

export interface PaymentOrderInput {
  orderId: string;
  amountPaise: number;
  currency?: "INR";
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface PaymentOrderSession {
  gatewayOrderId: string;
  orderId: string;
  paymentSessionId: string;
  gatewayStatus: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventTime?: string;
  eventType?: string;
  rawSafePayload?: Record<string, unknown>;
}

/**
 * Payment Gateway Port.
 * INVARIANT: Browser redirect return_url is a UX signal only.
 * Authoritative payment status updates occur exclusively via verified webhooks.
 */
export interface PaymentGateway {
  createPaymentOrder(input: PaymentOrderInput): Promise<PaymentOrderSession>;
  fetchPaymentStatus(gatewayOrderId: string): Promise<{
    status: PaymentStatus;
    gatewayPaymentId?: string;
    amountPaise: number;
  }>;
  verifyWebhook(
    rawBody: string,
    signature: string,
    timestamp: string
  ): Promise<WebhookVerificationResult>;
}

// ==========================================
// 05. NOTIFICATION PORTS
// ==========================================

export interface OtpProvider {
  sendOtp(phone: string, options?: { templateId?: string }): Promise<{ success: boolean; requestId?: string }>;
  verifyOtp(phone: string, otp: string, requestId?: string): Promise<{ success: boolean }>;
}

export interface MessagingProvider {
  sendWhatsApp(
    recipientPhone: string,
    templateName: string,
    parameters?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string }>;
  sendSms(
    recipientPhone: string,
    message: string,
    templateId?: string
  ): Promise<{ success: boolean; messageId?: string }>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string }>;
}

// ==========================================
// 06. SECURITY & SECRET HASHING PORT
// ==========================================

/**
 * Port for cryptographic hashing of physical QR scratch secrets.
 * INVARIANT: Plaintext scratch secrets must NEVER be stored in the database.
 */
export interface ActivationSecretHasher {
  hashSecret(plaintextSecret: string): Promise<string>;
  verifySecret(plaintextSecret: string, hashedSecret: string): Promise<boolean>;
}
