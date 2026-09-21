/**
 * @vaahansafe/customer
 * Authoritative Server-Side Vehicle Registry & Dossier Service
 *
 * Single source of truth for authenticated vehicle identity management.
 * Strictly queries Cloudflare D1 with authorized session scoping.
 * Zero mock data, zero fallback dummies.
 */

import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import { maskVehicleRegistration } from "@vaahansafe/vehicles";
import type {
  VehicleCategory,
  QrStatus,
  SafetyViewStatus,
  ReadinessNodeState,
  VehicleAttentionItem,
  VehicleRegistryItem,
  VehicleDossierData,
  VehicleEmergencyContactDetail,
  VehicleScanEventItem,
  VehicleHistoryMilestone,
  VehicleFilterState,
} from "./vehicle-types";

interface DbVehicleRow {
  id: string;
  user_id: string;
  registration_number: string;
  registration_number_normalized: string;
  vehicle_type: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  color: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DbQrRow {
  id: string;
  public_id: string;
  visible_code: string;
  batch_id: string;
  status: string;
  activated_at: string | null;
  assigned_at: string | null;
}

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
  created_at: string;
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

interface DbScanRow {
  id: string;
  scan_type: string;
  result: string;
  city: string | null;
  state: string | null;
  created_at: string;
}

interface DbQrHistoryRow {
  id: string;
  from_status: string;
  to_status: string;
  reason_code: string;
  created_at: string;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    return `•••••• ${last4}`;
  }
  return "••••••••";
}

/**
 * Retrieves the complete authorized Vehicle Registry for the authenticated user
 */
