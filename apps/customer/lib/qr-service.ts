/**
 * @vaahansafe/customer
 * Authoritative Server-Side QR Identity Service
 *
 * Single source of truth for QR lifecycle, hardware assignments, and verifiable passes.
 * Queries the authoritative database with authorized session scoping.
 * Zero mock data, zero fallback dummies.
 */

import {
  getAuthoritativeDatabaseClient,
  createInAppNotification,
} from "@vaahansafe/database";
import { maskVehicleRegistration } from "@vaahansafe/vehicles";
import {
  ALL_ENTITLEMENT_CAPABILITIES,
  getQrUrl,
  verifyScratchSecret,
  activationQrLookup,
  normalizeActivationProofInput,
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
  slot?: number;
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
  const [vehicles, stickers] = await Promise.all([
    db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE user_id = ? AND status = 'ACTIVE'
     ORDER BY updated_at DESC`,
      [userId],
    ),
    db.query<DbQrRow>(
      `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, s.created_at, s.updated_at,
            a.vehicle_id, a.assigned_at
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ?
     ORDER BY s.updated_at DESC`,
      [userId],
    ),
  ]);

  // 2. Fetch all QR stickers assigned to this user

  // 3. Fetch safety profiles for user's vehicles
  const vehicleIds = vehicles.map((v) => v.id);
  let profiles: DbProfileRow[] = [];
  let contacts: DbContactRow[] = [];

  if (vehicleIds.length > 0) {
    const placeholders = vehicleIds.map(() => "?").join(",");
    [profiles, contacts] = await Promise.all([
      db.query<DbProfileRow>(
        `SELECT id, vehicle_id, display_name, blood_group, medical_notes
       FROM emergency_profiles
       WHERE vehicle_id IN (${placeholders}) AND status = 'ACTIVE'`,
        vehicleIds,
      ),
      db.query<DbContactRow>(
        `SELECT c.id, ep.vehicle_id, c.priority
       FROM emergency_contacts c
       JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
       WHERE ep.vehicle_id IN (${placeholders}) AND c.is_enabled = 1`,
        vehicleIds,
      ),
    ]);
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
      (v) => v.id === primaryStickerRow.vehicle_id,
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
      attachedVehicleCount: stickers.filter((s) => s.id === primaryStickerRow.id).length,
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
  const activeCount = new Set(stickers.filter((s) => s.status === "ACTIVATED").map((s) => s.id)).size;

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
    stickersCount: new Set(stickers.map((s) => s.id)).size,
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
  filters?: QrFilterState,
): Promise<{ items: QrRegistryItemData[]; totalCount: number; availableVehicles: Array<{ id: string; label: string }> }> {
  const db = getAuthoritativeDatabaseClient();

  const stickers = await db.query<DbQrRow>(
    `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, s.created_at, s.updated_at,
            a.vehicle_id, a.assigned_at, a.slot
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ?
     ORDER BY s.updated_at DESC, s.id, a.slot`,
    [userId],
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
       WHERE user_id = ? AND status = 'ACTIVE' AND id IN (${placeholders})`,
      [userId, ...vehicleIds],
    );

    contacts = await db.query<DbContactRow>(
      `SELECT c.id, ep.vehicle_id, c.priority
       FROM emergency_contacts c
       JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
       WHERE ep.vehicle_id IN (${placeholders}) AND c.is_enabled = 1`,
      vehicleIds,
    );

    profiles = await db.query<DbProfileRow>(
      `SELECT id, vehicle_id, display_name, blood_group, medical_notes
       FROM emergency_profiles
       WHERE vehicle_id IN (${placeholders}) AND status = 'ACTIVE'`,
      vehicleIds,
    );
  }

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const contactCounts = new Map<string, number>();
  for (const c of contacts) {
    contactCounts.set(c.vehicle_id, (contactCounts.get(c.vehicle_id) || 0) + 1);
  }
  const profileMap = new Map(profiles.map((p) => [p.vehicle_id, p]));

  const bySticker = new Map<string, QrRegistryItemData>();
  for (const s of stickers) {
    const v = s.vehicle_id ? vehicleMap.get(s.vehicle_id) : undefined;
    const cCount = s.vehicle_id ? contactCounts.get(s.vehicle_id) || 0 : 0;
    const p = s.vehicle_id ? profileMap.get(s.vehicle_id) : undefined;
    const isConfigured = Boolean(
      (p?.display_name || p?.blood_group) && cCount > 0,
    );

    const vehicle = v && {
      id: v.id, plate: v.registration_number,
      maskedPlate: maskVehicleRegistration(v.registration_number),
      make: v.make, model: v.model, type: v.vehicle_type, secondary: s.slot === 2,
    };
    const item = bySticker.get(s.id);
    if (item) {
      if (vehicle) item.vehicles.push(vehicle);
      item.emergencyContactsCount += cCount;
      item.safetyViewConfigured &&= isConfigured;
      continue;
    }
    bySticker.set(s.id, {
      id: s.id,
      publicId: s.public_id,
      visibleCode: s.visible_code,
      status: s.status as QrLifecycleState,
      activatedAt: s.activated_at || undefined,
      assignedAt: s.assigned_at || undefined,
      resolverUrl: getQrUrl(s.public_id),
      vehicles: vehicle ? [vehicle] : [],
      emergencyContactsCount: cCount,
      safetyViewConfigured: isConfigured,
      replacementPending: s.status === "REPLACED",
    });
  }
  let items = [...bySticker.values()];

  // Client-safe filter filtering
  if (filters?.status && filters.status !== "ALL") {
    if (filters.status === "ACTIVATED") {
      items = items.filter((i) => i.status === "ACTIVATED");
    } else if (filters.status === "UNLINKED") {
      items = items.filter((i) => !i.vehicles.length);
    } else if (filters.status === "REPLACED") {
      items = items.filter((i) => i.status === "REPLACED");
    }
  }

  if (filters?.vehicleType) {
    items = items.filter((i) => i.vehicles.some((v) => v.type === filters.vehicleType));
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.publicId.toLowerCase().includes(q) ||
        i.visibleCode.toLowerCase().includes(q) ||
        i.vehicles.some((v) => [v.make, v.model, v.plate].some((value) => value.toLowerCase().includes(q))),
    );
  }

  const availableVehicles = await db.query<{ id: string; label: string }>(
    `SELECT v.id, v.registration_number || ' · ' || v.make || ' ' || v.model AS label
     FROM vehicles v WHERE v.user_id=? AND v.status='ACTIVE' AND v.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM qr_assignments a WHERE a.vehicle_id=v.id AND a.ended_at IS NULL)
     ORDER BY v.registration_number`,
    [userId],
  );
  return {
    items,
    totalCount: items.length,
    availableVehicles,
  };
}

