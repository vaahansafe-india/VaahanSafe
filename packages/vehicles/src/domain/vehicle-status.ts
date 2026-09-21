/**
 * VaahanSafe Canonical Vehicle Status Lifecycle Model
 */

export const VEHICLE_STATUSES = [
  "ACTIVE",
  "ARCHIVED",
  "TRANSFER_PENDING",
  "INACTIVE",
  "TRANSFERRED",
  "DELETED",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

/**
 * Valid state transition graph for vehicles.
 */
const VALID_TRANSITIONS: Record<VehicleStatus, readonly VehicleStatus[]> = {
  ACTIVE: ["ARCHIVED", "TRANSFER_PENDING", "INACTIVE"],
  TRANSFER_PENDING: ["ACTIVE", "TRANSFERRED", "INACTIVE"],
  INACTIVE: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: ["ACTIVE"], // Can restore from archive under verified owner action
  TRANSFERRED: [],      // Terminal for current owner
  DELETED: [],          // Terminal soft-delete
};

/**
 * Validates whether a vehicle status transition is allowed by domain rules.
 */
export function canTransitionVehicleStatus(from: VehicleStatus, to: VehicleStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Checks if a vehicle status is active for public emergency resolution.
 */
export function isVehicleActive(status: VehicleStatus): boolean {
  return status === "ACTIVE";
}

/**
 * Maps domain VehicleStatus to D1 database status if legacy schema mapping is required.
 */
export function toDbVehicleStatus(status: VehicleStatus): "ACTIVE" | "INACTIVE" | "TRANSFERRED" | "DELETED" {
  switch (status) {
    case "ACTIVE":
      return "ACTIVE";
    case "TRANSFERRED":
      return "TRANSFERRED";
    case "DELETED":
      return "DELETED";
    case "ARCHIVED":
    case "TRANSFER_PENDING":
    case "INACTIVE":
    default:
      return "INACTIVE";
  }
}