export async function getVehicleRegistry(
  userId: string,
  filterParams?: Partial<VehicleFilterState>
): Promise<{
  items: VehicleRegistryItem[];
  totalCount: number;
  attentionCount: number;
}> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Authoritative query of vehicles owned by this user
  let vehicleRows: DbVehicleRow[] = [];
  try {
    vehicleRows = await db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, registration_number_normalized,
              vehicle_type, make, model, variant, year, color, status, created_at, updated_at
       FROM vehicles
       WHERE user_id = ? AND status != 'DELETED'
       ORDER BY created_at DESC`,
      [userId]
    );
  } catch (err) {
    console.warn("[VehicleService] Failed to query user vehicles:", err);
  }

  const items: VehicleRegistryItem[] = [];
  let totalAttentionCount = 0;

  for (const v of vehicleRows) {
    // 2. Query active QR assignment & replacement state
    let qrRow: (DbQrRow & {
      replacement_id?: string | null;
      replacement_status?: string | null;
      replacement_reason?: string | null;
    }) | null = null;
    try {
      qrRow = await db.queryFirst<
        DbQrRow & {
          replacement_id?: string | null;
          replacement_status?: string | null;
          replacement_reason?: string | null;
        }
      >(
        `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, a.assigned_at,
                r.id as replacement_id, r.status as replacement_status, r.reason as replacement_reason
         FROM qr_stickers s
         INNER JOIN qr_assignments a ON s.id = a.qr_id
         LEFT JOIN replacement_requests r ON (r.old_qr_sticker_id = s.id OR r.vehicle_id = a.vehicle_id)
           AND r.status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED')
         WHERE a.vehicle_id = ? AND a.ended_at IS NULL
         LIMIT 1`,
        [v.id]
      );
    } catch (err) {
      console.warn(`[VehicleService] QR query failed for vehicle ${v.id}:`, err);
    }

    // 3. Query emergency profile
    let profileRow: DbProfileRow | null = null;
    try {
      profileRow = await db.queryFirst<DbProfileRow>(
        `SELECT id, vehicle_id, display_name, blood_group, medical_notes, public_vehicle_details,
                show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details, status, created_at, updated_at
         FROM emergency_profiles
         WHERE vehicle_id = ? AND status = 'ACTIVE'
         LIMIT 1`,
        [v.id]
      );
    } catch (err) {
      console.warn(`[VehicleService] Profile query failed for vehicle ${v.id}:`, err);
    }

    // 4. Query emergency contacts
    let contactRows: DbContactRow[] = [];
    if (profileRow) {
      try {
        contactRows = await db.query<DbContactRow>(
          `SELECT id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message, created_at
           FROM emergency_contacts
           WHERE emergency_profile_id = ? AND is_enabled = 1
           ORDER BY priority ASC`,
          [profileRow.id]
        );
      } catch (err) {
        console.warn(`[VehicleService] Contacts query failed for profile ${profileRow.id}:`, err);
      }
    }

    // 5. Derive deterministic readiness & attention items
    const attentionItems: VehicleAttentionItem[] = [];

    let qrNode: ReadinessNodeState = "ready";
    let safetyNode: ReadinessNodeState = "ready";
    let contactNode: ReadinessNodeState = "ready";

    if (!qrRow) {
      qrNode = "not_configured";
      attentionItems.push({
        id: `att-qr-${v.id}`,
        severity: "AMBER",
        title: "QR Sticker Not Connected",
        description: "Link a physical VaahanSafe safety sticker or activate a retail pack.",
        actionLabel: "Connect QR",
        actionTarget: "qr",
      });
    } else if (qrRow.status !== "ACTIVATED" && qrRow.status !== "ACTIVE") {
      qrNode = "attention";
      attentionItems.push({
        id: `att-qr-stat-${v.id}`,
        severity: "AMBER",
        title: "QR Activation Pending",
        description: `Sticker status is ${qrRow.status}. Complete activation to verify emergency relay.`,
        actionLabel: "Verify QR",
        actionTarget: "qr",
      });
    }

    if (!profileRow) {
      safetyNode = "not_configured";
      attentionItems.push({
        id: `att-prof-${v.id}`,
        severity: "AMBER",
        title: "Safety View Incomplete",
        description: "Configure what first responders and finders see upon scanning.",
        actionLabel: "Configure Safety",
        actionTarget: "safety",
      });
    }

    if (contactRows.length === 0) {
      contactNode = "attention";
      attentionItems.push({
        id: `att-cnt-${v.id}`,
        severity: "RED",
        title: "Emergency Contact Missing",
        description: "Add at least one priority contact for instant Golden Hour SMS alerts.",
        actionLabel: "Add Contact",
        actionTarget: "contact",
      });
    }

    if (attentionItems.length > 0) {
      totalAttentionCount += attentionItems.length;
    }

    const isReady = attentionItems.length === 0;

    const maskedReg = maskVehicleRegistration(v.registration_number, { mode: "PARTIAL" });
    const identityCode = qrRow ? `VS-${qrRow.public_id}` : `VS-REG-${v.id.slice(-6).toUpperCase()}`;

    items.push({
      id: v.id,
      registrationNumber: v.registration_number,
      registrationNumberNormalized: v.registration_number_normalized,
      registrationNumberMasked: maskedReg,
      make: v.make,
      model: v.model,
      variant: v.variant || undefined,
      year: v.year || undefined,
      color: v.color || undefined,
      type: (v.vehicle_type as VehicleCategory) || "CAR",
      status: v.status,
      createdAt: v.created_at,
      identityId: identityCode,
      qr: {
        hasQr: Boolean(qrRow),
        publicId: qrRow?.public_id,
        status: (qrRow?.status as QrStatus) || "UNLINKED",
        assignedAt: qrRow?.assigned_at || undefined,
        replacementPending: Boolean(qrRow?.replacement_id),
        replacementStatus: qrRow?.replacement_status || undefined,
        replacementReason: qrRow?.replacement_reason || undefined,
      },
      safety: {
        isConfigured: Boolean(profileRow),
        status: profileRow ? "CONFIGURED" : "NEEDS_SETUP",
        showOwnerName: profileRow ? profileRow.show_owner_name === 1 : true,
        showBloodGroup: profileRow ? profileRow.show_blood_group === 1 : true,
        showMedicalNotes: profileRow ? profileRow.show_medical_notes === 1 : false,
        showVehicleDetails: profileRow ? profileRow.show_vehicle_details === 1 : true,
        bloodGroup: profileRow?.blood_group,
        medicalNotes: profileRow?.medical_notes,
      },
      contacts: {
        count: contactRows.length,
        primaryName: contactRows[0]?.name,
        primaryRelationship: contactRows[0]?.relationship_label,
      },
      readiness: {
        isReady,
        vehicleNode: "ready",
        identityNode: "ready",
        qrNode,
        safetyNode,
        contactNode,
      },
      attention: attentionItems,
    });
  }

  // 6. Apply filter parameters
  let filtered = items;

  if (filterParams?.query && filterParams.query.trim()) {
    const q = filterParams.query.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.registrationNumber.toLowerCase().includes(q) ||
        item.registrationNumberNormalized.toLowerCase().includes(q) ||
        item.identityId.toLowerCase().includes(q)
    );
  }

  if (filterParams?.types && filterParams.types.length > 0) {
    const allowed = new Set(filterParams.types);
    filtered = filtered.filter((item) => allowed.has(item.type));
  }

  if (filterParams?.qrStatus && filterParams.qrStatus !== "ALL") {
    if (filterParams.qrStatus === "ACTIVE") {
      filtered = filtered.filter(
        (item) =>
          item.qr.hasQr &&
          (item.qr.status === "ACTIVE" || item.qr.status === "ACTIVATED")
      );
    } else if (filterParams.qrStatus === "UNLINKED") {
      filtered = filtered.filter(
        (item) => !item.qr.hasQr || item.qr.status === "UNLINKED"
      );
    }
  }

  if (filterParams?.safetyStatus && filterParams.safetyStatus !== "ALL") {
    filtered = filtered.filter((item) => item.safety.status === filterParams.safetyStatus);
  }

  // 7. Apply sorting
  if (filterParams?.sort === "NAME") {
    filtered.sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`));
  } else if (filterParams?.sort === "ATTENTION") {
    filtered.sort((a, b) => b.attention.length - a.attention.length);
  } else {
    // Default RECENT: newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return {
    items: filtered,
    totalCount: vehicleRows.length,
    attentionCount: totalAttentionCount,
  };
}