/** Candidates for attaching an unassigned vehicle; the write RPC rechecks eligibility atomically. */
export async function getLinkableQrs(userId: string, vehicleId: string) {
  return getAuthoritativeDatabaseClient().query<{
    id: string;
    visible_code: string;
    registration_number: string;
  }>(
    `SELECT s.id, s.visible_code, primary_vehicle.registration_number
     FROM vehicles target
     JOIN qr_assignments a ON a.user_id = target.user_id AND a.slot = 1 AND a.ended_at IS NULL
     JOIN vehicles primary_vehicle ON primary_vehicle.id = a.vehicle_id AND primary_vehicle.user_id = a.user_id
     JOIN qr_stickers s ON s.id = a.qr_id AND s.status = 'ACTIVATED'
     WHERE target.id = ? AND target.user_id = ? AND target.status = 'ACTIVE' AND target.deleted_at IS NULL
       AND primary_vehicle.status = 'ACTIVE' AND primary_vehicle.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM qr_assignments current_assignment
         WHERE current_assignment.vehicle_id = target.id AND current_assignment.ended_at IS NULL)
       AND NOT EXISTS (SELECT 1 FROM qr_assignments secondary
         WHERE secondary.qr_id = s.id AND secondary.slot = 2 AND secondary.ended_at IS NULL)
       AND NOT EXISTS (SELECT 1 FROM replacement_requests r
         WHERE r.old_qr_sticker_id = s.id AND r.status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED'))
       AND EXISTS (SELECT 1 FROM service_entitlements e
         WHERE e.qr_sticker_id = s.id AND e.vehicle_id = a.vehicle_id AND e.user_id = a.user_id
           AND e.capability = 'SAFETY_VIEW_ACTIVE' AND e.status = 'ENABLED' AND e.verified_at IS NOT NULL
           AND (e.expires_at IS NULL OR e.expires_at > CURRENT_TIMESTAMP))
     ORDER BY s.visible_code, s.id`,
    [vehicleId, userId],
  );
}

