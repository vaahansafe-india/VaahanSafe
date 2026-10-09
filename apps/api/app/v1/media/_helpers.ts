/** Supabase stores media metadata; Cloudflare R2 stores object bytes. */
import { D1MediaAssetRepository, getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { getAuthoritativeObjectStore } from "@vaahansafe/storage";
import type { ObjectStore, MediaAssetRepository } from "@vaahansafe/storage";
import type { OwnerType, StorageActor } from "@vaahansafe/storage";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { NextResponse } from "next/server";
import { requireUserSession } from "../_auth";

export async function getStorageActor(request: Request): Promise<StorageActor | NextResponse> {
  const auth = await requireUserSession(request);
  if (auth instanceof NextResponse) return auth;
  if (!auth.user.phone) return NextResponse.json({ success: false, error: { code: "PHONE_REQUIRED", message: "Verify your mobile number to continue." } }, { status: 403 });
  return { id: auth.user.id, role: auth.user.role };
}

export async function canAccessStorageOwner(ownerType: OwnerType, ownerId: string, actorId: string, actorRole: string): Promise<boolean> {
  if (actorRole === "ADMIN") return true;
  if (ownerType === "USER") return ownerId === actorId;
  const table = ownerType === "VEHICLE" ? "vehicles" : ownerType === "ORDER" ? "orders" : null;
  if (!table) return false;
  const { data, error } = await getSupabaseAdminClient().from(table).select("id").eq("id", ownerId).eq("user_id", actorId).maybeSingle();
  if (error) throw new Error("Storage ownership verification unavailable");
  return !!data;
}

export function getObjectStoreForBucket(bucketClass: "PUBLIC" | "PRIVATE" | "EXPORT"): ObjectStore {
  return getAuthoritativeObjectStore(bucketClass);
}

export function getMediaAssetRepository(): MediaAssetRepository {
  return new D1MediaAssetRepository(getAuthoritativeDatabaseClient());
}
