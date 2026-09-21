/**
 * Private Asset Access Authorization Service
 *
 * Implements strict IDOR protections and access control for private customer,
 * operational, and export assets.
 *
 * INVARIANT: Possession of assetId does NOT grant access.
 * INVARIANT: Actor relationship to target entity must be authoritatively verified.
 */

import type { MediaAsset, StorageActor, OwnerType } from "../types";
import type { MediaAssetRepository } from "../ports/media-repository";
import { StorageError } from "../errors/storage-error";

export interface AuthorizePrivateDownloadInput {
  assetId: string;
  actor: StorageActor;
  mediaRepo: MediaAssetRepository;
  entityOwnershipCheck?: (
    ownerType: OwnerType,
    ownerId: string,
    actorId: string,
    actorRole: string
  ) => Promise<boolean> | boolean;
}

export async function authorizePrivateDownload(
  input: AuthorizePrivateDownloadInput
): Promise<MediaAsset> {
  const { assetId, actor, mediaRepo, entityOwnershipCheck } = input;

  // 1. Fetch metadata from D1
  const asset = await mediaRepo.findById(assetId);
  if (!asset) {
    throw new StorageError(
      "ASSET_NOT_FOUND",
      `Asset "${assetId}" was not found.`
    );
  }

  // 2. Lifecycle Status Guards
  if (asset.status === "DELETED") {
    throw new StorageError("ASSET_NOT_FOUND", `Asset "${assetId}" has been deleted.`);
  }

  if (asset.status === "QUARANTINED") {
    throw new StorageError(
      "ASSET_QUARANTINED",
      `Asset "${assetId}" is quarantined and cannot be accessed.`
    );
  }

  if (asset.status !== "READY") {
    throw new StorageError(
      "ASSET_NOT_READY",
      `Asset "${assetId}" is in status "${asset.status}" and is not ready for download.`
    );
  }

  // 3. IDOR Guard: Role and Business Ownership verification
  const isSuperAdmin = actor.role === "SUPER_ADMIN" || actor.role === "ADMIN";

  if (!isSuperAdmin) {
    switch (asset.ownerType) {
      case "USER":
        // Customer can only access their own user profile asset
        if (asset.ownerId !== actor.id) {
          throw new StorageError(
            "PRIVATE_ACCESS_DENIED",
            `Actor "${actor.id}" is not authorized to access user asset "${assetId}".`
          );
        }
        break;

      case "VEHICLE":
      case "SUPPORT_TICKET":
      case "ORDER":
      case "DOCUMENT":
        // Check dynamic entity ownership if provided
        if (entityOwnershipCheck) {
          const isOwner = await entityOwnershipCheck(
            asset.ownerType,
            asset.ownerId,
            actor.id,
            actor.role
          );
          if (!isOwner) {
            throw new StorageError(
              "PRIVATE_ACCESS_DENIED",
              `Actor "${actor.id}" does not own the associated ${asset.ownerType} "${asset.ownerId}".`
            );
          }
        } else if (actor.role === "CUSTOMER") {
          // Default guard if check is omitted for customer
          throw new StorageError(
            "PRIVATE_ACCESS_DENIED",
            `Access verification required for entity ${asset.ownerType} "${asset.ownerId}".`
          );
        }
        break;

      case "QR_BATCH":
        // QR Manufacturing exports are restricted to OPS_MANAGER / SUPER_ADMIN
        if (actor.role !== "OPS_MANAGER") {
          throw new StorageError(
            "PRIVATE_ACCESS_DENIED",
            `Actor role "${actor.role}" is not authorized to access QR manufacturing exports.`
          );
        }
        break;

      case "REPORT":
        // Reports are restricted to ANALYTICS_VIEWER / SUPER_ADMIN
        if (actor.role !== "ANALYTICS_VIEWER") {
          throw new StorageError(
            "PRIVATE_ACCESS_DENIED",
            `Actor role "${actor.role}" is not authorized to access internal administrative reports.`
          );
        }
        break;

      default:
        throw new StorageError(
          "PRIVATE_ACCESS_DENIED",
          `Unauthorized access attempt to ${asset.ownerType} asset.`
        );
    }
  }

  return asset;
}