/** Resolves Buy QR offerings and user vehicle eligibility. */
export async function getBuyQrData(userId: string): Promise<QrBuyOffering> {
  const db = getAuthoritativeDatabaseClient();

  const [vehicles, activeStickers, products] = await Promise.all([
    db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE user_id = ? AND status = 'ACTIVE'
     ORDER BY updated_at DESC`,
      [userId],
    ),
    db.query<{ vehicle_id: string }>(
      `SELECT a.vehicle_id
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.user_id = ? AND s.status = 'ACTIVATED'`,
      [userId],
    ),
    db.query<DbProductRow>(
      `SELECT id, code, name, description, price_minor, currency, requires_shipping
     FROM products
     WHERE product_type = 'PHYSICAL_QR_STICKER' AND status = 'ACTIVE'
     LIMIT 1`,
    ),
  ]);

  const activeVehicleSet = new Set(activeStickers.map((s) => s.vehicle_id));

  // Query D1 product catalog

  const product = products[0];
  if (!product) throw new Error("QR product catalog is unavailable");

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
export async function getActivateQrData(
  userId: string,
): Promise<QrActivationData> {
  const db = getAuthoritativeDatabaseClient();

  const [vehicles, activeStickers] = await Promise.all([
    db.query<DbVehicleRow>(
      `SELECT id, user_id, registration_number, vehicle_type, make, model, status, created_at, updated_at
     FROM vehicles
     WHERE user_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
      [userId],
    ),
    db.query<{ vehicle_id: string }>(
      `SELECT a.vehicle_id
     FROM qr_assignments a
     WHERE a.user_id = ? AND a.ended_at IS NULL`,
      [userId],
    ),
  ]);

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
  qrPublicId?: string,
): Promise<QrDigitalPassData | null> {
  const db = getAuthoritativeDatabaseClient();

  const query = qrPublicId
    ? `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE a.user_id = ? AND s.public_id = ? AND s.status = 'ACTIVATED' AND a.slot = 1
       LIMIT 1`
    : `SELECT s.id, s.public_id, s.visible_code, s.status, a.vehicle_id
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
       WHERE a.user_id = ? AND s.status = 'ACTIVATED' AND a.slot = 1
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
    [qr.vehicle_id, userId],
  );
  const vehicle = vehicles[0];
  if (!vehicle) return null;

  const profiles = await db.query<DbProfileRow>(
    `SELECT id, vehicle_id, display_name, blood_group, medical_notes
     FROM emergency_profiles
     WHERE vehicle_id = ? AND status = 'ACTIVE'
     LIMIT 1`,
    [vehicle.id],
  );
  const profile = profiles[0];

  const contacts = await db.query<DbContactRow>(
    `SELECT c.id, ep.vehicle_id, c.priority
     FROM emergency_contacts c
     JOIN emergency_profiles ep ON c.emergency_profile_id = ep.id
     WHERE ep.vehicle_id = ? AND c.is_enabled = 1`,
    [vehicle.id],
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
export async function getReplaceQrData(
  userId: string,
): Promise<QrReplacementData> {
  const db = getAuthoritativeDatabaseClient();
  const nowSql = db.dialect === "postgres" ? "CURRENT_TIMESTAMP" : "datetime('now')";

  const eligibleRows = await db.query<
    DbQrRow & {
      registration_number: string;
      make: string;
      model: string;
      vehicle_type: string;
    }
  >(
    `SELECT s.id, s.public_id, s.visible_code, s.status,
            v.registration_number, v.make, v.model, v.vehicle_type
     FROM qr_stickers s
     JOIN qr_assignments a ON s.id = a.qr_id AND a.ended_at IS NULL
     JOIN vehicles v ON a.vehicle_id = v.id
     WHERE a.user_id = ? AND v.user_id = a.user_id AND v.status = 'ACTIVE' AND s.status = 'ACTIVATED' AND EXISTS (SELECT 1 FROM service_entitlements e WHERE e.qr_sticker_id=s.id AND e.vehicle_id=v.id AND e.user_id=a.user_id AND e.capability='REPLACEMENT_ELIGIBLE' AND e.status='ENABLED' AND (e.expires_at IS NULL OR e.expires_at>${nowSql}))
       AND a.slot=1 AND NOT EXISTS (SELECT 1 FROM qr_assignments shared WHERE shared.qr_id=s.id AND shared.slot=2 AND shared.ended_at IS NULL)
     ORDER BY s.updated_at DESC,s.id DESC LIMIT 100`,
    [userId],
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
     ORDER BY r.requested_at DESC,r.id DESC LIMIT 100`,
    [userId],
  );

  const activeOldQrMap = new Map(
    activeRequests.map((r) => [r.old_qr_sticker_id, r.status]),
  );

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
 * Verifies retail activation proof before claiming an unassigned vehicle.
 */
