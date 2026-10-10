/**
 * VaahanSafe Central Domain Public QR Resolver
 *
 * SECTION 06 & 87: Implement ONE domain-level resolver.
 * Evaluates identifier format, database existence, lifecycle state,
 * vehicle binding, service entitlement, and safe public projection.
 *
 * CRITICAL INVARIANTS:
 * 1. Speed -> Reliability -> Privacy -> Clarity -> Accessibility -> Visual Quality.
 * 2. Database primary keys, user accounts, and billing/order history must NEVER reach the public browser.
 * 3. Never trust client state; all decisions are evaluated server-authoritatively.
 * 4. ACTIVE state requires BOTH valid binding and active service entitlement.
 * 5. If the database query fails, return a service error rather than an unknown QR.
 * 6. Always sanitize and validate publicId format before executing DB query.
 */

import type { VehicleType } from "@vaahansafe/types";
import {
  getAuthoritativeDatabaseClient,
  type DatabaseClient,
} from "@vaahansafe/database";
import { getActivateUrl } from "@vaahansafe/config";
import {
  mapInternalToPublicResolverState,
  getPublicResolverMeta,
} from "./states";
import {
  assertSafePublicProjection,
  type PublicEmergencyProfile,
  type PublicEmergencyContact,
} from "./projection";
import type { PublicQrResolution } from "./types";
import { isValidPublicIdFormat } from "./validate-payload";

export interface ResolvePublicQrOptions {
  db?: DatabaseClient;
  repository?: PublicQrReadRepository;
}

export interface HotPathQueryResultRow {
  qr_id: string;
  public_id: string;
  visible_code: string;
  qr_status: string;
  replaced_by_qr_id: string | null;
  replaced_by_public_id: string | null;
  vehicle_id: string | null;
  owner_user_id: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  vehicle_type: string | null;
  registration_number: string | null;
  emergency_profile_id: string | null;
  display_name: string | null;
  blood_group: string | null;
  medical_notes: string | null;
  public_vehicle_details: string | null;
  show_owner_name: number | null;
  show_blood_group: number | null;
  show_medical_notes: number | null;
  show_vehicle_details: number | null;
  profile_status: string | null;
  profile_updated_at: string | null;
}

export interface ContactQueryResultRow {
  id: string;
  name: string;
  relationship_label: string;
  phone: string;
  priority: number;
  allow_call: number;
  allow_message: number;
}

export interface PublicQrEntitlementRow {
  id: string;
  capability: string;
  status: string;
  user_id: string;
  vehicle_id: string;
  expires_at: string | null;
}

export interface PublicQrReadRepository {
  findQr(publicId: string): Promise<HotPathQueryResultRow | null>;
  findEntitlements(qrId: string): Promise<PublicQrEntitlementRow[]>;
  findContacts(profileId: string): Promise<ContactQueryResultRow[]>;
}

// Format validation is imported from ./validate-payload

/**
 * Authoritative domain resolver for a public QR identifier.
 */
