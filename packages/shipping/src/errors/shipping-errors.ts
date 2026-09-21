/**
 * Normalized Shipping, Fulfilment & Replacement Domain Errors
 */

export class ShippingDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(`[${code}] ${message}`);
    this.name = "ShippingDomainError";
  }
}

export class FulfilmentNotFoundError extends ShippingDomainError {
  constructor(fulfilmentId: string) {
    super("FULFILMENT_NOT_FOUND", `Fulfilment "${fulfilmentId}" was not found`);
  }
}

export class InvalidFulfilmentTransitionError extends ShippingDomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      "FULFILMENT_INVALID_TRANSITION",
      `Illegal fulfilment transition from "${fromStatus}" to "${toStatus}"`
    );
  }
}

export class FulfilmentInvalidStateError extends ShippingDomainError {
  constructor(reason: string) {
    super("FULFILMENT_INVALID_STATE", reason);
  }
}

export class NoEligibleInventoryError extends ShippingDomainError {
  constructor(reason = "No eligible printed physical QR stickers available in warehouse stock") {
    super("NO_ELIGIBLE_INVENTORY", reason);
  }
}

export class QrReservationConflictError extends ShippingDomainError {
  constructor(qrId: string, reason = "Sticker is already reserved or allocated to another active fulfilment") {
    super("QR_RESERVATION_CONFLICT", `Conflict reserving QR sticker "${qrId}": ${reason}`);
  }
}

export class ReservationNotFoundError extends ShippingDomainError {
  constructor(reservationId: string) {
    super("RESERVATION_NOT_FOUND", `Reservation "${reservationId}" was not found`);
  }
}

export class ShipmentNotFoundError extends ShippingDomainError {
  constructor(shipmentId: string) {
    super("SHIPMENT_NOT_FOUND", `Shipment "${shipmentId}" was not found`);
  }
}

export class InvalidShipmentTransitionError extends ShippingDomainError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      "SHIPMENT_INVALID_TRANSITION",
      `Illegal shipment status transition from "${fromStatus}" to "${toStatus}"`
    );
  }
}

export class ReplacementNotAllowedError extends ShippingDomainError {
  constructor(reason: string) {
    super("REPLACEMENT_NOT_ALLOWED", reason);
  }
}

export class ReplacementNotFoundError extends ShippingDomainError {
  constructor(requestId: string) {
    super("REPLACEMENT_NOT_FOUND", `Replacement request "${requestId}" was not found`);
  }
}

export class ReplacementAlreadyOpenError extends ShippingDomainError {
  constructor(oldQrId: string) {
    super(
      "REPLACEMENT_ALREADY_OPEN",
      `An active replacement request already exists for sticker "${oldQrId}"`
    );
  }
}

export class ReplacementRequiresStepUpError extends ShippingDomainError {
  constructor(reason = "Security policy requires step-up OTP verification for this replacement") {
    super("REPLACEMENT_REQUIRES_STEP_UP", reason);
  }
}

export class ReplacementOwnershipError extends ShippingDomainError {
  constructor(userId: string, resourceId: string) {
    super(
      "REPLACEMENT_OWNERSHIP_MISMATCH",
      `User "${userId}" is not authorized to request replacement for resource "${resourceId}"`
    );
  }
}