/**
 * Retrieves the complete authorized Vehicle Identity Dossier for a specific vehicle
 */
export async function getVehicleDossier(
  userId: string,
  vehicleId: string
): Promise<VehicleDossierData | null> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Authorize ownership of this vehicle
  const v = await db.queryFirst<DbVehicleRow>(
    `SELECT id, user_id, registration_number, registration_number_normalized,
            vehicle_type, make, model, variant, year, color, status, created_at, updated_at
     FROM vehicles
     WHERE id = ? AND user_id = ? AND status != 'DELETED'`,
    [vehicleId, userId]
  );

  if (!v) {
    return null;
  }

  // 2. Active QR assignment & replacement state
  const qrRow = await db.queryFirst<
    DbQrRow & {
      replacement_id?: string | null;
      replacement_status?: string | null;
      replacement_reason?: string | null;
    }
  >(
    `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, a.assigned_at,
            r.id as replacement_id, r.status as replacement_status, r.reason as replacement_reason
     FROM qr_stickers s
     INNER JOIN qr_assignments a ON s.id = a.qr_id
     LEFT JOIN replacement_requests r ON (r.old_qr_sticker_id = s.id OR r.vehicle_id = a.vehicle_id)
       AND r.status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED')
     WHERE a.vehicle_id = ? AND a.ended_at IS NULL
     LIMIT 1`,
    [v.id]
  );

  // 3. Emergency Profile
  const profileRow = await db.queryFirst<DbProfileRow>(
    `SELECT id, vehicle_id, display_name, blood_group, medical_notes, public_vehicle_details,
            show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details, status, created_at, updated_at
     FROM emergency_profiles
     WHERE vehicle_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [v.id]
  );

  // 4. Emergency Contacts
  let contactRows: DbContactRow[] = [];
  if (profileRow) {
    contactRows = await db.query<DbContactRow>(
      `SELECT id, emergency_profile_id, name, relationship_label, phone, priority, is_enabled, allow_call, allow_message, created_at
       FROM emergency_contacts
       WHERE emergency_profile_id = ?
       ORDER BY priority ASC`,
      [profileRow.id]
    );
  }

  // 5. Recent Scan Events (from real qr_scan_events)
  let scanRows: DbScanRow[] = [];
  if (qrRow) {
    scanRows = await db.query<DbScanRow>(
      `SELECT id, scan_type, result, city, state, created_at
       FROM qr_scan_events
       WHERE qr_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [qrRow.id]
    );
  }

  // 6. QR Status History
  let historyRows: DbQrHistoryRow[] = [];
  if (qrRow) {
    historyRows = await db.query<DbQrHistoryRow>(
      `SELECT id, from_status, to_status, reason_code, created_at
       FROM qr_status_history
       WHERE qr_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [qrRow.id]
    );
  }

  // 7. Compose lifecycle milestones
  const milestones: VehicleHistoryMilestone[] = [
    {
      id: `ms-veh-${v.id}`,
      title: "Vehicle Registered",
      description: `Physical asset registered with plate ${v.registration_number}`,
      timestamp: v.created_at,
      type: "VEHICLE_CREATED",
    },
  ];

  if (qrRow && qrRow.assigned_at) {
    milestones.push({
      id: `ms-qr-${qrRow.id}`,
      title: "QR Sticker Bound",
      description: `Cryptographic identifier VS-${qrRow.public_id} linked to vehicle`,
      timestamp: qrRow.assigned_at,
      type: "QR_LINKED",
    });
  }

  if (profileRow) {
    milestones.push({
      id: `ms-prof-${profileRow.id}`,
      title: "Emergency Profile Configured",
      description: "Public safety projection rules and finder emergency visibility set",
      timestamp: profileRow.created_at,
      type: "SAFETY_CONFIGURED",
    });
  }

  for (const c of contactRows) {
    milestones.push({
      id: `ms-cnt-${c.id}`,
      title: `Emergency Contact Added (${c.relationship_label})`,
      description: `Priority contact ${c.name} added with Golden Hour SMS relay`,
      timestamp: c.created_at,
      type: "CONTACT_ADDED",
    });
  }

  for (const h of historyRows) {
    milestones.push({
      id: `ms-hist-${h.id}`,
      title: `QR Status Changed (${h.to_status})`,
      description: `Reason: ${h.reason_code}`,
      timestamp: h.created_at,
      type: "SYSTEM",
    });
  }

  // Sort milestones chronologically (latest first)
  milestones.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // 8. Derive attention items
  const attentionItems: VehicleAttentionItem[] = [];
  let qrNode: ReadinessNodeState = "ready";
  let safetyNode: ReadinessNodeState = "ready";
  let contactNode: ReadinessNodeState = "ready";

  if (!qrRow) {
    qrNode = "not_configured";
    attentionItems.push({
      id: `att-qr-${v.id}`,
      severity: "AMBER",
      title: "QR Sticker Not Connected",
      description: "Link a physical VaahanSafe safety sticker or activate a retail pack.",
      actionLabel: "Connect QR",
      actionTarget: "qr",
    });
  } else if (qrRow.status !== "ACTIVATED" && qrRow.status !== "ACTIVE") {
    qrNode = "attention";
    attentionItems.push({
      id: `att-qr-stat-${v.id}`,
      severity: "AMBER",
      title: "QR Activation Pending",
      description: `Sticker status is ${qrRow.status}. Complete activation to verify emergency relay.`,
      actionLabel: "Verify QR",
      actionTarget: "qr",
    });
  }

  if (!profileRow) {
    safetyNode = "not_configured";
    attentionItems.push({
      id: `att-prof-${v.id}`,
      severity: "AMBER",
      title: "Safety View Incomplete",
      description: "Configure what first responders and finders see upon scanning.",
      actionLabel: "Configure Safety",
      actionTarget: "safety",
    });
  }

  if (contactRows.length === 0) {
    contactNode = "attention";
    attentionItems.push({
      id: `att-cnt-${v.id}`,
      severity: "RED",
      title: "Emergency Contact Missing",
      description: "Add at least one priority contact for instant Golden Hour SMS alerts.",
      actionLabel: "Add Contact",
      actionTarget: "contact",
    });
  }

  const isReady = attentionItems.length === 0;
  const maskedReg = maskVehicleRegistration(v.registration_number, { mode: "PARTIAL" });
  const identityCode = qrRow ? `VS-${qrRow.public_id}` : `VS-REG-${v.id.slice(-6).toUpperCase()}`;

  const contactsDetail: VehicleEmergencyContactDetail[] = contactRows.map((c) => ({
    id: c.id,
    name: c.name,
    relationship: c.relationship_label,
    phone: c.phone,
    phoneMasked: maskPhone(c.phone),
    priority: c.priority,
    isEnabled: c.is_enabled === 1,
    allowCall: c.allow_call === 1,
    allowMessage: c.allow_message === 1,
  }));

  const scansDetail: VehicleScanEventItem[] = scanRows.map((s) => ({
    id: s.id,
    scanType: s.scan_type,
    result: s.result,
    city: s.city,
    state: s.state,
    createdAt: s.created_at,
  }));

  return {
    id: v.id,
    registrationNumber: v.registration_number,
    registrationNumberNormalized: v.registration_number_normalized,
    registrationNumberMasked: maskedReg,
    make: v.make,
    model: v.model,
    variant: v.variant || undefined,
    year: v.year || undefined,
    color: v.color || undefined,
    type: (v.vehicle_type as VehicleCategory) || "CAR",
    status: v.status,
    createdAt: v.created_at,
    identityId: identityCode,
    emergencyProfileId: profileRow?.id,
    qr: {
      hasQr: Boolean(qrRow),
      publicId: qrRow?.public_id,
      status: (qrRow?.status as QrStatus) || "UNLINKED",
      assignedAt: qrRow?.assigned_at || undefined,
      replacementPending: Boolean(qrRow?.replacement_id),
      replacementStatus: qrRow?.replacement_status || undefined,
      replacementReason: qrRow?.replacement_reason || undefined,
    },
    safety: {
      isConfigured: Boolean(profileRow),
      status: profileRow ? "CONFIGURED" : "NEEDS_SETUP",
      showOwnerName: profileRow ? profileRow.show_owner_name === 1 : true,
      showBloodGroup: profileRow ? profileRow.show_blood_group === 1 : true,
      showMedicalNotes: profileRow ? profileRow.show_medical_notes === 1 : false,
      showVehicleDetails: profileRow ? profileRow.show_vehicle_details === 1 : true,
      bloodGroup: profileRow?.blood_group,
      medicalNotes: profileRow?.medical_notes,
    },
    contacts: {
      count: contactRows.length,
      primaryName: contactRows[0]?.name,
      primaryRelationship: contactRows[0]?.relationship_label,
    },
    readiness: {
      isReady,
      vehicleNode: "ready",
      identityNode: "ready",
      qrNode,
      safetyNode,
      contactNode,
    },
    attention: attentionItems,
    emergencyContacts: contactsDetail,
    recentScans: scansDetail,
    lifecycleHistory: milestones,
  };
}
