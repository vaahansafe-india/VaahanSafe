/**
 * VaahanSafe Canonical Vehicle Domain Entity
 *
 * INVARIANT:
 * - Opaque internal ID (veh_xxx).
 * - Registration number is business data, NEVER technical/authorization identity.
 * - Normalized and display representations are preserved.
 */

import { normalizeRegistrationNumber, formatRegistrationDisplay, isValidRegistrationFormat } from "./registration";
import { VehicleStatus } from "./vehicle-status";
import { VehicleType, normalizeVehicleType } from "./vehicle-type";
import { InvalidRegistrationError } from "../errors/vehicle-errors";

export type VehicleId = string & { readonly __brand: unique symbol };

/**
 * Validates whether a string is a valid opaque VehicleId.
 */
export function isValidVehicleId(id: string): id is VehicleId {
  return typeof id === "string" && /^veh_[a-zA-Z0-9_-]{8,32}$/.test(id);
}

/**
 * Generates an opaque, cryptographically secure VehicleId.
 */
export function generateVehicleId(): VehicleId {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let id = "veh_";
  for (let i = 0; i < 16; i++) {
    const byte = bytes[i] ?? 0;
    id += chars.charAt(byte % chars.length);
  }
  return id as VehicleId;
}

export interface Vehicle {
  id: VehicleId;
  userId: string;
  registrationNumberNormalized: string;
  registrationNumberDisplay: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  variant?: string;
  year?: number;
  color?: string;
  photoAssetId?: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleParams {
  id?: string;
  userId: string;
  registrationNumber: string;
  vehicleType?: string | VehicleType;
  make: string;
  model: string;
  variant?: string;
  year?: number;
  color?: string;
  photoAssetId?: string;
  status?: VehicleStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Pure domain factory creating a validated Vehicle entity.
 */
export function createVehicle(params: CreateVehicleParams): Vehicle {
  if (!params.userId || !params.userId.trim()) {
    throw new Error("Vehicle must have an authoritative owner userId");
  }

  const normalizedReg = normalizeRegistrationNumber(params.registrationNumber);
  if (!normalizedReg || !isValidRegistrationFormat(normalizedReg)) {
    throw new InvalidRegistrationError(
      params.registrationNumber,
      "Must conform to standard Indian vehicle registration (e.g. AP39AB1234 or 22BH1234AA)"
    );
  }

  if (!params.make || !params.make.trim()) {
    throw new Error("Vehicle make is required");
  }
  if (!params.model || !params.model.trim()) {
    throw new Error("Vehicle model is required");
  }

  const currentYear = new Date().getFullYear();
  if (params.year !== undefined && (params.year < 1900 || params.year > currentYear + 1)) {
    throw new Error(`Vehicle year must be between 1900 and ${currentYear + 1}`);
  }

  const id = params.id
    ? (params.id as VehicleId)
    : generateVehicleId();

  const now = new Date().toISOString();

  return {
    id,
    userId: params.userId.trim(),
    registrationNumberNormalized: normalizedReg,
    registrationNumberDisplay: formatRegistrationDisplay(normalizedReg),
    vehicleType: params.vehicleType ? normalizeVehicleType(params.vehicleType) : "CAR",
    make: params.make.trim(),
    model: params.model.trim(),
    variant: params.variant?.trim() || undefined,
    year: params.year,
    color: params.color?.trim() || undefined,
    photoAssetId: params.photoAssetId?.trim() || undefined,
    status: params.status || "ACTIVE",
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
  };
}
