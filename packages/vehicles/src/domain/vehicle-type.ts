/**
 * VaahanSafe Canonical Vehicle Type Domain Model
 */

export const VEHICLE_TYPES = [
  "CAR",
  "MOTORCYCLE",
  "SCOOTER",
  "AUTO",
  "COMMERCIAL",
  "OTHER",
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  CAR: "Car / SUV",
  MOTORCYCLE: "Motorcycle",
  SCOOTER: "Scooter",
  AUTO: "Auto Rickshaw",
  COMMERCIAL: "Commercial Vehicle",
  OTHER: "Other Vehicle",
};

/**
 * Checks if a value is a valid canonical VehicleType.
 */
export function isVehicleType(val: unknown): val is VehicleType {
  return typeof val === "string" && (VEHICLE_TYPES as readonly string[]).includes(val);
}

/**
 * Normalizes input string to canonical VehicleType.
 * Handles synonyms like AUTO_RICKSHAW, TRUCK, BUS.
 */
export function normalizeVehicleType(raw: string): VehicleType {
  const upper = raw.trim().toUpperCase();
  if (upper === "AUTO_RICKSHAW" || upper === "RICKSHAW") {
    return "AUTO";
  }
  if (upper === "TRUCK" || upper === "BUS" || upper === "VAN") {
    return "COMMERCIAL";
  }
  if (isVehicleType(upper)) {
    return upper;
  }
  return "OTHER";
}

/**
 * Returns a human-friendly display label for a VehicleType.
 */
export function getVehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_LABELS[type] ?? "Vehicle";
}
