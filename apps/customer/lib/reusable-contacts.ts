import type { DatabaseClient } from "@vaahansafe/database";
import type { ReusableSafetyContact } from "./contacts-types";
import { normalizePhone } from "./contacts-service";

/** Private, owner-scoped address book assembled from existing vehicle contacts. */
export async function getReusableContacts(
  db: DatabaseClient,
  ownerId: string,
): Promise<ReusableSafetyContact[]> {
  const rows = await db.query<{
    id: string;
    name: string;
    phone: string;
    relationship_label: string;
    vehicle_id: string;
    registration_number: string;
    make: string | null;
    model: string | null;
    is_enabled: number;
    allow_call: number;
    allow_message: number;
  }>(
    `SELECT c.id,c.name,c.phone,c.relationship_label,c.is_enabled,c.allow_call,c.allow_message,
       v.id AS vehicle_id,v.registration_number,v.make,v.model
     FROM emergency_contacts c JOIN emergency_profiles p ON p.id=c.emergency_profile_id
     JOIN vehicles v ON v.id=p.vehicle_id
     WHERE v.user_id = ? AND v.status <> 'DELETED' AND v.deleted_at IS NULL AND p.status='ACTIVE'
     ORDER BY c.updated_at DESC,c.id LIMIT 200`,
    [ownerId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    maskedPhone: `+91 ••••••${normalizePhone(row.phone).slice(-4)}`,
    relationshipLabel: row.relationship_label || "Emergency Contact",
    sourceVehicleLabel: `${row.registration_number} · ${[row.make, row.model].filter(Boolean).join(" ")}`,
    linkedVehicleIds: [
      ...new Set(
        rows
          .filter(
            (other) =>
              normalizePhone(other.phone) === normalizePhone(row.phone),
          )
          .map((other) => other.vehicle_id),
      ),
    ],
    isEnabled: row.is_enabled === 1,
    allowCall: row.allow_call === 1,
    allowMessage: row.allow_message === 1,
  }));
}
