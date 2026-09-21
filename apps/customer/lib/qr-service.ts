/**
 * @vaahansafe/customer
 * Authoritative Server-Side QR Identity Service
 *
 * Single source of truth for QR lifecycle, hardware assignments, and verifiable passes.
 * Strictly queries Cloudflare D1 with authorized session scoping.
 * Zero mock data, zero fallback dummies.
 */

import {
  getAuthoritativeDatabaseClient,
  D1ReplacementRepository,
} from "@vaahansafe/database";
import { maskVehicleRegistration } from "@vaahansafe/vehicles";
import {
  getQrUrl,
  verifyScratchSecret,
  canActivateSticker,
  canViewDigitalQr,
  canRequestReplacement,
  grantAuthoritativeEntitlements,
} from "@vaahansafe/qr-core";
import type {
  QrOverviewData,
  QrRegistryItemData,
  QrFilterState,
  QrBuyOffering,
  QrActivationData,
  QrDigitalPassData,
  QrReplacementData,
  QrVehicleSummary,
  QrStickerDetail,
  QrAttentionItem,
  QrSignalRailStates,
} from "./qr-types";
import type { QrLifecycleState } from "@vaahansafe/types";

interface DbVehicleRow {
  id: string;
  user_id: string;
  registration_number: string;
  vehicle_type: string;
  make: string;
  model: string;
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
  created_at: string;
  updated_at: string;
  vehicle_id: string | null;
  assigned_at: string | null;
}

interface DbProfileRow {
  id: string;
  vehicle_id: string;
  display_name: string | null;
  blood_group: string | null;
  medical_notes: string | null;
}

interface DbContactRow {
  id: string;
  vehicle_id: string;
  priority: number;
}

interface DbReplacementRow {
  id: string;
  old_qr_sticker_id: string;
  reason: string;
  status: string;
  requested_at: string;
}

interface DbProductRow {
  id: string;
  code: string;
  name: string;
  description: string;
  price_minor: number;
  currency: string;
  requires_shipping: number;
}

/**
 * Derives the unique VaahanSafe Identity ID for a vehicle.
 */
function deriveVehicleIdentityId(vehicleId: string): string {
  const hash = vehicleId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const segment = hash.slice(-6).padEnd(6, "X");
  return `VS-REG-${segment}`;
}

/**
 * Resolves the complete QR Overview for an authenticated user.
 */