export async function executeQrActivation(
  userId: string,
  params: { scratchCode: string; vehicleId: string; publicId: string },
): Promise<{
  success: boolean;
  error?: string;
  publicId?: string;
  maskedPlate?: string;
}> {
  const db = getAuthoritativeDatabaseClient();
  const cleanCode = normalizeActivationProofInput(params.scratchCode);
  const { publicId, visibleCode } = activationQrLookup(params.publicId);

  // 1. Verify target vehicle belongs to user
  const vehicles = await db.query<DbVehicleRow>(
    `SELECT id, registration_number, vehicle_type, status
     FROM vehicles
     WHERE id = ? AND user_id = ? AND status = 'ACTIVE' AND deleted_at IS NULL
     LIMIT 1`,
    [params.vehicleId, userId],
  );
  const vehicle = vehicles[0];
  if (!vehicle) {
    return {
      success: false,
      error: "Target vehicle is not registered or is inactive.",
    };
  }

  // 2. Fetch candidate secrets
  interface CandidateSecretRow {
    secret_id: string;
    qr_id: string;
    secret_hash: string;
    hash_version: string;
    locked_until: string | null;
    public_id: string;
    qr_status: QrLifecycleState;
  }

  const candidates = await db.query<CandidateSecretRow>(
    `SELECT s.id as secret_id, s.qr_id, s.secret_hash, s.hash_version, s.locked_until,
            q.public_id, q.status as qr_status
     FROM qr_activation_secrets s JOIN qr_stickers q ON s.qr_id = q.id
     WHERE (q.public_id = ? OR q.visible_code = ?) AND q.status = 'SOLD' AND s.consumed_at IS NULL
     LIMIT 2`,
    [publicId, visibleCode],
  );
  const invalidProof = {
    success: false,
    error: "We couldn't verify this sticker. Check the sticker ID and scratch code on the same pack, or try again later.",
  };
  const matched = candidates.length === 1 ? candidates[0] : undefined;
  const nowMs = Date.now();
  if (!matched || (matched.locked_until && new Date(matched.locked_until).getTime() > nowMs)) return invalidProof;

  if (!(await verifyScratchSecret(cleanCode, matched.secret_hash, matched.hash_version))) {
    const attemptedAt = new Date(nowMs).toISOString();
    await db.batch([
      {
        sql: `UPDATE qr_activation_secrets
              SET failed_attempts = failed_attempts + 1,
                  locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN COALESCE(?, locked_until) ELSE NULL END, updated_at = ?
              WHERE id = ? AND consumed_at IS NULL AND (locked_until IS NULL OR locked_until <= ?)`,
        params: [new Date(nowMs + 30 * 60_000).toISOString(), attemptedAt, matched.secret_id, attemptedAt],
      },
      {
        sql: `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at)
              VALUES (?, ?, ?, 'INVALID_SECRET', ?)`,
        params: ["qat_" + crypto.randomUUID(), matched.qr_id, userId, attemptedAt],
      },
    ]);
    return invalidProof;
  }

  const now = new Date().toISOString();
  const assignmentId = `qra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const historyId = `qsh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const attemptId = `qat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const activeAssignment = await db.queryFirst<{ id: string }>(
    "SELECT id FROM qr_assignments WHERE vehicle_id = ? AND ended_at IS NULL",
    [vehicle.id],
  );
  if (activeAssignment) {
    return {
      success: false,
      error: "This vehicle already has a VaahanSafe ID. Detach it or use the replacement flow.",
    };
  }

  if (db.dialect === "postgres") {
    // A competing second-vehicle attachment must not consume this sticker's
    // activation proof or leave an activated sticker without an assignment.
    await db.batch([
      {
        sql: `PERFORM id FROM vehicles WHERE id=? AND user_id=? AND status='ACTIVE' FOR UPDATE`,
        params: [vehicle.id, userId],
      },
      {
        sql: `PERFORM id FROM qr_stickers WHERE id=? FOR UPDATE`,
        params: [matched.qr_id],
      },
      {
        sql: `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
          SELECT ?, q.id, v.id, v.user_id, 'INITIAL', ?
          FROM qr_stickers q JOIN qr_activation_secrets sec ON sec.qr_id=q.id
          JOIN vehicles v ON v.id=? AND v.user_id=? AND v.status='ACTIVE' AND v.deleted_at IS NULL
          WHERE q.id=? AND q.status=?
            AND sec.id=? AND sec.secret_hash=? AND sec.consumed_at IS NULL
            AND (sec.locked_until IS NULL OR sec.locked_until<=now())
            AND NOT EXISTS (SELECT 1 FROM qr_assignments a
              WHERE a.ended_at IS NULL AND (a.qr_id=q.id OR a.vehicle_id=v.id))`,
        params: [assignmentId, now, vehicle.id, userId, matched.qr_id, matched.qr_status, matched.secret_id, matched.secret_hash],
      },
      {
        sql: `UPDATE qr_stickers SET status='ACTIVATED', activated_at=?, updated_at=?
          WHERE id=? AND EXISTS (SELECT 1 FROM qr_assignments WHERE id=?)`,
        params: [now, now, matched.qr_id, assignmentId],
      },
      {
        sql: `UPDATE qr_activation_secrets SET consumed_at=?, updated_at=?
          WHERE id=? AND EXISTS (SELECT 1 FROM qr_assignments WHERE id=?)`,
        params: [now, now, matched.secret_id, assignmentId],
      },
      {
        sql: `INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, created_at)
          SELECT ?, ?, ?, 'ACTIVATED', 'USER_ACTIVATION', 'USER', ?, ?
          WHERE EXISTS (SELECT 1 FROM qr_assignments WHERE id=?)`,
        params: [historyId, matched.qr_id, matched.qr_status, userId, now, assignmentId],
      },
      {
        sql: `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at)
          SELECT ?, ?, ?, 'SUCCESS', ? WHERE EXISTS (SELECT 1 FROM qr_assignments WHERE id=?)`,
        params: [attemptId, matched.qr_id, userId, now, assignmentId],
      },
      ...ALL_ENTITLEMENT_CAPABILITIES.map((capability) => ({
        sql: `INSERT INTO service_entitlements
          (id, user_id, vehicle_id, qr_sticker_id, capability, status, acquisition_source, verified_at)
          SELECT ?, ?, ?, ?, ?, 'ENABLED', 'RETAIL_ACTIVATION', ?
          WHERE EXISTS (SELECT 1 FROM qr_assignments WHERE id=?)
          ON CONFLICT(vehicle_id,qr_sticker_id,capability)
          DO UPDATE SET status='ENABLED', updated_at=now()`,
        params: [`ent_${crypto.randomUUID()}`, userId, vehicle.id, matched.qr_id, capability, now, assignmentId],
      })),
    ]);
    const committed = await db.queryFirst<{ id: string }>(
      "SELECT id FROM qr_assignments WHERE id=? AND ended_at IS NULL",
      [assignmentId],
    );
    return committed
      ? { success: true, publicId: matched.public_id, maskedPlate: maskVehicleRegistration(vehicle.registration_number) }
      : { success: false, error: "The vehicle or sticker was linked by another request. Refresh and try again." };
  }

  // Atomic claim: update sticker status to ACTIVATED only if currently claimable (Rule 34)
  const updateResult = await db.execute(
    `UPDATE qr_stickers
     SET status = 'ACTIVATED', activated_at = ?, updated_at = ?
     WHERE id = ? AND status = 'SOLD'`,
    [now, now, matched.qr_id],
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
    [now, now, matched.secret_id],
  );

  // Create new active assignment
  await db.execute(
    `INSERT INTO qr_assignments (id, qr_id, vehicle_id, user_id, assignment_type, assigned_at)
     VALUES (?, ?, ?, ?, 'INITIAL', ?)`,
    [assignmentId, matched.qr_id, vehicle.id, userId, now],
  );

  // Record audit history
  await db.execute(
    `INSERT INTO qr_status_history (id, qr_id, from_status, to_status, reason_code, actor_type, actor_id, created_at)
     VALUES (?, ?, ?, 'ACTIVATED', 'USER_ACTIVATION', 'USER', ?, ?)`,
    [historyId, matched.qr_id, matched.qr_status, userId, now],
  );

  // Record successful activation attempt
  await db.execute(
    `INSERT INTO qr_activation_attempts (id, qr_id, user_id, outcome, created_at)
     VALUES (?, ?, ?, 'SUCCESS', ?)`,
    [attemptId, matched.qr_id, userId, now],
  );

  // Authoritative Service Entitlement Grant (Rule 13, 28)
  await grantAuthoritativeEntitlements({
    userId,
    vehicleId: vehicle.id,
    qrStickerId: matched.qr_id,
    acquisitionSource: "RETAIL_ACTIVATION",
    db,
  });

  // Supabase returns above because its entitlement trigger owns this event.
  try {
    const vehicleName =
      `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "your vehicle";
    await createInAppNotification(db, {
      userId,
      eventType: "RETAIL_QR_ACTIVATED",
      title: "QR Sticker Activated",
      body: `Your VaahanSafe QR code (${matched.public_id}) has been activated and linked to ${vehicleName} (${maskVehicleRegistration(vehicle.registration_number)}).`,
      category: "SAFETY",
      priority: "CRITICAL",
      actionType: "VIEW_QR",
      actionTarget: `/vehicles/${vehicle.id}`,
    });
  } catch (notifErr) {
    console.error(
      "[executeQrActivation] Failed to create in-app notification:",
      notifErr,
    );
  }

  return {
    success: true,
    publicId: matched.public_id,
    maskedPlate: maskVehicleRegistration(vehicle.registration_number),
  };
}

