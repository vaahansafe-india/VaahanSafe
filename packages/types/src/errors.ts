/**
 * VaahanSafe Typed Domain Errors
 *
 * Provides a structured, strongly-typed error hierarchy for business logic failures.
 * Never throw raw string errors or generic Error instances for domain conditions.
 */

export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public abstract readonly statusCode: number;
  public readonly isOperational: boolean = true;
  public readonly userMessage: string;

  constructor(message: string, userMessage?: string) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = userMessage || message;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
    };
  }
}

// ==========================================
// QR & ACTIVATION DOMAIN ERRORS
// ==========================================

export class QrNotFoundError extends DomainError {
  public readonly code = "QR_NOT_FOUND";
  public readonly statusCode = 404;
  constructor(publicId: string) {
    super(
      `QR code "${publicId}" was not found in registry.`,
      "The scanned QR code was not recognized."
    );
  }
}

export class QrAlreadyActivatedError extends DomainError {
  public readonly code = "QR_ALREADY_ACTIVATED";
  public readonly statusCode = 409;
  constructor(publicId: string) {
    super(
      `QR code "${publicId}" is already active and assigned to a vehicle.`,
      "This QR sticker has already been activated."
    );
  }
}

export class QrActivationSecretInvalidError extends DomainError {
  public readonly code = "QR_ACTIVATION_SECRET_INVALID";
  public readonly statusCode = 401;
  constructor() {
    super(
      "The scratch verification code is invalid.",
      "Incorrect scratch code. Please check the physical sticker."
    );
  }
}

export class QrBlockedError extends DomainError {
  public readonly code = "QR_BLOCKED";
  public readonly statusCode = 403;
  constructor(publicId: string) {
    super(
      `QR code "${publicId}" has been blocked by system policy.`,
      "This QR code is currently unavailable."
    );
  }
}

export class QrReplacedError extends DomainError {
  public readonly code = "QR_REPLACED";
  public readonly statusCode = 410;
  constructor(publicId: string) {
    super(
      `QR code "${publicId}" has been decommissioned and replaced.`,
      "This QR sticker has been replaced with a new code."
    );
  }
}

export class InvalidStateTransitionError extends DomainError {
  public readonly code = "INVALID_STATE_TRANSITION";
  public readonly statusCode = 400;
  constructor(entity: string, from: string, to: string) {
    super(
      `Cannot transition ${entity} from state "${from}" to "${to}".`,
      "Requested status change is not permissible."
    );
  }
}

// ==========================================
// VEHICLE & OWNER DOMAIN ERRORS
// ==========================================

export class VehicleNotFoundError extends DomainError {
  public readonly code = "VEHICLE_NOT_FOUND";
  public readonly statusCode = 404;
  constructor(vehicleId: string) {
    super(`Vehicle "${vehicleId}" not found.`, "Vehicle not found.");
  }
}

export class VehicleNotOwnedError extends DomainError {
  public readonly code = "VEHICLE_NOT_OWNED";
  public readonly statusCode = 403;
  constructor(vehicleId: string, userId: string) {
    super(
      `User "${userId}" is not authorized to manage vehicle "${vehicleId}".`,
      "You do not have permission to manage this vehicle."
    );
  }
}

export class DuplicateRegistrationError extends DomainError {
  public readonly code = "DUPLICATE_REGISTRATION";
  public readonly statusCode = 409;
  constructor(registrationNumber: string) {
    super(
      `Vehicle with registration number "${registrationNumber}" already exists.`,
      "A vehicle with this registration number is already registered."
    );
  }
}

// ==========================================
// COMMERCE & PAYMENT DOMAIN ERRORS
// ==========================================

export class OrderNotFoundError extends DomainError {
  public readonly code = "ORDER_NOT_FOUND";
  public readonly statusCode = 404;
  constructor(orderId: string) {
    super(`Order "${orderId}" not found.`, "Order not found.");
  }
}

export class PaymentNotConfirmedError extends DomainError {
  public readonly code = "PAYMENT_NOT_CONFIRMED";
  public readonly statusCode = 402;
  constructor(orderId: string) {
    super(
      `Payment for order "${orderId}" could not be confirmed authoritatively.`,
      "We could not confirm your payment. Please do not re-pay until verified."
    );
  }
}

export class PaymentSignatureInvalidError extends DomainError {
  public readonly code = "PAYMENT_SIGNATURE_INVALID";
  public readonly statusCode = 400;
  constructor() {
    super(
      "Payment gateway webhook signature validation failed.",
      "Security signature verification failed."
    );
  }
}

export class RefundFailedError extends DomainError {
  public readonly code = "REFUND_FAILED";
  public readonly statusCode = 502;
  constructor(reason: string) {
    super(`Refund operation failed: ${reason}`, "Could not process refund at this time.");
  }
}

// ==========================================
// SUBSCRIPTION DOMAIN ERRORS
// ==========================================

export class SubscriptionNotFoundError extends DomainError {
  public readonly code = "SUBSCRIPTION_NOT_FOUND";
  public readonly statusCode = 404;
  constructor(subscriptionId: string) {
    super(`Subscription "${subscriptionId}" not found.`, "Subscription not found.");
  }
}

export class SubscriptionInactiveError extends DomainError {
  public readonly code = "SUBSCRIPTION_INACTIVE";
  public readonly statusCode = 402;
  constructor(vehicleId: string) {
    super(
      `Active subscription required for vehicle "${vehicleId}".`,
      "A subscription is required to access premium safety features."
    );
  }
}

// ==========================================
// AUTHENTICATION & ACCESS DOMAIN ERRORS
// ==========================================

export class UnauthorizedOperationError extends DomainError {
  public readonly code = "UNAUTHORIZED";
  public readonly statusCode = 401;
  constructor(message = "Authentication is required to perform this action.") {
    super(message, "Please log in to continue.");
  }
}

export class ForbiddenOperationError extends DomainError {
  public readonly code = "FORBIDDEN";
  public readonly statusCode = 403;
  constructor(message = "You do not have permission to perform this action.") {
    super(message, "Access denied.");
  }
}

export class TurnstileVerificationFailedError extends DomainError {
  public readonly code = "TURNSTILE_VERIFICATION_FAILED";
  public readonly statusCode = 400;
  constructor() {
    super(
      "Security challenge (Turnstile) verification failed.",
      "Security verification failed. Please try again."
    );
  }
}

// ==========================================
// STORAGE DOMAIN ERRORS
// ==========================================

export class StorageObjectNotFoundError extends DomainError {
  public readonly code = "STORAGE_OBJECT_NOT_FOUND";
  public readonly statusCode = 404;
  constructor(key: string) {
    super(`Storage object "${key}" not found.`, "File not found.");
  }
}

export class StoragePermissionDeniedError extends DomainError {
  public readonly code = "STORAGE_PERMISSION_DENIED";
  public readonly statusCode = 403;
  constructor(key: string) {
    super(
      `Access denied to private storage object "${key}".`,
      "You do not have permission to access this file."
    );
  }
}
