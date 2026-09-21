/**
 * VaahanSafe QR Domain & Application Errors
 *
 * SECTION 83 — ERROR TYPES:
 * Standardized, privacy-safe error abstractions.
 * Raw SQL, internal hostnames, or schema constraints are NEVER leaked to callers.
 */

export class QrDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class QrNotFoundError extends QrDomainError {
  constructor(publicId: string) {
    super(`QR sticker with identifier '${publicId}' was not found`, "QR_NOT_FOUND", 404);
  }
}

export class QrNotActivatableError extends QrDomainError {
  constructor(reason: string) {
    super(`QR sticker is not eligible for activation: ${reason}`, "QR_NOT_ACTIVATABLE", 400);
  }
}

export class QrAlreadyActivatedError extends QrDomainError {
  constructor() {
    super("This VaahanSafe QR sticker has already been activated", "QR_ALREADY_ACTIVATED", 409);
  }
}

export class QrReplacedError extends QrDomainError {
  constructor() {
    super("This VaahanSafe QR sticker has been replaced and retired", "QR_REPLACED", 410);
  }
}

export class QrUnavailableError extends QrDomainError {
  constructor(reason = "This QR code is currently unavailable") {
    super(reason, "QR_UNAVAILABLE", 403);
  }
}

export class InvalidActivationSecretError extends QrDomainError {
  constructor(message = "Activation code could not be verified. Please check the scratched code and try again.") {
    super(message, "INVALID_ACTIVATION_SECRET", 401);
  }
}

export class ActivationTemporarilyLockedError extends QrDomainError {
  constructor(lockedUntil?: string) {
    super(
      "Too many failed verification attempts. Activation has been temporarily locked for security. Please try again later.",
      "ACTIVATION_TEMPORARILY_LOCKED",
      429
    );
  }
}

export class ActivationSecretConsumedError extends QrDomainError {
  constructor() {
    super("Activation secret has already been consumed.", "ACTIVATION_SECRET_CONSUMED", 409);
  }
}

export class InvalidQrTransitionError extends QrDomainError {
  constructor(from: string, to: string, reason?: string) {
    super(
      reason || `Cannot transition QR lifecycle state from '${from}' to '${to}'`,
      "INVALID_QR_TRANSITION",
      422
    );
  }
}

export class AssignmentConflictError extends QrDomainError {
  constructor(message = "Conflict: Active assignment already exists for this QR sticker or vehicle.") {
    super(message, "ASSIGNMENT_CONFLICT", 409);
  }
}