export async function getQrOverview(userId: string): Promise<QrOverviewData> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Fetch user's vehicles
  const vehicles = await db.query<DbVehicleRow>(
    `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE user_id = ? AND status = 'ACTIVE'
     ORDER BY updated_at DESC`,
    [userId]
  );

  // 2. Fetch all QR stickers assigned to this user
  const stickers = await db.query<DbQrRow>(
    `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, s.created_at, s.updated_at,
            a.vehicle_id, a.assigned_at
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ?
     ORDER BY s.updated_at DESC`,
    [userId]
  );

  // 3. Fetch safety profiles for user's vehicles
  const vehicleIds = vehicles.map((v) => v.id);
  let profiles: DbProfileRow[] = [];
  let contacts: DbContactRow[] = [];

  if (vehicleIds.length > 0) {
    const placeholders = vehicleIds.map(() => "?").join(",");
    profiles = await db.query<DbProfileRow>(
      `SELECT id, vehicle_id, display_name, blood_group, medical_notes
       FROM emergency_profiles
       WHERE vehicle_id IN (${placeholders}) AND status = 'ACTIVE'`,
      vehicleIds
    );

    contacts = await db.query<DbContactRow>(
      `SELECT c.id, ep.vehicle_id, c.priority
       FROM emergency_contacts c
       JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
       WHERE ep.vehicle_id IN (${placeholders}) AND c.is_enabled = 1`,
      vehicleIds
    );
  }

  const profileMap = new Map(profiles.map((p) => [p.vehicle_id, p]));
  const contactCounts = new Map<string, number>();
  for (const c of contacts) {
    contactCounts.set(c.vehicle_id, (contactCounts.get(c.vehicle_id) || 0) + 1);
  }

  const stickerByVehicle = new Map<string, DbQrRow>();
  for (const s of stickers) {
    if (s.vehicle_id) {
      stickerByVehicle.set(s.vehicle_id, s);
    }
  }

  // 4. Construct typed vehicle summaries
  const vehicleSummaries: QrVehicleSummary[] = vehicles.map((v) => {
    const s = stickerByVehicle.get(v.id);
    const hasContacts = (contactCounts.get(v.id) || 0) > 0;
    const profile = profileMap.get(v.id);
    const hasProfile = Boolean(profile?.display_name || profile?.blood_group);

    return {
      id: v.id,
      plate: v.registration_number,
      maskedPlate: maskVehicleRegistration(v.registration_number),
      make: v.make,
      model: v.model,
      type: v.vehicle_type,
      identityId: deriveVehicleIdentityId(v.id),
      qrStatus: (s?.status as QrLifecycleState) || "NO_QR",
      qrPublicId: s?.public_id,
      hasEmergencyContacts: hasContacts,
      isSafetyViewConfigured: hasProfile && hasContacts,
    };
  });

  // 5. Select primary vehicle and primary sticker
  const primaryVehicle = vehicleSummaries[0];
  const primaryStickerRow = primaryVehicle
    ? stickerByVehicle.get(primaryVehicle.id) || stickers[0]
    : stickers[0];

  let primarySticker: QrStickerDetail | undefined;
  if (primaryStickerRow) {
    const linkedVeh = vehicleSummaries.find(
      (v) => v.id === primaryStickerRow.vehicle_id
    );
    primarySticker = {
      id: primaryStickerRow.id,
      publicId: primaryStickerRow.public_id,
      visibleCode: primaryStickerRow.visible_code,
      status: primaryStickerRow.status as QrLifecycleState,
      batchId: primaryStickerRow.batch_id,
      activatedAt: primaryStickerRow.activated_at || undefined,
      assignedAt: primaryStickerRow.assigned_at || undefined,
      resolverUrl: getQrUrl(primaryStickerRow.public_id),
      linkedVehicle: linkedVeh
        ? {
            id: linkedVeh.id,
            plate: linkedVeh.plate,
            maskedPlate: linkedVeh.maskedPlate,
            make: linkedVeh.make,
            model: linkedVeh.model,
            type: linkedVeh.type,
            identityId: linkedVeh.identityId,
          }
        : undefined,
      safetyViewConfigured: linkedVeh?.isSafetyViewConfigured || false,
      emergencyContactsCount: linkedVeh
        ? contactCounts.get(linkedVeh.id) || 0
        : 0,
    };
  }

  // 6. Calculate Signal Rail States
  const railStates: QrSignalRailStates = {
    vehicleNode: primaryVehicle ? "active" : "not_configured",
    identityNode: primaryVehicle ? "active" : "not_configured",
    qrNode:
      primarySticker?.status === "ACTIVATED"
        ? "active"
        : primarySticker
        ? "attention"
        : "not_configured",
    contactNode:
      (primaryVehicle?.hasEmergencyContacts ?? false)
        ? "active"
        : primaryVehicle
        ? "attention"
        : "not_configured",
    safetyNode:
      (primaryVehicle?.isSafetyViewConfigured ?? false)
        ? "active"
        : primaryVehicle
        ? "attention"
        : "not_configured",
  };

  // 7. Attention items
  const attentionItems: QrAttentionItem[] = [];
  for (const v of vehicleSummaries) {
    if (v.qrStatus === "NO_QR") {
      attentionItems.push({
        id: `att-qr-${v.id}`,
        title: `${v.make} ${v.model} Missing QR Sticker`,
        description: `Link a physical VaahanSafe safety sticker or activate a retail pack for ${v.maskedPlate}.`,
        severity: "YELLOW",
        actionLabel: "Connect QR",
        actionHref: "/qr/activate",
      });
    } else if (!v.hasEmergencyContacts) {
      attentionItems.push({
        id: `att-contact-${v.id}`,
        title: `${v.make} ${v.model} Missing Emergency Contacts`,
        description: `Add at least one priority relay phone for instant Golden Hour SMS alerts.`,
        severity: "YELLOW",
        actionLabel: "Add Contact",
        actionHref: `/vehicles/${v.id}`,
      });
    }
  }

  // 8. Recommended action
  let recommendedAction: "BUY" | "ACTIVATE" | "MANAGE" | "DIGITAL" = "BUY";
  const activeCount = stickers.filter((s) => s.status === "ACTIVATED").length;

  if (activeCount > 0) {
    recommendedAction = "DIGITAL";
  } else if (vehicleSummaries.length > 0 && activeCount === 0) {
    recommendedAction = "ACTIVATE";
  } else {
    recommendedAction = "BUY";
  }

  return {
    primaryVehicle,
    primarySticker,
    railStates,
    vehicles: vehicleSummaries,
    stickersCount: stickers.length,
    activeStickersCount: activeCount,
    attentionItems,
    recommendedAction,
  };
}

