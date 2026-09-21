import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import type {
  SafetyContactNetworkData,
  SafetyContactItem,
  ContactSignalRailData,
  VehicleOption,
  PublicSafetyPreviewData,
  AssociatedVehicleRef,
} from "./contacts-types";
import { normalizeRelationshipToRole } from "./contacts-roles";

interface VehicleRow {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type: string;
}

interface ProfileRow {
  id: string;
  vehicle_id: string;
  display_name: string | null;
  blood_group: string | null;
  medical_notes: string | null;
  status: string;
}

interface ContactRow {
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
  updated_at: string;
  vehicle_id: string;
  registration_number: string;
  make: string;
  model: string;
}

function maskPlate(plate: string): string {
  if (!plate || plate.length < 5) return plate;
  const clean = plate.trim();
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix} •••• ${suffix}`;
}

function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    const last3 = digits.slice(-3);
    return `+91 ••••• ••${last3}`;
  }
  if (digits.length >= 4) {
    const last2 = digits.slice(-2);
    return `••••••${last2}`;
  }
  return "••••••••••";
}

/**
 * Normalizes phone to standard digits for deduplication & storage
 */
export function normalizePhone(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("91") && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  return cleaned.trim();
}

/**
 * Queries authoritative Cloudflare D1 database and builds the
 * complete Safety Contact Network data model for an authenticated user.
 */
export async function getSafetyContactNetwork(
  userId: string
): Promise<SafetyContactNetworkData> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Authoritative vehicles owned by user
  const vehicleRows = await db.query<VehicleRow>(
    `SELECT id, registration_number, make, model, vehicle_type
     FROM vehicles
     WHERE user_id = ? AND status != 'DELETED'
     ORDER BY created_at ASC`,
    [userId]
  );

  const vehicles: VehicleOption[] = vehicleRows.map((v) => ({
    id: v.id,
    plate: v.registration_number,
    maskedPlate: maskPlate(v.registration_number),
    makeModel: `${v.make || ""} ${v.model || ""}`.trim() || "Registered Vehicle",
    vehicleType: v.vehicle_type || "FOUR_WHEELER",
  }));

  if (vehicles.length === 0) {
    return {
      contacts: [],
      primaryContact: null,
      signals: {
        totalContacts: 0,
        publiclyAvailable: 0,
        primaryContactName: null,
        vehiclesCovered: 0,
        totalVehicles: 0,
        lastUpdatedAt: null,
      },
      vehicles: [],
      appliedFilters: {
        search: "",
        role: "all",
        vehicleId: "all",
        visibility: "all",
      },
    };
  }

  // 2. Query all contacts linked to user's vehicles
  const contactRows = await db.query<ContactRow>(
    `SELECT 
       c.id, c.emergency_profile_id, c.name, c.relationship_label, c.phone,
       c.priority, c.is_enabled, c.allow_call, c.allow_message,
       c.created_at, c.updated_at,
       v.id as vehicle_id, v.registration_number, v.make, v.model
     FROM emergency_contacts c
     INNER JOIN emergency_profiles p ON c.emergency_profile_id = p.id
     INNER JOIN vehicles v ON p.vehicle_id = v.id
     WHERE v.user_id = ? AND v.status != 'DELETED' AND p.status = 'ACTIVE'
     ORDER BY c.priority ASC, c.created_at ASC`,
    [userId]
  );

  // Group contacts by normalized phone & name to form cohesive owner-level contact identities
  const contactMap = new Map<string, SafetyContactItem>();
  const vehiclesWithContacts = new Set<string>();
  let latestTimestamp: string | null = null;

  for (const row of contactRows) {
    vehiclesWithContacts.add(row.vehicle_id);
    const normPhone = normalizePhone(row.phone);
    const groupKey = `${row.name.trim().toLowerCase()}_${normPhone}`;

    if (!latestTimestamp || (row.updated_at && row.updated_at > latestTimestamp)) {
      latestTimestamp = row.updated_at || row.created_at;
    }

    const vehicleRef: AssociatedVehicleRef = {
      vehicleId: row.vehicle_id,
      plate: row.registration_number,
      maskedPlate: maskPlate(row.registration_number),
      makeModel: `${row.make || ""} ${row.model || ""}`.trim() || "Vehicle",
      priority: row.priority || 1,
      isEnabled: row.is_enabled === 1,
      contactId: row.id,
    };

    const existing = contactMap.get(groupKey);

    if (existing) {
      existing.associatedVehicles.push(vehicleRef);
      // Priority is minimum across vehicles (1 is highest)
      if (vehicleRef.priority < existing.priority) {
        existing.priority = vehicleRef.priority;
        existing.isPrimary = vehicleRef.priority === 1;
      }
      if (vehicleRef.isEnabled) {
        existing.isPubliclyAvailable = true;
      }
      if (row.allow_call === 1) existing.allowCall = true;
      if (row.allow_message === 1) existing.allowMessage = true;
    } else {
      const isPri = row.priority === 1;
      const isPub = row.is_enabled === 1;
      contactMap.set(groupKey, {
        id: row.id,
        name: row.name.trim(),
        relationshipLabel: row.relationship_label || "Emergency Contact",
        role: normalizeRelationshipToRole(row.relationship_label),
        phone: row.phone,
        maskedPhone: maskPhoneNumber(row.phone),
        priority: row.priority || 1,
        isPrimary: isPri,
        isPubliclyAvailable: isPub,
        allowCall: row.allow_call === 1,
        allowMessage: row.allow_message === 1,
        associatedVehicles: [vehicleRef],
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      });
    }
  }

  const contacts = Array.from(contactMap.values()).sort((a, b) => {
    // Primary first, then by priority, then alphabetical
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });

  const primaryContact = contacts.find((c) => c.isPrimary) || null;
  const publiclyAvailableCount = contacts.filter((c) => c.isPubliclyAvailable).length;

  const signals: ContactSignalRailData = {
    totalContacts: contacts.length,
    publiclyAvailable: publiclyAvailableCount,
    primaryContactName: primaryContact ? primaryContact.name : null,
    vehiclesCovered: vehiclesWithContacts.size,
    totalVehicles: vehicles.length,
    lastUpdatedAt: latestTimestamp,
  };

  return {
    contacts,
    primaryContact,
    signals,
    vehicles,
    appliedFilters: {
      search: "",
      role: "all",
      vehicleId: "all",
      visibility: "all",
    },
  };
}

/**
 * Builds authoritative public safety projection for a given vehicle.
 * Used for the Public Safety View Preview modal to show exactly what
 * a passerby or emergency respondent can see on qr.vaahansafe.com.
 * ZERO raw phone numbers are leaked.
 */
export async function getPublicSafetyPreview(
  userId: string,
  vehicleId: string
): Promise<PublicSafetyPreviewData | null> {
  const db = getAuthoritativeDatabaseClient();

  const vehicle = await db.queryFirst<VehicleRow>(
    `SELECT id, registration_number, make, model, vehicle_type
     FROM vehicles
     WHERE id = ? AND user_id = ? AND status != 'DELETED'`,
    [vehicleId, userId]
  );

  if (!vehicle) return null;

  const profile = await db.queryFirst<ProfileRow>(
    `SELECT id, vehicle_id, display_name, blood_group, medical_notes, status
     FROM emergency_profiles
     WHERE vehicle_id = ? AND status = 'ACTIVE'`,
    [vehicleId]
  );

  if (!profile) {
    return {
      vehiclePlate: vehicle.registration_number,
      vehicleDisplay: `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Vehicle",
      vehicleType: vehicle.vehicle_type || "FOUR_WHEELER",
      contacts: [],
    };
  }

  const contacts = await db.query<ContactRow>(
    `SELECT name, relationship_label, priority, is_enabled
     FROM emergency_contacts
     WHERE emergency_profile_id = ? AND is_enabled = 1
     ORDER BY priority ASC, created_at ASC`,
    [profile.id]
  );

  return {
    vehiclePlate: vehicle.registration_number,
    vehicleDisplay: `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Vehicle",
    vehicleType: vehicle.vehicle_type || "FOUR_WHEELER",
    contacts: contacts.map((c) => ({
      name: c.name,
      relationship: c.relationship_label || "Emergency Contact",
      isPriority: c.priority === 1,
      role: normalizeRelationshipToRole(c.relationship_label),
    })),
    bloodGroup: profile.blood_group || undefined,
    medicalNotes: profile.medical_notes || undefined,
  };
}
