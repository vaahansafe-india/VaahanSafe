import type {
  EmergencyContact,
  EmergencyProfileRepository,
  MedicalProfile,
  VehicleId,
} from "@vaahansafe/types";
import type { DatabaseClient } from "../client/d1";

interface DbProfileRow {
  id: string;
  vehicle_id: string;
  display_name: string | null;
  blood_group: string | null;
  medical_notes: string | null;
  public_vehicle_details: string | null;
  show_owner_name: number;
  show_blood_group: number;
  show_medical_notes: number;
  show_vehicle_details: number;
  status: string;
  updated_at: string;
}

interface DbContactRow {
  id: string;
  emergency_profile_id: string;
  name: string;
  relationship_label: string;
  phone: string;
  priority: number;
  is_enabled: number;
  allow_call: number;
  allow_message: number;
  created_at: string;
}

export class D1EmergencyProfileRepository implements EmergencyProfileRepository {
  constructor(private db: DatabaseClient) {}

  async findByVehicleId(vehicleId: VehicleId | string): Promise<{
    contacts: EmergencyContact[];
    medical?: MedicalProfile | null;
  }> {
    const profile = await this.db.queryFirst<DbProfileRow>(
      `SELECT id, vehicle_id, display_name, blood_group, medical_notes, public_vehicle_details, 
              show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details, status, updated_at
       FROM emergency_profiles WHERE vehicle_id = ? AND status = 'ACTIVE'`,
      [vehicleId]
    );

    if (!profile) {
      return { contacts: [], medical: null };
    }

    const contactRows = await this.db.query<DbContactRow>(
      `SELECT id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message, created_at
       FROM emergency_contacts
       WHERE emergency_profile_id = ?
       ORDER BY priority ASC`,
      [profile.id]
    );

    const contacts: EmergencyContact[] = contactRows.map((r) => ({
      id: r.id,
      vehicleId: String(vehicleId),
      customerId: "",
      name: r.name,
      relationship: r.relationship_label,
      phone: r.phone,
      isPriority: r.priority === 1,
      notifyOnScan: r.allow_message === 1,
      createdAt: r.created_at,
    }));

    const medical: MedicalProfile | null = profile.blood_group || profile.medical_notes ? {
      id: profile.id,
      vehicleId: String(vehicleId),
      bloodGroup: profile.blood_group as MedicalProfile["bloodGroup"],
      additionalNotes: profile.medical_notes || undefined,
      updatedAt: profile.updated_at,
    } : null;

    return { contacts, medical };
  }

  async saveContact(contact: Partial<EmergencyContact> & { id: string; emergencyProfileId?: string }): Promise<EmergencyContact> {
    const now = new Date().toISOString();
    const profileId = contact.emergencyProfileId || contact.vehicleId; // profile resolution
    if (!profileId) {
      throw new Error("Missing emergencyProfileId / vehicleId for contact");
    }

    // Check if contact exists
    const existing = await this.db.queryFirst<DbContactRow>(
      "SELECT id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message, created_at FROM emergency_contacts WHERE id = ?",
      [contact.id]
    );

    if (existing) {
      await this.db.execute(
        `UPDATE emergency_contacts SET
           name = COALESCE(?, name),
           relationship_label = COALESCE(?, relationship_label),
           phone = COALESCE(?, phone),
           priority = COALESCE(?, priority),
           updated_at = ?
         WHERE id = ?`,
        [
          contact.name ?? null,
          contact.relationship ?? null,
          contact.phone ?? null,
          contact.isPriority !== undefined ? (contact.isPriority ? 1 : 2) : null,
          now,
          contact.id,
        ]
      );
    } else {
      await this.db.execute(
        `INSERT INTO emergency_contacts (id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?)`,
        [
          contact.id,
          profileId,
          contact.name || "Contact",
          contact.relationship || "Other",
          contact.phone || "",
          contact.isPriority ? 1 : 2,
          contact.createdAt || now,
          now,
        ]
      );
    }

    const row = await this.db.queryFirst<DbContactRow>(
      "SELECT id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message, created_at FROM emergency_contacts WHERE id = ?",
      [contact.id]
    );

    if (!row) {
      throw new Error(`Failed to save emergency contact ${contact.id}`);
    }

    return {
      id: row.id,
      vehicleId: String(contact.vehicleId || ""),
      customerId: contact.customerId || "",
      name: row.name,
      relationship: row.relationship_label,
      phone: row.phone,
      isPriority: row.priority === 1,
      notifyOnScan: row.allow_message === 1,
      createdAt: row.created_at,
    };
  }