export type CanonicalReplacementReason =
  "LOST" | "DAMAGED" | "PRINT_DEFECT" | "DELIVERY_DAMAGE" | "OTHER";

export function mapToCanonicalReplacementReason(rawReason: string): {
  canonicalReason: CanonicalReplacementReason;
  label: string;
} {
  const upper = (rawReason || "").trim().toUpperCase();
  switch (upper) {
    case "WINDSHIELD_REPLACED":
      return {
        canonicalReason: "DAMAGED",
        label: "Windshield Replaced / Damaged Glass",
      };
    case "STICKER_FADED":
      return {
        canonicalReason: "DAMAGED",
        label: "UV Sun Wear / Faded / Hard to Scan",
      };
    case "PHYSICAL_DAMAGE":
      return {
        canonicalReason: "DAMAGED",
        label: "Car Wash / Tampered / Scratched Surface",
      };
    case "VEHICLE_REPAINT":
      return {
        canonicalReason: "DAMAGED",
        label: "Vehicle Repainting / Body Shop",
      };
    case "THEFT_OR_LOSS":
      return { canonicalReason: "LOST", label: "Sticker Stolen / Lost" };
    case "LOST":
      return { canonicalReason: "LOST", label: "Sticker Stolen / Lost" };
    case "DAMAGED":
      return { canonicalReason: "DAMAGED", label: "Physical Hardware Damage" };
    case "PRINT_DEFECT":
      return {
        canonicalReason: "PRINT_DEFECT",
        label: "Print Defect / Scrambled Barcode",
      };
    case "DELIVERY_DAMAGE":
      return {
        canonicalReason: "DELIVERY_DAMAGE",
        label: "Courier Delivery / Transit Damage",
      };
    case "OTHER":
    default:
      return { canonicalReason: "OTHER", label: "Other Operational Reason" };
  }
}

/** Requests a replacement through the real session-scoped transactional service. */
export async function executeQrReplacement(
  _userId: string,
  params: { stickerId: string; reason: string; notes?: string },
  sessionId: string,
): Promise<{ success: boolean; error?: string; requestId?: string }> {
  const reason = mapToCanonicalReplacementReason(params.reason);
  const { requestCustomerReplacement } = await import('./replacement-service');
  const requestId = await requestCustomerReplacement(sessionId, params.stickerId, reason.canonicalReason, params.notes?.trim() ? `[${reason.label}] ${params.notes.trim()}` : reason.label);
  return { success: true, requestId };
}