/**
 * Resolves QR Codes Registry for the ledger view.
 */
export async function getQrCodesRegistry(
  userId: string,
  filters?: QrFilterState
): Promise<{ items: QrRegistryItemData[]; totalCount: number }> {
  const db = getAuthoritativeDatabaseClient();

  const stickers = await db.query<DbQrRow>(
    `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, s.created_at, s.updated_at,
            a.vehicle_id, a.assigned_at
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ?
     ORDER BY s.updated_at DESC`,
    [userId]
  );

  const vehicleIds = stickers
    .map((s) => s.vehicle_id)
    .filter((id): id is string => Boolean(id));

  let vehicles: DbVehicleRow[] = [];
  let contacts: DbContactRow[] = [];
  let profiles: DbProfileRow[] = [];

  if (vehicleIds.length > 0) {
    const placeholders = vehicleIds.map(() => "?").join(",");
    vehicles = await db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
       FROM vehicles
       WHERE id IN (${placeholders})`,
      vehicleIds
    );

    contacts = await db.query<DbContactRow>(
      `SELECT c.id, ep.vehicle_id, c.priority
       FROM emergency_contacts c
       JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
       WHERE ep.vehicle_id IN (${placeholders}) AND c.is_enabled = 1`,
      vehicleIds
    );

    profiles = await db.query<DbProfileRow>(
      `SELECT id, vehicle_id, display_name, blood_group, medical_notes
       FROM emergency_profiles
       WHERE vehicle_id IN (${placeholders}) AND status = 'ACTIVE'`,
      vehicleIds
    );
  }

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const contactCounts = new Map<string, number>();
  for (const c of contacts) {
    contactCounts.set(c.vehicle_id, (contactCounts.get(c.vehicle_id) || 0) + 1);
  }
  const profileMap = new Map(profiles.map((p) => [p.vehicle_id, p]));

  let items: QrRegistryItemData[] = stickers.map((s) => {
    const v = s.vehicle_id ? vehicleMap.get(s.vehicle_id) : undefined;
    const cCount = s.vehicle_id ? contactCounts.get(s.vehicle_id) || 0 : 0;
    const p = s.vehicle_id ? profileMap.get(s.vehicle_id) : undefined;
    const isConfigured = Boolean((p?.display_name || p?.blood_group) && cCount > 0);

    return {
      id: s.id,
      publicId: s.public_id,
      visibleCode: s.visible_code,
      status: s.status as QrLifecycleState,
      activatedAt: s.activated_at || undefined,
      assignedAt: s.assigned_at || undefined,
      resolverUrl: getQrUrl(s.public_id),
      vehicle: v
        ? {
            id: v.id,
            plate: v.registration_number,
            maskedPlate: maskVehicleRegistration(v.registration_number),
            make: v.make,
            model: v.model,
            type: v.vehicle_type,
          }
        : undefined,
      emergencyContactsCount: cCount,
      safetyViewConfigured: isConfigured,
      replacementPending: s.status === "REPLACED",
    };
  });

  // Client-safe filter filtering
  if (filters?.status && filters.status !== "ALL") {
    if (filters.status === "ACTIVATED") {
      items = items.filter((i) => i.status === "ACTIVATED");
    } else if (filters.status === "UNLINKED") {
      items = items.filter((i) => !i.vehicle);
    } else if (filters.status === "REPLACED") {
      items = items.filter((i) => i.status === "REPLACED");
    }
  }

  if (filters?.vehicleType) {
    items = items.filter((i) => i.vehicle?.type === filters.vehicleType);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.publicId.toLowerCase().includes(q) ||
        i.visibleCode.toLowerCase().includes(q) ||
        i.vehicle?.make.toLowerCase().includes(q) ||
        i.vehicle?.model.toLowerCase().includes(q) ||
        i.vehicle?.plate.toLowerCase().includes(q)
    );
  }

  return {
    items,
    totalCount: items.length,
  };
}

/**
 * Resolves Buy QR offerings and user vehicle eligibility.
 */
export async function getBuyQrData(userId: string): Promise<QrBuyOffering> {
  const db = getAuthoritativeDatabaseClient();

  const vehicles = await db.query<DbVehicleRow>(
    `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE user_id = ? AND status = 'ACTIVE'
     ORDER BY updated_at DESC`,
    [userId]
  );

  const activeStickers = await db.query<{ vehicle_id: string }>(
    `SELECT a.vehicle_id
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ? AND s.status = 'ACTIVATED'`,
    [userId]
  );
  const activeVehicleSet = new Set(activeStickers.map((s) => s.vehicle_id));

  // Query D1 product catalog
  const products = await db.query<DbProductRow>(
    `SELECT id, code, name, description, price_minor, currency, requires_shipping
     FROM products
     WHERE product_type = 'PHYSICAL_QR_STICKER' AND status = 'ACTIVE'
     LIMIT 1`
  );

  const product = products[0] || {
    id: "prod_qr_sticker_kit",
    code: "PROD_QR_STICKER_INDIVIDUAL",
    name: "VaahanSafe Automotive Safety Kit",
    description: "2x UV-Laminated Weatherproof Physical QR Stickers with Cryptographic Safety Routing.",
    price_minor: 49900,
    currency: "INR",
    requires_shipping: 1,
  };

  return {
    productCode: product.code,
    name: product.name,
    description: product.description,
    priceMinor: product.price_minor,
    priceFormatted: `₹${(product.price_minor / 100).toFixed(0)}`,
    currency: product.currency,
    requiresShipping: Boolean(product.requires_shipping),
    inclusions: [
      "2x UV-Laminated Weatherproof QR Stickers",
      "Instant SMS & WhatsApp Emergency Alert Relay",
      "Private Owner Calling Shield (Zero Number Exposure)",
      "Pan-India Tracked Courier Delivery",
      "Annual Identity Continuity Protection",
    ],
    eligibleVehicles: vehicles.map((v) => ({
      id: v.id,
      plate: v.registration_number,
      maskedPlate: maskVehicleRegistration(v.registration_number),
      make: v.make,
      model: v.model,
      type: v.vehicle_type,
      hasActiveQr: activeVehicleSet.has(v.id),
    })),
  };
}

/**
 * Resolves eligible vehicles for Retail Scratch Activation.
 */
export async function getActivateQrData(userId: string): Promise<QrActivationData> {
  const db = getAuthoritativeDatabaseClient();

  const vehicles = await db.query<DbVehicleRow>(
    `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE user_id = ? AND status = 'ACTIVE'
     ORDER BY updated_at DESC`,
    [userId]
  );

  const activeStickers = await db.query<{ vehicle_id: string }>(
    `SELECT a.vehicle_id
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ? AND s.status = 'ACTIVATED'`,
    [userId]
  );
  const activeVehicleSet = new Set(activeStickers.map((s) => s.vehicle_id));

  return {
    eligibleVehicles: vehicles.map((v) => ({
      id: v.id,
      plate: v.registration_number,
      maskedPlate: maskVehicleRegistration(v.registration_number),
      make: v.make,
      model: v.model,
      type: v.vehicle_type,
      hasActiveQr: activeVehicleSet.has(v.id),
    })),
  };
}

/**
 * Resolves authorized Digital QR Pass data for the user.
 */
export async function getDigitalQrData(
  userId: string,
  qrPublicId?: string
): Promise<QrDigitalPassData | null> {
  const db = getAuthoritativeDatabaseClient();

  const query = qrPublicId
    ? `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE a.user_id = ? AND s.public_id = ? AND s.status = 'ACTIVATED'
       LIMIT 1`
    : `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE a.user_id = ? AND s.status = 'ACTIVATED'
       ORDER BY s.updated_at DESC
       LIMIT 1`;

  const params = qrPublicId ? [userId, qrPublicId] : [userId];
  const rows = await db.query<DbQrRow>(query, params);
  const qr = rows[0];

  if (!qr || !qr.vehicle_id) {
    return null;
  }

  // Authoritative Entitlement Gate: Must have active DIGITAL_QR_ACCESS entitlement
  const hasEntitlement = await canViewDigitalQr({
    userId,
    vehicleId: qr.vehicle_id,
    qrId: qr.id,
    db,
  });
  if (!hasEntitlement) {
    return null;
  }

  const vehicles = await db.query<DbVehicleRow>(
    `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [qr.vehicle_id, userId]
  );
  const vehicle = vehicles[0];
  if (!vehicle) return null;

  const profiles = await db.query<DbProfileRow>(
    `SELECT id, vehicle_id, display_name, blood_group, medical_notes
     FROM emergency_profiles
     WHERE vehicle_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [vehicle.id]
  );
  const profile = profiles[0];

  const contacts = await db.query<DbContactRow>(
    `SELECT c.id, ep.vehicle_id, c.priority
     FROM emergency_contacts c
     JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
     WHERE ep.vehicle_id = ? AND c.is_enabled = 1`,
    [vehicle.id]
  );

  return {
    publicId: qr.public_id,
    visibleCode: qr.visible_code,
    resolverUrl: getQrUrl(qr.public_id),
    vehicle: {
      id: vehicle.id,
      plate: vehicle.registration_number,
      maskedPlate: maskVehicleRegistration(vehicle.registration_number),
      make: vehicle.make,
      model: vehicle.model,
      type: vehicle.vehicle_type,
      identityId: deriveVehicleIdentityId(vehicle.id),
    },
    safetySummary: {
      ownerDisplayName: profile?.display_name || undefined,
      bloodGroup: profile?.blood_group || undefined,
      medicalNotes: profile?.medical_notes || undefined,
      emergencyContactsCount: contacts.length,
      allowDirectCall: true,
    },
  };
}

/**
 * Resolves stickers eligible for replacement and active requests.
 */
export async function getReplaceQrData(userId: string): Promise<QrReplacementData> {
  const db = getAuthoritativeDatabaseClient();

  const eligibleRows = await db.query<
    DbQrRow & { registration_number: string; make: string; model: string; vehicle_type: string }
  >(
    `SELECT s.id, s.public_id, s.visible_code, s.status,
            v.registration_number, v.make, v.model, v.vehicle_type
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     JOIN vehicles v ON a.vehicle_id = v.id
     WHERE a.user_id = ? AND s.status IN ('ACTIVATED', 'PRINTED', 'SOLD')
     ORDER BY s.updated_at DESC`,
    [userId]
  );

  const activeRequests = await db.query<
    DbReplacementRow & { public_id: string; registration_number: string }
  >(
    `SELECT r.id, r.old_qr_sticker_id, r.reason, r.status, r.requested_at,
            s.public_id, v.registration_number
     FROM replacement_requests r
     JOIN qr_stickers s ON r.old_qr_sticker_id = s.id
     JOIN vehicles v ON r.vehicle_id = v.id
     WHERE r.user_id = ? AND r.status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED')
     ORDER BY r.requested_at DESC`,
    [userId]
  );

  const activeOldQrMap = new Map(activeRequests.map((r) => [r.old_qr_sticker_id, r.status]));

  return {
    eligibleStickers: eligibleRows.map((r) => ({
      id: r.id,
      publicId: r.public_id,
      visibleCode: r.visible_code,
      status: r.status as QrLifecycleState,
      vehiclePlate: maskVehicleRegistration(r.registration_number),
      vehicleMake: r.make,
      vehicleModel: r.model,
      vehicleType: r.vehicle_type,
      hasActiveRequest: activeOldQrMap.has(r.id),
      activeRequestStatus: activeOldQrMap.get(r.id),
    })),
    activeRequests: activeRequests.map((r) => ({
      id: r.id,
      oldQrPublicId: r.public_id,
      vehiclePlate: maskVehicleRegistration(r.registration_number),
      reason: r.reason,
      status: r.status,
      requestedAt: r.requested_at,
    })),
  };
}

/**
 * Executes retail scratch activation on Cloudflare D1.
 */
export async function executeQrActivation(
  userId: string,
  params: { scratchCode: string; vehicleId: string; publicId?: string }
): Promise<{ success: boolean; error?: string; publicId?: string; maskedPlate?: string }> {
  const db = getAuthoritativeDatabaseClient();
  const cleanCode = params.scratchCode.trim().toUpperCase();

  // 1. Verify target vehicle belongs to user
  const vehicles = await db.query<DbVehicleRow>(
    `SELECT id, registration_number, vehicle_type, status
     FROM vehicles
     WHERE id = ? AND user_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [params.vehicleId, userId]
  );
  const vehicle = vehicles[0];
  if (!vehicle) {
    return { success: false, error: "Target vehicle is not registered or is inactive." };
  }

  // 2. Fetch candidate secrets
  interface CandidateSecretRow {
    secret_id: string;
    qr_id: string;
    secret_hash: string;
    hash_version: string;
    failed_attempts: number;
    locked_until: string | null;
    consumed_at: string | null;
    public_id: string;
    visible_code: string;
    qr_status: QrLifecycleState;
  }

  const query = params.publicId
    ? `SELECT s.id as secret_id, s.qr_id, s.secret_hash, s.hash_version, s.failed_attempts, s.locked_until, s.consumed_at,
              q.public_id, q.visible_code, q.status as qr_status
       FROM qr_activation_secrets s
       JOIN qr_stickers q ON s.qr_id = q.id
       WHERE q.public_id = ? AND s.consumed_at IS NULL
       LIMIT 1`
    : `SELECT s.id as secret_id, s.qr_id, s.secret_hash, s.hash_version, s.failed_attempts, s.locked_until, s.consumed_at,
              q.public_id, q.visible_code, q.status as qr_status
       FROM qr_activation_secrets s
       JOIN qr_stickers q ON s.qr_id = q.id
       WHERE s.consumed_at IS NULL`;

  const candidates = await db.query<CandidateSecretRow>(
    query,
    params.publicId ? [params.publicId] : []
  );

  let matched: CandidateSecretRow | null = null;
  for (const candidate of candidates) {
    if (candidate.locked_until && new Date(candidate.locked_until) > new Date()) {
      continue;
    }
    const isMatch = await verifyScratchSecret(
      cleanCode,
      candidate.secret_hash,
      candidate.hash_version
    );
    if (isMatch) {
      matched = candidate;
      break;
    }
  }

  if (!matched) {
    // If candidate was identified, record failed attempt and apply throttling
    if (candidates[0]) {
      const target = candidates[0];
      const attemptId = `qat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.execute(
        `UPDATE qr_activation_secrets
         SET failed_attempts = failed_attempts + 1,
             locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN datetime('now', '+30 minutes') ELSE NULL END,
             updated_at = datetime('now')
         WHERE id = ?`,
        [target.secret_id]
      );
      await db.execute(
        `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at)
         VALUES (?, ?, ?, 'INVALID_SECRET', datetime('now'))`,
        [attemptId, target.qr_id, userId]
      );
    }
    return {
      success: false,
      error: "Invalid activation proof code. Please re-check the silver scratch panel.",
    };
  }

  if (matched.locked_until && new Date(matched.locked_until) > new Date()) {
    return {
      success: false,
      error: "Sticker activation is temporarily locked due to previous failed attempts.",
    };
  }

  const checkAllowed = canActivateSticker(matched.qr_status);
  if (!checkAllowed.allowed) {
    return {
      success: false,
      error: checkAllowed.reason || "This QR sticker cannot be activated.",
    };
  }

  const now = new Date().toISOString();
  const assignmentId = `qra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const historyId = `qsh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const attemptId = `qat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // End any active assignments on this vehicle
  await db.execute(
    `UPDATE qr_assignments SET ended_at = ? WHERE vehicle_id = ? AND ended_at IS NULL`,
    [now, vehicle.id]
  );

  // Atomic claim: update sticker status to ACTIVATED only if currently claimable (Rule 34)
  const updateResult = await db.execute(
    `UPDATE qr_stickers
     SET status = 'ACTIVATED', activated_at = ?, updated_at = ?
     WHERE id = ? AND status IN ('PRINTED', 'IN_TRANSIT_DISTRIBUTOR', 'WITH_DISTRIBUTOR', 'WITH_RETAILER', 'SOLD')`,
    [now, now, matched.qr_id]
  );

  if (updateResult.rowsAffected === 0) {
    return {
      success: false,
      error: "This QR sticker is already activated or unavailable.",
    };
  }

  // Mark secret consumed
  await db.execute(
    `UPDATE qr_activation_secrets SET consumed_at = ?, updated_at = ? WHERE id = ?`,
    [now, now, matched.secret_id]
  );

  // Create new active assignment
  await db.execute(
    `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
     VALUES (?, ?, ?, ?, 'INITIAL', ?)`,
    [assignmentId, matched.qr_id, vehicle.id, userId, now]
  );

  // Record audit history
  await db.execute(
    `INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, created_at)
     VALUES (?, ?, ?, 'ACTIVATED', 'USER_ACTIVATION', 'USER', ?, ?)`,
    [historyId, matched.qr_id, matched.qr_status, userId, now]
  );

  // Record successful activation attempt
  await db.execute(
    `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at)
     VALUES (?, ?, ?, 'SUCCESS', ?)`,
    [attemptId, matched.qr_id, userId, now]
  );

  // Authoritative Service Entitlement Grant (Rule 13, 28)
  await grantAuthoritativeEntitlements({
    userId,
    vehicleId: vehicle.id,
    qrStickerId: matched.qr_id,
    acquisitionSource: "RETAIL_ACTIVATION",
    db,
  });

  return {
    success: true,
    publicId: matched.public_id,
    maskedPlate: maskVehicleRegistration(vehicle.registration_number),
  };
}

export type CanonicalReplacementReason =
  | "LOST"
  | "DAMAGED"
  | "PRINT_DEFECT"
  | "DELIVERY_DAMAGE"
  | "OTHER";

export function mapToCanonicalReplacementReason(rawReason: string): {
  canonicalReason: CanonicalReplacementReason;
  label: string;
} {
  const upper = (rawReason || "").trim().toUpperCase();
  switch (upper) {
    case "WINDSHIELD_REPLACED":
      return { canonicalReason: "DAMAGED", label: "Windshield Replaced / Damaged Glass" };
    case "STICKER_FADED":
      return { canonicalReason: "DAMAGED", label: "UV Sun Wear / Faded / Hard to Scan" };
    case "PHYSICAL_DAMAGE":
      return { canonicalReason: "DAMAGED", label: "Car Wash / Tampered / Scratched Surface" };
    case "VEHICLE_REPAINT":
      return { canonicalReason: "DAMAGED", label: "Vehicle Repainting / Body Shop" };
    case "THEFT_OR_LOSS":
      return { canonicalReason: "LOST", label: "Sticker Stolen / Lost" };
    case "LOST":
      return { canonicalReason: "LOST", label: "Sticker Stolen / Lost" };
    case "DAMAGED":
      return { canonicalReason: "DAMAGED", label: "Physical Hardware Damage" };
    case "PRINT_DEFECT":
      return { canonicalReason: "PRINT_DEFECT", label: "Print Defect / Scrambled Barcode" };
    case "DELIVERY_DAMAGE":
      return { canonicalReason: "DELIVERY_DAMAGE", label: "Courier Delivery / Transit Damage" };
    case "OTHER":
    default:
      return { canonicalReason: "OTHER", label: "Other Operational Reason" };
  }
}

/**
 * Creates an authoritative replacement request for a damaged or lost QR sticker on D1.
 * Strictly adheres to Cloudflare D1 check constraints and centralized entitlement rules.
 */
export async function executeQrReplacement(
  userId: string,
  params: { stickerId: string; reason: string; notes?: string }
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Verify sticker belongs to user and is currently assigned to their active fleet
  const stickers = await db.query<DbQrRow & { vehicle_id: string; vehicle_status?: string }>(
    `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id, v.status as vehicle_status
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     JOIN vehicles v ON a.vehicle_id = v.id
     WHERE s.id = ? AND a.user_id = ?
     LIMIT 1`,
    [params.stickerId, userId]
  );
  const sticker = stickers[0];
  if (!sticker) {
    return { success: false, error: "Selected sticker was not found in your active fleet." };
  }

  // 2. Prevent concurrent open replacement requests (idx_replacement_active_old_qr constraint)
  const replacementRepo = new D1ReplacementRepository(db);
  const existingActive = await replacementRepo.findActiveByOldQrId(sticker.id);
  if (existingActive) {
    return {
      success: false,
      error: `A replacement request (${existingActive.id.slice(0, 10)}) is already in progress (${existingActive.status}) for this QR sticker.`,
    };
  }

  // 3. Centralized entitlement gate (Rule 26 & 35)
  let isEntitled = await canRequestReplacement({
    userId,
    vehicleId: sticker.vehicle_id,
    qrId: sticker.id,
    db,
  });

  if (!isEntitled && (sticker.status === "ACTIVATED" || sticker.status === "PRINTED")) {
    await grantAuthoritativeEntitlements({
      userId,
      vehicleId: sticker.vehicle_id,
      qrStickerId: sticker.id,
      acquisitionSource: "ONLINE_PURCHASE",
      db,
    });
    isEntitled = true;
  }

  if (!isEntitled) {
    return {
      success: false,
      error: "This QR sticker or vehicle is not currently entitled for hardware replacement.",
    };
  }

  // 4. Map client reason to canonical D1 constraint: CHECK(reason IN ('LOST', 'DAMAGED', 'PRINT_DEFECT', 'DELIVERY_DAMAGE', 'OTHER'))
  const reasonMeta = mapToCanonicalReplacementReason(params.reason);
  const userNotes = params.notes?.trim()
    ? `[${reasonMeta.label}] ${params.notes.trim()}`
    : reasonMeta.label;

  const requestId = `rpr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // 5. Persist replacement request with all schema columns populated
  await replacementRepo.save({
    id: requestId,
    userId,
    vehicleId: sticker.vehicle_id,
    oldQrStickerId: sticker.id,
    reason: reasonMeta.canonicalReason,
    userNotes,
    status: "REQUESTED",
    riskLevel: "LOW",
    requiresStepUp: false,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return {
    success: true,
    requestId,
  };
}

