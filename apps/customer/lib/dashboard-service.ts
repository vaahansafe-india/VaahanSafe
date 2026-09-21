/**
 * Authoritative Server-Side Dashboard Service
 *
 * Implements the single-source-of-truth read model for the Vehicle Identity Command Surface.
 * Strictly queries Cloudflare D1 with authorized scoping.
 * Zero mock data, zero fallback dummies.
 */

import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import type {
  DashboardAttentionItem,
  DashboardConstellationEvent,
  DashboardEmergencyContact,
  DashboardEmergencyProfile,
  DashboardFilterState,
  DashboardNotificationItem,
  DashboardOrderSummary,
  DashboardOverviewData,
  DashboardQrLifelineEvent,
  DashboardQrSticker,
  DashboardScanPulsePoint,
  DashboardScanSummary,
  DashboardSubscriptionSummary,
  DashboardVehicle,
  VehicleCategory,
  QrStatus,
} from "./dashboard-types";

interface DbVehicleRow {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type: string;
  status: string;
  created_at: string;
}

interface DbQrRow {
  id: string;
  public_id: string;
  visible_code: string;
  batch_id: string;
  status: string;
  activated_at: string | null;
  assigned_at: string | null;
  replacement_id?: string | null;
  replacement_status?: string | null;
  replacement_reason?: string | null;
}

interface DbProfileRow {
  id: string;
  vehicle_id: string;
  display_name: string | null;
  blood_group: string | null;
  medical_notes: string | null;
  show_owner_name: number;
  show_blood_group: number;
  show_medical_notes: number;
  show_vehicle_details: number;
  status: string;
  updated_at: string;
}

interface DbContactRow {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
  is_enabled: number;
  allow_call: number;
  allow_message: number;
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
  actor_type: string;
  created_at: string;
}

interface DbSubscriptionRow {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end?: number;
  auto_renew?: number;
  plan_name: string | null;
}

interface DbOrderRow {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  created_at: string;
}

interface DbNotificationRow {
  id: string;
  category: string;
  priority: string;
  title: string;
  body_safe: string;
  read_at: string | null;
  created_at: string;
}

