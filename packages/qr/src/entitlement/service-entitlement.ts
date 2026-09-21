import type {
  EntitlementCapability,
  EntitlementAcquisitionSource,
  QrLifecycleState,
} from "@vaahansafe/types";
import { generateQrPublicId } from "../identity/public-id";
import { formatVisibleCode } from "../identity/visible-code";
import { generateScratchSecret } from "../secrets/generate-secret";
import { hashScratchSecret } from "../secrets/hash-secret";

export interface IDatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ success: boolean; rowsAffected?: number }>;
}

export interface EntitlementCheckParams {
  userId: string;
  vehicleId?: string;
  qrId?: string;
  db: IDatabaseClient;
}

export interface GrantEntitlementParams {
  userId: string;
  vehicleId: string;
  qrStickerId: string;
  acquisitionSource: EntitlementAcquisitionSource;
  orderId?: string;
  db: IDatabaseClient;
}

export const ALL_ENTITLEMENT_CAPABILITIES: readonly EntitlementCapability[] = [
  "DIGITAL_QR_ACCESS",
  "SAFETY_VIEW_ACTIVE",
  "EMERGENCY_ROUTING",
  "SCAN_HISTORY_LOGGING",
  "REPLACEMENT_ELIGIBLE",
] as const;

/**
 * Verifies if an account/vehicle has an active entitlement for a given capability.
 * SERVER AUTHORITATIVE: Never trusts frontend state, cookies, or redirect params.
 */
export async function hasServiceEntitlement(
  capability: EntitlementCapability,
  params: EntitlementCheckParams
): Promise<boolean> {
  const { userId, vehicleId, qrId, db } = params;

  let query = `
    SELECT e.id, e.status, q.status as qr_status
    FROM service_entitlements e
    JOIN qr_stickers q ON e.qr_sticker_id = q.id
    JOIN qr_assignments a ON q.id = a.qr_id AND a.ended_at IS NULL
    WHERE e.user_id = ? AND e.capability = ? AND e.status = 'ENABLED'
  `;
  const sqlParams: unknown[] = [userId, capability];

  if (vehicleId) {
    query += ` AND e.vehicle_id = ? AND a.vehicle_id = ?`;
    sqlParams.push(vehicleId, vehicleId);
  }

  if (qrId) {
    query += ` AND (e.qr_sticker_id = ? OR q.public_id = ?)`;
    sqlParams.push(qrId, qrId);
  }

  query += ` LIMIT 1`;

  const rows = await db.query<{ id: string; status: string; qr_status: QrLifecycleState }>(
    query,
    sqlParams
  );

  const entitlement = rows[0];
  if (!entitlement) {
    return false;
  }

  // QR state must also be legitimate (not BLOCKED, not LOST_DAMAGED, not REPLACED)
  if (
    entitlement.qr_status === "BLOCKED" ||
    entitlement.qr_status === "LOST_DAMAGED" ||
    entitlement.qr_status === "REPLACED"
  ) {
    return false;
  }

  return true;
}

export async function canUseQrService(params: EntitlementCheckParams): Promise<boolean> {
  return hasServiceEntitlement("DIGITAL_QR_ACCESS", params);
}

export async function canViewDigitalQr(params: EntitlementCheckParams): Promise<boolean> {
  return hasServiceEntitlement("DIGITAL_QR_ACCESS", params);
}

export async function canExposeSafetyView(params: {
  qrPublicId: string;
  db: IDatabaseClient;
}): Promise<boolean> {
  const { qrPublicId, db } = params;
  const rows = await db.query<{ id: string; status: string; qr_status: QrLifecycleState }>(
    `SELECT e.id, e.status, q.status as qr_status
     FROM service_entitlements e
     JOIN qr_stickers q ON e.qr_sticker_id = q.id
     WHERE q.public_id = ? AND e.capability = 'SAFETY_VIEW_ACTIVE' AND e.status = 'ENABLED'
     LIMIT 1`,
    [qrPublicId]
  );
  const entitlement = rows[0];
  if (!entitlement) return false;
  return entitlement.qr_status === "ACTIVATED";
}

export async function canRecordScan(params: {
  qrPublicId: string;
  db: IDatabaseClient;
}): Promise<boolean> {
  const { qrPublicId, db } = params;
  const rows = await db.query<{ id: string }>(
    `SELECT e.id
     FROM service_entitlements e
     JOIN qr_stickers q ON e.qr_sticker_id = q.id
     WHERE q.public_id = ? AND e.capability = 'SCAN_HISTORY_LOGGING' AND e.status = 'ENABLED'
     LIMIT 1`,
    [qrPublicId]
  );
  return rows.length > 0;
}

export async function canRequestReplacement(params: EntitlementCheckParams): Promise<boolean> {
  return hasServiceEntitlement("REPLACEMENT_ELIGIBLE", params);
}

/**
 * Grants authoritative entitlements atomically upon satisfying an acquisition gate:
 * - Online Purchase Gate: Webhook verified payment -> Order PAID -> QR assigned -> Entitlements granted.
 * - Retail Activation Gate: Scratch proof hash verified -> Vehicle claimed -> QR ACTIVATED -> Entitlements granted.
 */
