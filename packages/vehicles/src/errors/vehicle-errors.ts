/**
 * VaahanSafe Vehicle & Emergency Domain Errors
 */

export class VehicleDomainError extends Error {
  constructor(message: string, public readonly code: string = "VEHICLE_DOMAIN_ERROR") {
    super(message);
    this.name = "VehicleDomainError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedVehicleAccessError extends VehicleDomainError {
  constructor(vehicleId: string, userId?: string) {
    super(
      `Unauthorized vehicle access: vehicle ${vehicleId} does not belong to user ${userId ?? "caller"}`,
      "UNAUTHORIZED_VEHICLE_ACCESS"
    );
    this.name = "UnauthorizedVehicleAccessError";
  }
}

export class VehicleNotFoundError extends VehicleDomainError {
  constructor(vehicleId: string) {
    super(`Vehicle not found: ${vehicleId}`, "VEHICLE_NOT_FOUND");
    this.name = "VehicleNotFoundError";
  }
}

export class InvalidRegistrationError extends VehicleDomainError {
  constructor(rawRegistration: string, reason: string = "Invalid registration number format") {
    super(`Invalid vehicle registration "${rawRegistration}": ${reason}`, "INVALID_REGISTRATION");
    this.name = "InvalidRegistrationError";
  }
}

export class EmergencyProfileNotReadyError extends VehicleDomainError {
  constructor(vehicleId: string, public readonly reasons: string[]) {
    super(
      `Emergency profile for vehicle ${vehicleId} is not ready: ${reasons.join(", ")}`,
      "EMERGENCY_PROFILE_NOT_READY"
    );
    this.name = "EmergencyProfileNotReadyError";
  }
}

export class ForbiddenFieldLeakageError extends VehicleDomainError {
  constructor(fieldName: string) {
    super(
      `Security Invariant Violation: Forbidden field "${fieldName}" was detected in public emergency projection.`,
      "FORBIDDEN_FIELD_LEAKAGE"
    );
    this.name = "ForbiddenFieldLeakageError";
  }
}

export class VehicleArchivedWithActiveQrError extends VehicleDomainError {
  constructor(vehicleId: string, qrId: string) {
    super(
      `Cannot archive vehicle ${vehicleId} with active QR assignment ${qrId}. Unlink or replace QR first.`,
      "VEHICLE_ARCHIVED_WITH_ACTIVE_QR"
    );
    this.name = "VehicleArchivedWithActiveQrError";
  }
}