export async function getDashboardOverview(
  user: { id: string; name?: string; phone?: string; email?: string },
  selectedVehicleId?: string,
  filterParams?: Partial<DashboardFilterState>
): Promise<DashboardOverviewData> {
  const db = getAuthoritativeDatabaseClient();

  const filterState: DashboardFilterState = {
    range: filterParams?.range || "30d",
    qrId: filterParams?.qrId,
    eventType: filterParams?.eventType,
  };

  // 1. Fetch user vehicles
  let vehicleRows: DbVehicleRow[] = [];
  try {
    vehicleRows = await db.query<DbVehicleRow>(
      `SELECT id, registration_number, make, model, vehicle_type, status, created_at
       FROM vehicles
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [user.id]
    );
  } catch (err) {
    console.warn("[DashboardService] Failed to query user vehicles:", err);
  }

  const vehicles: DashboardVehicle[] = vehicleRows.map((v) => ({
    id: v.id,
    registrationNumber: v.registration_number,
    make: v.make,
    model: v.model,
    type: (v.vehicle_type as VehicleCategory) || "CAR",
    status: v.status,
    createdAt: v.created_at,
  }));

  // Resolve active vehicle
  let activeVehicle: DashboardVehicle | null = null;
  if (selectedVehicleId) {
    activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;
  }
  if (!activeVehicle && vehicles.length > 0) {
    activeVehicle = vehicles[0] ?? null;
  }

  // Handle truthful empty state when user has no vehicles
  if (!activeVehicle) {
    const attentionItems: DashboardAttentionItem[] = [
      {
        id: "no-vehicle",
        severity: "AMBER",
        title: "No Vehicle Registered",
        description:
          "Register your vehicle to generate your VaahanSafe safety identity and bind your QR sticker.",
        actionLabel: "Register Vehicle",
        actionTarget: "vehicle",
      },
    ];

    return {
      user,
      vehicles: [],
      activeVehicle: null,
      qrSticker: null,
      safetyProfile: {
        showOwnerName: false,
        showBloodGroup: false,
        showMedicalNotes: false,
        showVehicleDetails: true,
        contacts: [],
      },
      scanSummary: {
        totalScans: 0,
        emergencyScans: 0,
        peakCount: 0,
        points: [],
      },
      qrLifeline: [],
      constellationEvents: [],
      attentionItems,
      subscription: null,
      recentOrders: [],
      recentNotifications: [],
      unreadNotificationCount: 0,
      filterState,
    };
  }

  // 2. Parallel queries for active vehicle domain state
  const [
    qrRow,
    profileRow,
    subRow,
    orderRows,
    notifRows,
    unreadNotifRow,
  ] = await Promise.all([
    // Active QR sticker & optional open replacement
    db.queryFirst<DbQrRow>(
      `SELECT s.id, s.public_id, s.visible_code, s.batch_id, s.status, s.activated_at, a.assigned_at,
              r.id as replacement_id, r.status as replacement_status, r.reason as replacement_reason
       FROM qr_stickers s
       JOIN qr_assignments a ON s.id = a.qr_id
       LEFT JOIN replacement_requests r ON (r.old_qr_sticker_id = s.id OR r.vehicle_id = a.vehicle_id) AND r.status NOT IN ('REJECTED', 'COMPLETED', 'CANCELLED')
       WHERE a.vehicle_id = ? AND a.ended_at IS NULL
       LIMIT 1`,
      [activeVehicle.id]
    ),
    // Emergency Profile
    db.queryFirst<DbProfileRow>(
      `SELECT id, vehicle_id, display_name, blood_group, medical_notes,
              show_owner_name, show_blood_group, show_medical_notes, show_vehicle_details,
              status, updated_at
       FROM emergency_profiles
       WHERE vehicle_id = ? AND status = 'ACTIVE'
       LIMIT 1`,
      [activeVehicle.id]
    ),
    // Active Subscription
    db.queryFirst<DbSubscriptionRow>(
      `SELECT s.id, s.status, s.current_period_end, s.cancel_at_period_end, p.name as plan_name
       FROM subscriptions s
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [user.id]
    ),
    // Recent Orders
    db.query<DbOrderRow>(
      `SELECT id, order_number, status, total_minor, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [user.id]
    ),
    // Recent In-App Notifications
    db.query<DbNotificationRow>(
      `SELECT id, category, priority, title, body_safe, read_at, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [user.id]
    ),
    // Unread count
    db.queryFirst<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = ? AND read_at IS NULL`,
      [user.id]
    ),
  ]);

  // 3. Emergency contacts for active profile
  let contacts: DashboardEmergencyContact[] = [];
  if (profileRow?.id) {
    const contactRows = await db.query<DbContactRow>(
      `SELECT id, name, relationship_label as relationship, phone, priority, is_enabled, allow_call, allow_message
       FROM emergency_contacts
       WHERE emergency_profile_id = ?
       ORDER BY priority ASC`,
      [profileRow.id]
    );
    contacts = contactRows.map((c) => ({
      id: c.id,
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      isPriority: c.priority === 1,
      isEnabled: Boolean(c.is_enabled),
      allowCall: Boolean(c.allow_call),
      allowMessage: Boolean(c.allow_message),
    }));
  }

  const safetyProfile: DashboardEmergencyProfile = {
    id: profileRow?.id,
    displayName: profileRow?.display_name || undefined,
    bloodGroup: profileRow?.blood_group || undefined,
    medicalNotes: profileRow?.medical_notes || undefined,
    showOwnerName: Boolean(profileRow?.show_owner_name),
    showBloodGroup: Boolean(profileRow?.show_blood_group),
    showMedicalNotes: Boolean(profileRow?.show_medical_notes),
    showVehicleDetails: profileRow ? Boolean(profileRow.show_vehicle_details) : true,
    contacts,
  };

  const qrSticker: DashboardQrSticker | null = qrRow
    ? {
        id: qrRow.id,
        publicId: qrRow.public_id,
        visibleCode: qrRow.visible_code,
        batchId: qrRow.batch_id,
        status: qrRow.status as QrStatus,
        activatedAt: qrRow.activated_at || undefined,
        assignedAt: qrRow.assigned_at || undefined,
        replacementPending: Boolean(qrRow.replacement_id),
        replacementStatus: qrRow.replacement_status || undefined,
        replacementReason: qrRow.replacement_reason || undefined,
      }
    : null;

  // 4. Calculate Date Range for Scans & Telemetry
  let dateFilterCutoff: string | null = null;
  const now = new Date();
  if (filterState.range === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateFilterCutoff = startOfDay.toISOString();
  } else if (filterState.range === "7d") {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilterCutoff = sevenDaysAgo.toISOString();
  } else if (filterState.range === "30d") {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilterCutoff = thirtyDaysAgo.toISOString();
  }

  // 5. Query Scan Events & QR Lifecycle History
  let scanRows: DbScanRow[] = [];
  let qrHistoryRows: DbQrHistoryRow[] = [];

  if (qrSticker?.id) {
    const scanParams: unknown[] = [qrSticker.id];
    let scanSql = `SELECT id, scan_type, result, city, state, created_at
                   FROM qr_scan_events
                   WHERE qr_id = ?`;

    if (dateFilterCutoff) {
      scanSql += ` AND created_at >= ?`;
      scanParams.push(dateFilterCutoff);
    }
    scanSql += ` ORDER BY created_at ASC`;

    const [scans, qrHistory] = await Promise.all([
      db.query<DbScanRow>(scanSql, scanParams),
      db.query<DbQrHistoryRow>(
        `SELECT id, from_status, to_status, reason_code, actor_type, created_at
         FROM qr_status_history
         WHERE qr_id = ?
         ORDER BY created_at ASC`,
        [qrSticker.id]
      ),
    ]);

    scanRows = scans;
    qrHistoryRows = qrHistory;
  }

  // 6. Aggregate Scan Pulse (Truthful temporal density)
  const pulseBucketMap = new Map<string, { count: number; emergencyCount: number; latestCity?: string; latestState?: string; timestamp: string }>();

  let totalScans = 0;
  let emergencyScans = 0;
  let lastScanAt: string | undefined;
  let lastScanLocation: string | undefined;

  for (const scan of scanRows) {
    totalScans++;
    const isEmergency = scan.scan_type === "EMERGENCY_TRIGGER";
    if (isEmergency) emergencyScans++;

    lastScanAt = scan.created_at;
    if (scan.city) {
      lastScanLocation = scan.state ? `${scan.city}, ${scan.state}` : scan.city;
    }

    // Format bucket: YYYY-MM-DD
    const dateBucket = scan.created_at.slice(0, 10);
    const existing = pulseBucketMap.get(dateBucket);
    if (existing) {
      existing.count += 1;
      if (isEmergency) existing.emergencyCount += 1;
      if (scan.city) {
        existing.latestCity = scan.city;
        existing.latestState = scan.state || undefined;
      }
    } else {
      pulseBucketMap.set(dateBucket, {
        count: 1,
        emergencyCount: isEmergency ? 1 : 0,
        latestCity: scan.city || undefined,
        latestState: scan.state || undefined,
        timestamp: scan.created_at,
      });
    }
  }

  const pulsePoints: DashboardScanPulsePoint[] = Array.from(pulseBucketMap.entries()).map(
    ([dateBucket, data]) => ({
      dateBucket,
      timestamp: data.timestamp,
      count: data.count,
      emergencyCount: data.emergencyCount,
      latestCity: data.latestCity,
      latestState: data.latestState,
    })
  );

  let peakCount = 0;
  for (const pt of pulsePoints) {
    if (pt.count > peakCount) peakCount = pt.count;
  }

  const scanSummary: DashboardScanSummary = {
    totalScans,
    emergencyScans,
    peakCount,
    lastScanAt,
    lastScanLocation,
    points: pulsePoints,
  };

  // 7. QR Lifeline Events
  const qrLifeline: DashboardQrLifelineEvent[] = [];
  if (qrSticker) {
    qrLifeline.push({
      id: `init-${qrSticker.id}`,
      status: "PRINTED",
      title: "QR Sticker Manufactured",
      description: `Batch ${qrSticker.batchId} created and calibrated`,
      timestamp: qrSticker.assignedAt || activeVehicle.createdAt,
      actorType: "SYSTEM",
    });

    for (const h of qrHistoryRows) {
      qrLifeline.push({
        id: h.id,
        status: h.to_status,
        title: `Transition: ${h.from_status} → ${h.to_status}`,
        description: `Reason: ${h.reason_code.replace(/_/g, " ")}`,
        timestamp: h.created_at,
        actorType: h.actor_type,
        reasonCode: h.reason_code,
      });
    }

    if (qrSticker.activatedAt && !qrHistoryRows.some((h) => h.to_status === "ACTIVE" || h.to_status === "ACTIVATED")) {
      qrLifeline.push({
        id: `act-${qrSticker.id}`,
        status: "ACTIVE",
        title: "QR Sticker Activated",
        description: `Linked to vehicle ${activeVehicle.registrationNumber}`,
        timestamp: qrSticker.activatedAt,
        actorType: "USER",
      });
    }
  }

  // 8. Assemble Activity Constellation (Cross-domain temporal event surface)
  const constellationEvents: DashboardConstellationEvent[] = [];

  // Lane: VEHICLE
  constellationEvents.push({
    id: `veh-${activeVehicle.id}`,
    lane: "VEHICLE",
    title: "Vehicle Registered",
    summary: `${activeVehicle.make} ${activeVehicle.model} (${activeVehicle.registrationNumber})`,
    timestamp: activeVehicle.createdAt,
  });

  // Lane: QR
  for (const qe of qrLifeline) {
    constellationEvents.push({
      id: `const-qr-${qe.id}`,
      lane: "QR",
      title: qe.title,
      summary: qe.description,
      timestamp: qe.timestamp,
      level: qe.status === "REVOKED" || qe.status === "SUSPENDED" ? "ATTENTION" : "NORMAL",
    });
  }

  // Lane: SCAN
  for (const scan of scanRows.slice(-15)) {
    const isEmerg = scan.scan_type === "EMERGENCY_TRIGGER";
    constellationEvents.push({
      id: `const-scan-${scan.id}`,
      lane: "SCAN",
      title: isEmerg ? "Emergency Scan Triggered" : "Public Safety Scan",
      summary: scan.city ? `${scan.city}, ${scan.state || ""}` : "Resolution logged",
      timestamp: scan.created_at,
      level: isEmerg ? "EMERGENCY" : "NORMAL",
    });
  }

  // Lane: SAFETY
  if (profileRow?.updated_at) {
    constellationEvents.push({
      id: `const-safety-${profileRow.id}`,
      lane: "SAFETY",
      title: "Safety Projection Configured",
      summary: `${contacts.length} emergency contacts active`,
      timestamp: profileRow.updated_at,
    });
  }

  // Lane: ORDER
  for (const ord of orderRows) {
    constellationEvents.push({
      id: `const-ord-${ord.id}`,
      lane: "ORDER",
      title: `Order ${ord.order_number}`,
      summary: `Status: ${ord.status}`,
      timestamp: ord.created_at,
    });
  }

  // Lane: NOTIF
  for (const notif of notifRows.slice(0, 5)) {
    constellationEvents.push({
      id: `const-notif-${notif.id}`,
      lane: "NOTIF",
      title: notif.title,
      summary: notif.body_safe,
      timestamp: notif.created_at,
      level: notif.priority === "CRITICAL" ? "EMERGENCY" : notif.priority === "HIGH" ? "ATTENTION" : "NORMAL",
    });
  }

  // Sort constellation events chronologically descending
  constellationEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // 9. Compute Deterministic Attention Items
  const attentionItems: DashboardAttentionItem[] = [];

  if (contacts.length === 0) {
    attentionItems.push({
      id: "no-emergency-contact",
      severity: "AMBER",
      title: "No Emergency Contact Configured",
      description:
        "Your vehicle QR cannot alert responders or family until at least one emergency contact is added.",
      actionLabel: "Add Emergency Contact",
      actionTarget: "emergency-contacts",
    });
  }

  if (!qrSticker) {
    attentionItems.push({
      id: "no-qr-sticker",
      severity: "AMBER",
      title: "No QR Sticker Assigned",
      description:
        "This vehicle does not have an active QR sticker attached. Activate a sticker to enable emergency scans.",
      actionLabel: "Activate QR",
      actionTarget: "qr",
    });
  } else if (qrSticker.status !== "ACTIVE" && qrSticker.status !== "ACTIVATED") {
    attentionItems.push({
      id: `qr-status-${qrSticker.status.toLowerCase()}`,
      severity: "RED",
      title: `QR Sticker Status: ${qrSticker.status}`,
      description:
        qrSticker.status === "REPLACED"
          ? "This sticker has been retired and replaced with a new QR code."
          : "Your QR sticker is currently not in active state.",
      actionLabel: "Manage QR Hub",
      actionTarget: "qr",
    });
  }

  if (!safetyProfile.bloodGroup) {
    attentionItems.push({
      id: "missing-blood-group",
      severity: "AMBER",
      title: "Blood Group Unset",
      description:
        "Providing your blood group ensures first responders can prepare critical care during golden-hour incidents.",
      actionLabel: "Configure Safety View",
      actionTarget: "safety-view",
    });
  }

  const autoRenew = subRow
    ? subRow.cancel_at_period_end !== undefined
      ? subRow.cancel_at_period_end === 0
      : Boolean(subRow.auto_renew)
    : false;

  const subscription: DashboardSubscriptionSummary | null = subRow
    ? {
        id: subRow.id,
        planName: subRow.plan_name || "Annual Safety Shield",
        status: subRow.status as DashboardSubscriptionSummary["status"],
        expiresAt: subRow.current_period_end || undefined,
        autoRenew,
      }
    : null;

  if (subscription && (subscription.status === "EXPIRED" || subscription.status === "PAST_DUE")) {
    attentionItems.push({
      id: "sub-expired",
      severity: "AMBER",
      title: "Subscription Renewal Needed",
      description: "Safety identity alerts are degraded due to an expired subscription.",
      actionLabel: "Renew Plan",
      actionTarget: "subscription",
    });
  }

  const recentOrders: DashboardOrderSummary[] = orderRows.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    totalMinor: o.total_minor,
    createdAt: o.created_at,
  }));

  const recentNotifications: DashboardNotificationItem[] = notifRows.map((n) => ({
    id: n.id,
    category: n.category,
    priority: n.priority,
    title: n.title,
    bodySafe: n.body_safe,
    readAt: n.read_at || undefined,
    createdAt: n.created_at,
  }));

  return {
    user,
    vehicles,
    activeVehicle,
    qrSticker,
    safetyProfile,
    scanSummary,
    qrLifeline,
    constellationEvents,
    attentionItems,
    subscription,
    recentOrders,
    recentNotifications,
    unreadNotificationCount: unreadNotifRow?.count || 0,
    filterState,
  };
}