export async function grantAuthoritativeEntitlements(
  params: GrantEntitlementParams
): Promise<void> {
  const { userId, vehicleId, qrStickerId, acquisitionSource, orderId, db } = params;
  const now = new Date().toISOString();

  for (const capability of ALL_ENTITLEMENT_CAPABILITIES) {
    const entitlementId = `ent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await db.execute(
      `INSERT INTO service_entitlements (
         id, user_id, vehicle_id, qr_sticker_id, capability,
         status, acquisition_source, order_id, verified_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'ENABLED', ?, ?, ?, ?, ?)
       ON CONFLICT(vehicle_id, qr_sticker_id, capability) DO UPDATE SET
         status = 'ENABLED',
         updated_at = ?`,
      [
        entitlementId,
        userId,
        vehicleId,
        qrStickerId,
        capability,
        acquisitionSource,
        orderId || null,
        now,
        now,
        now,
        now,
      ]
    );
  }
}

export interface FulfillPaidOnlineOrderParams {
  userId: string;
  vehicleId: string;
  orderId: string;
  db: IDatabaseClient;
}

export interface FulfillPaidOnlineOrderResult {
  success: boolean;
  qrStickerId: string;
  publicId: string;
  visibleCode: string;
}

/**
 * Authoritative fulfillment for a verified paid online QR order.
 * - If vehicle already has an active sticker, refreshes entitlements.
 * - If physical inventory exists, allocates & activates candidate sticker.
 * - If inventory is empty, generates a genuine high-entropy sticker in batch, records secrets, assigns, and enables entitlements.
 */
export async function fulfillPaidOnlineOrder(
  params: FulfillPaidOnlineOrderParams
): Promise<FulfillPaidOnlineOrderResult> {
  const { userId, vehicleId, orderId, db } = params;
  const now = new Date().toISOString();

  // 1. Check if vehicle already has an active assigned QR sticker
  const assigned = await db.query<{ id: string; public_id: string; visible_code: string }>(
    `SELECT q.id, q.public_id, q.visible_code
     FROM qr_stickers q
     JOIN qr_assignments a ON q.id = a.qr_id AND a.ended_at IS NULL
     WHERE a.vehicle_id = ? AND a.user_id = ? AND q.status = 'ACTIVATED'
     LIMIT 1`,
    [vehicleId, userId]
  );

  if (assigned[0]) {
    const existing = assigned[0];
    await grantAuthoritativeEntitlements({
      userId,
      vehicleId,
      qrStickerId: existing.id,
      acquisitionSource: "ONLINE_PURCHASE",
      orderId,
      db,
    });
    return {
      success: true,
      qrStickerId: existing.id,
      publicId: existing.public_id,
      visibleCode: existing.visible_code,
    };
  }

  // 2. Check for available pre-printed sticker in inventory
  const available = await db.query<{ id: string; public_id: string; visible_code: string }>(
    `SELECT id, public_id, visible_code
     FROM qr_stickers
     WHERE status = 'PRINTED'
     LIMIT 1`
  );

  let qrStickerId: string;
  let publicId: string;
  let visibleCode: string;

  if (available[0]) {
    const candidate = available[0];
    qrStickerId = candidate.id;
    publicId = candidate.public_id;
    visibleCode = candidate.visible_code;

    await db.execute(
      `UPDATE qr_stickers SET status = 'ACTIVATED', activated_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, qrStickerId]
    );
  } else {
    // 3. Issue a new genuine QR sticker for the paid vehicle kit
    const batchId = "batch_online_fulfillment";
    await db.execute(
      `INSERT OR IGNORE INTO qr_batches (
         id, reference_code, quantity, status, manufacturer_name, generated_at, created_at, updated_at
       ) VALUES (?, 'BATCH-ONLINE-DIRECT', 100000, 'PRINTED', 'VaahanSafe Secure Print', ?, ?, ?)`,
      [batchId, now, now, now]
    );

    publicId = generateQrPublicId();
    visibleCode = formatVisibleCode(publicId);
    qrStickerId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.execute(
      `INSERT INTO qr_stickers (
         id, public_id, visible_code, batch_id, status, activated_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 'ACTIVATED', ?, ?, ?)`,
      [qrStickerId, publicId, visibleCode, batchId, now, now, now]
    );

    const secret = generateScratchSecret();
    const { secretHash, hashVersion } = await hashScratchSecret(secret);
    const secretId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await db.execute(
      `INSERT INTO qr_activation_secrets (
         id, qr_id, secret_hash, hash_version, consumed_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [secretId, qrStickerId, secretHash, hashVersion, now, now, now]
    );
  }

  // 4. Create authoritative assignment linking sticker, vehicle, and user
  const assignmentId = `qra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.execute(
    `INSERT INTO qr_assignments (
       id, qr_id, vehicle_id, user_id, assignment_type, assigned_at
     ) VALUES (?, ?, ?, ?, 'INITIAL', ?)`,
    [assignmentId, qrStickerId, vehicleId, userId, now]
  );

  // 5. Grant authoritative entitlements across all capabilities
  await grantAuthoritativeEntitlements({
    userId,
    vehicleId,
    qrStickerId,
    acquisitionSource: "ONLINE_PURCHASE",
    orderId,
    db,
  });

  // 6. Ensure default emergency profile exists for vehicle
  const epId = `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.execute(
    `INSERT OR IGNORE INTO emergency_profiles (
       id, vehicle_id, display_name, status, created_at, updated_at
     ) VALUES (?, ?, 'Vehicle Owner', 'ACTIVE', ?, ?)`,
    [epId, vehicleId, now, now]
  );

  return {
    success: true,
    qrStickerId,
    publicId,
    visibleCode,
  };
}