  async deleteContact(contactId: string): Promise<boolean> {
    const res = await this.db.execute("DELETE FROM emergency_contacts WHERE id = ?", [contactId]);
    return res.success;
  }

  async findRawProfileByVehicleId(vehicleId: string): Promise<DbProfileRow | null> {
    return this.db.queryFirst<DbProfileRow>(
      `SELECT id, vehicle_id, display_name, blood_group, medical_notes, public_vehicle_details, 
              show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details, status, updated_at
       FROM emergency_profiles WHERE vehicle_id = ?`,
      [vehicleId]
    );
  }

  async upsertPrivacySettings(
    vehicleId: string,
    settings: {
      showOwnerName?: boolean;
      showBloodGroup?: boolean;
      showMedicalNotes?: boolean;
      showVehicleDetails?: boolean;
      displayName?: string | null;
      bloodGroup?: string | null;
      medicalNotes?: string | null;
    }
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const existing = await this.findRawProfileByVehicleId(vehicleId);
    if (existing) {
      const showOwner = settings.showOwnerName !== undefined ? (settings.showOwnerName ? 1 : 0) : existing.show_owner_name;
      const showBlood = settings.showBloodGroup !== undefined ? (settings.showBloodGroup ? 1 : 0) : existing.show_blood_group;
      const showMed = settings.showMedicalNotes !== undefined ? (settings.showMedicalNotes ? 1 : 0) : existing.show_medical_notes;
      const showVeh = settings.showVehicleDetails !== undefined ? (settings.showVehicleDetails ? 1 : 0) : existing.show_vehicle_details;
      const displayName = settings.displayName !== undefined ? settings.displayName : existing.display_name;
      const bloodGroup = settings.bloodGroup !== undefined ? settings.bloodGroup : existing.blood_group;
      const medicalNotes = settings.medicalNotes !== undefined ? settings.medicalNotes : existing.medical_notes;

      const res = await this.db.execute(
        `UPDATE emergency_profiles SET
           show_owner_name = ?,
           show_blood_group = ?,
           show_medical_notes = ?,
           show_vehicle_details = ?,
           display_name = ?,
           blood_group = ?,
           medical_notes = ?,
           updated_at = ?
         WHERE vehicle_id = ?`,
        [showOwner, showBlood, showMed, showVeh, displayName, bloodGroup, medicalNotes, now, vehicleId]
      );
      return res.success;
    } else {
      const id = `ep_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const showOwner = settings.showOwnerName !== undefined ? (settings.showOwnerName ? 1 : 0) : 1;
      const showBlood = settings.showBloodGroup !== undefined ? (settings.showBloodGroup ? 1 : 0) : 1;
      const showMed = settings.showMedicalNotes !== undefined ? (settings.showMedicalNotes ? 1 : 0) : 0;
      const showVeh = settings.showVehicleDetails !== undefined ? (settings.showVehicleDetails ? 1 : 0) : 1;

      const res = await this.db.execute(
        `INSERT INTO emergency_profiles (
           id, vehicle_id, display_name, blood_group, medical_notes, public_vehicle_details,
           show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details,
           status, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [id, vehicleId, settings.displayName || null, settings.bloodGroup || null, settings.medicalNotes || null, showOwner, showBlood, showMed, showVeh, now, now]
      );
      return res.success;
    }
  }
}