export async function resolvePublicQr(
  rawPublicId: string,
  options?: ResolvePublicQrOptions,
): Promise<PublicQrResolution> {
  const publicId = typeof rawPublicId === "string" ? rawPublicId.trim() : "";

  // 1. Format validation guard
  if (!isValidPublicIdFormat(publicId)) {
    return {
      publicId,
      state: "UNKNOWN",
      meta: getPublicResolverMeta("UNKNOWN", { publicId }),
    };
  }

  const repository = options?.repository;
  const db = repository
    ? undefined
    : options?.db || getAuthoritativeDatabaseClient();

  // 2. Hot-Path Indexed Single Query
  // Note: Only selects minimal relational fields needed for emergency safety resolution
  const row = repository
    ? await repository.findQr(publicId)
    : await db!.queryFirst<HotPathQueryResultRow>(
        `SELECT
        s.id AS qr_id,
        s.public_id,
        s.visible_code,
        s.status AS qr_status,
        s.replaced_by_qr_id,
        rep_s.public_id AS replaced_by_public_id,
        v.id AS vehicle_id,
        v.user_id AS owner_user_id,
        v.make,
        v.model,
        v.color,
        v.vehicle_type,
        v.registration_number,
        ep.id AS emergency_profile_id,
        ep.display_name,
        ep.blood_group,
        ep.medical_notes,
        ep.public_vehicle_details,
        ep.show_owner_name,
        ep.show_blood_group,
        ep.show_medical_notes,
        ep.show_vehicle_details,
        ep.status AS profile_status,
        ep.updated_at AS profile_updated_at
     FROM qr_stickers s
     LEFT JOIN qr_stickers rep_s ON s.replaced_by_qr_id = rep_s.id
     LEFT JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     LEFT JOIN vehicles v ON a.vehicle_id = v.id AND a.user_id = v.user_id AND v.status = 'ACTIVE'
     LEFT JOIN emergency_profiles ep ON v.id = ep.vehicle_id AND ep.status = 'ACTIVE'
     WHERE s.public_id = ?
     LIMIT 1`,
        [publicId],
      );

  // 3. Unknown Public Identifier
  if (!row) {
    return {
      publicId,
      state: "UNKNOWN",
      meta: getPublicResolverMeta("UNKNOWN", { publicId }),
    };
  }

  // 4. Map Internal Lifecycle State
  const publicState = mapInternalToPublicResolverState(row.qr_status);

  // 5. Non-Active States Handling
  if (publicState === "SETUP_REQUIRED") {
    return {
      qrId: row.qr_id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      state: publicState,
      meta: getPublicResolverMeta(publicState, { publicId: row.public_id }),
    };
  }
  if (publicState === "ACTIVATION_AVAILABLE") {
    return {
      qrId: row.qr_id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      state: "ACTIVATION_AVAILABLE",
      meta: getPublicResolverMeta("ACTIVATION_AVAILABLE", {
        publicId: row.public_id,
        activateUrl: getActivateUrl(row.public_id),
      }),
    };
  }

  if (publicState === "REPLACED") {
    return {
      qrId: row.qr_id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      state: "REPLACED",
      replacedByPublicId: row.replaced_by_public_id || undefined,
      meta: getPublicResolverMeta("REPLACED", { publicId: row.public_id }),
    };
  }

  if (publicState === "LOST_DAMAGED") {
    return {
      qrId: row.qr_id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      state: "LOST_DAMAGED",
      meta: getPublicResolverMeta("LOST_DAMAGED", { publicId: row.public_id }),
    };
  }

  if (publicState === "BLOCKED") {
    return {
      qrId: row.qr_id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      state: "BLOCKED",
      meta: getPublicResolverMeta("BLOCKED", { publicId: row.public_id }),
    };
  }

  // 6. Active Lifecycle Gate: Check Service Entitlement & Active Binding
  if (publicState === "ACTIVE") {
    // A sticker is only eligible if bound to an active vehicle
    if (
      !row.vehicle_id ||
      !row.owner_user_id ||
      !row.emergency_profile_id ||
      row.profile_status !== "ACTIVE"
    ) {
      return {
        qrId: row.qr_id,
        publicId: row.public_id,
        visibleCode: row.visible_code,
        state: "BLOCKED",
        meta: getPublicResolverMeta("BLOCKED", {
          publicId: row.public_id,
          activateUrl: getActivateUrl(row.public_id),
        }),
      };
    }

    // Authoritative Service Entitlement Verification (Rule 00, 01, 81)
    const allEntitlements = repository
      ? await repository.findEntitlements(row.qr_id)
      : await db!.query<PublicQrEntitlementRow>(
          `SELECT id, capability, status, user_id, vehicle_id, expires_at FROM service_entitlements
         WHERE qr_sticker_id = ?`,
          [row.qr_id],
        );
    // Missing, mismatched, expired or unavailable entitlements never enable a profile.
    const isEntitled = allEntitlements.some(
      (e) =>
        e.capability === "SAFETY_VIEW_ACTIVE" &&
        e.status === "ENABLED" &&
        e.user_id === row.owner_user_id &&
        e.vehicle_id === row.vehicle_id &&
        (e.expires_at === null || Date.parse(e.expires_at) > Date.now()),
    );

    if (!isEntitled) {
      return {
        qrId: row.qr_id,
        publicId: row.public_id,
        visibleCode: row.visible_code,
        state: "BLOCKED",
        meta: getPublicResolverMeta("BLOCKED", { publicId: row.public_id }),
      };
    }

    // 7. Fetch Authoritative Public Emergency Contacts
    let contacts: PublicEmergencyContact[] = [];
    if (row.emergency_profile_id) {
      const contactRows = repository
        ? await repository.findContacts(row.emergency_profile_id)
        : await db!.query<ContactQueryResultRow>(
            `SELECT id, name, relationship_label, phone, priority, allow_call, allow_message
         FROM emergency_contacts
         WHERE emergency_profile_id = ? AND is_enabled = 1 AND (allow_call = 1 OR allow_message = 1)
         ORDER BY priority ASC
         LIMIT 3`,
            [row.emergency_profile_id],
          );

      contacts = contactRows
        .filter((c) => c && c.name && c.phone && (c.allow_call === 1 || c.allow_message === 1))
        .map((c) => ({
          id: c.id,
          name: c.name.trim(),
          relationship: c.relationship_label?.trim() || "Emergency Contact",
          phone: c.phone.trim(),
          isPriority: c.priority === 1,
          allowCall: c.allow_call === 1,
          allowMessage: c.allow_message === 1,
        }));
    }

    // 8. Build Safe Public Vehicle Display
    const vehicleDisplay =
      row.show_vehicle_details === 1 && row.make && row.model
        ? `${row.make} ${row.model}${row.color ? ` • ${row.color}` : ""}`
        : "Registered Vehicle";

    // 9. Construct Strict Public Projection
    const profile: PublicEmergencyProfile = {
      qrPublicId: row.public_id,
      status: "ACTIVE",
      vehicleDisplay,
      vehicleType: (row.vehicle_type as VehicleType) || "CAR",
      approvedOwnerDisplayName:
        row.show_owner_name === 1
          ? row.display_name?.trim() || undefined
          : undefined,
      bloodGroup:
        row.show_blood_group === 1
          ? row.blood_group?.trim() || undefined
          : undefined,
      approvedSafetyNotes:
        row.show_medical_notes === 1
          ? row.medical_notes?.trim() || undefined
          : undefined,
      approvedEmergencyContacts: contacts,
      profileUpdatedAt: row.profile_updated_at || new Date().toISOString(),
    };

    // 10. Runtime Assertion: Ensure zero forbidden fields are present
    assertSafePublicProjection(profile as unknown as Record<string, unknown>);

    return {
      qrId: row.qr_id,
      publicId: row.public_id,
      visibleCode: row.visible_code,
      state: "ACTIVE",
      profile,
      meta: getPublicResolverMeta("ACTIVE", { publicId: row.public_id }),
    };
  }

  return {
    publicId,
    state: "UNKNOWN",
    meta: getPublicResolverMeta("UNKNOWN", { publicId }),
  };
}
