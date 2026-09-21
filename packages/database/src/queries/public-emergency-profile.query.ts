/**
 * VaahanSafe Authoritative Public Emergency Resolver Query
 *
 * INVARIANT: Never query account tables (users, sessions, addresses, payments)
 * in the public emergency resolution path.
 * This query joins ONLY the minimum relational entities required for life-safety.
 */

import type { PublicEmergencyProfile, PublicEmergencyContact, VehicleType } from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

export type PublicResolverState =
  | "ACTIVE"
  | "ACTIVATION_AVAILABLE"
  | "REPLACED"
  | "LOST_DAMAGED"
  | "BLOCKED"
  | "UNKNOWN";

export interface PublicResolverQueryResult {
  state: PublicResolverState;
  publicId?: string;
  visibleCode?: string;
  replacedByPublicId?: string;
  profile?: PublicEmergencyProfile;
}

interface HotPathQueryResultRow {
  qr_id: string;
  public_id: string;
  visible_code: string;
  qr_status: string;
  replaced_by_qr_id: string | null;
  replaced_by_public_id: string | null;
  vehicle_id: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  vehicle_type: string | null;
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

interface ContactQueryResultRow {
  id: string;
  name: string;
  relationship_label: string;
  phone: string;
  priority: number;
  allow_call: number;
  allow_message: number;
}

/**
 * Executes the indexed hot-path query for QR emergency resolution.
 */
export async function resolvePublicEmergencyProfile(
  db: DatabaseClient,
  publicId: string
): Promise<PublicResolverQueryResult> {
  const row = await db.queryFirst<HotPathQueryResultRow>(
    `SELECT 
        s.id AS qr_id,
        s.public_id,
        s.visible_code,
        s.status AS qr_status,
        s.replaced_by_qr_id,
        rep_s.public_id AS replaced_by_public_id,
        v.id AS vehicle_id,
        v.make,
        v.model,
        v.color,
        v.vehicle_type,
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
     LEFT JOIN vehicles v ON a.vehicle_id = v.id AND v.status = 'ACTIVE'
     LEFT JOIN emergency_profiles ep ON v.id = ep.vehicle_id AND ep.status = 'ACTIVE'
     WHERE s.public_id = ?`,
    [publicId]
  );

  if (!row) {
    return { state: "UNKNOWN" };
  }

  // Handle Non-Active Lifecycle States
  switch (row.qr_status) {
    case "PRINTED":
    case "IN_TRANSIT_DISTRIBUTOR":
    case "WITH_DISTRIBUTOR":
    case "WITH_RETAILER":
    case "SOLD":
      return {
        state: "ACTIVATION_AVAILABLE",
        publicId: row.public_id,
        visibleCode: row.visible_code,
      };

    case "REPLACED":
      return {
        state: "REPLACED",
        publicId: row.public_id,
        replacedByPublicId: row.replaced_by_public_id || undefined,
      };

    case "LOST_DAMAGED":
    case "EXPIRED_UNSOLD":
      return {
        state: "LOST_DAMAGED",
        publicId: row.public_id,
      };

    case "BLOCKED":
      return {
        state: "BLOCKED",
        publicId: row.public_id,
      };

    case "ACTIVATED":
      // Valid active sticker, continue to projection build
      break;

    default:
      return { state: "UNKNOWN" };
  }

  // If ACTIVATED, construct the public emergency projection
  let contacts: PublicEmergencyContact[] = [];
  if (row.emergency_profile_id) {
    const contactRows = await db.query<ContactQueryResultRow>(
      `SELECT id, name, relationship_label, phone, priority, allow_call, allow_message
       FROM emergency_contacts
       WHERE emergency_profile_id = ? AND is_enabled = 1
       ORDER BY priority ASC`,
      [row.emergency_profile_id]
    );

    contacts = contactRows.map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship_label,
      phone: c.phone,
      isPriority: c.priority === 1,
    }));
  }

  const vehicleDisplay = row.show_vehicle_details !== 0 && row.make && row.model
    ? `${row.make} ${row.model}${row.color ? ` • ${row.color}` : ""}`
    : "Registered Vehicle";

  const profile: PublicEmergencyProfile = {
    qrPublicId: row.public_id,
    status: "ACTIVE",
    vehicleDisplay,
    vehicleType: (row.vehicle_type as VehicleType) || "CAR",
    approvedOwnerDisplayName: row.show_owner_name !== 0 ? (row.display_name || undefined) : undefined,
    bloodGroup: row.show_blood_group !== 0 ? (row.blood_group || undefined) : undefined,
    approvedSafetyNotes: row.show_medical_notes !== 0 ? (row.medical_notes || undefined) : undefined,
    approvedEmergencyContacts: contacts,
    profileUpdatedAt: row.profile_updated_at || new Date().toISOString(),
  };

  return {
    state: "ACTIVE",
    publicId: row.public_id,
    visibleCode: row.visible_code,
    profile,
  };
}
