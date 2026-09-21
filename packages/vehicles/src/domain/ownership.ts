/**
 * VaahanSafe Server-Side Vehicle Ownership Policy
 *
 * INVARIANT: Every vehicle mutation and private read MUST verify authoritative ownership.
 * Never trust vehicleId from the client without verifying vehicle.userId === authenticatedUserId.
 */

import { UnauthorizedVehicleAccessError } from "../errors/vehicle-errors";

export interface OwnedResource {
  id: string;
  userId: string;
}

/**
 * Asserts that the authenticated user is the authoritative owner of the vehicle.
 * Throws UnauthorizedVehicleAccessError if ownership check fails.
 */
export function assertVehicleOwnership(
  resource: OwnedResource,
  authenticatedUserId: string
): void {
  if (!authenticatedUserId || !authenticatedUserId.trim()) {
    throw new UnauthorizedVehicleAccessError(resource.id, "anonymous");
  }

  if (resource.userId !== authenticatedUserId.trim()) {
    throw new UnauthorizedVehicleAccessError(resource.id, authenticatedUserId);
  }
}

/**
 * Pure predicate verifying ownership without throwing.
 */
export function isVehicleOwner(
  resource: OwnedResource,
  authenticatedUserId: string
): boolean {
  if (!authenticatedUserId || !resource.userId) {
    return false;
  }
  return resource.userId === authenticatedUserId.trim();
}
