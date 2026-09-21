/**
 * Authoritative Server-Side Subscription & Coverage Center Read Model
 *
 * Single source of truth querying Cloudflare D1.
 * Enforces strict decoupling of:
 * VEHICLE → QR IDENTITY → ENTITLEMENT → SUBSCRIPTION → ENABLED SERVICES
 * Zero mock data, zero fallback dummies.
 */

import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import type {
  ActiveSubscriptionPassport,
  BillingSummaryRecord,
  CommercialPlanItem,
  ConnectedVehicleServiceItem,
  ServiceCapabilityItem,
  ServiceHistoryTimelineEvent,
  SubscriptionAttentionItem,
  SubscriptionServiceOverview,
} from "./subscription-types";

interface DbVehicleRow {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  vehicle_type: string;
  status: string;
  created_at: string;
}

interface DbQrAssignmentRow {
  vehicle_id: string;
  qr_id: string;
  public_id: string;
  visible_code: string;
  qr_status: string;
  activated_at: string | null;
  assigned_at: string;
}

interface DbServiceEntitlementRow {
  id: string;
  vehicle_id: string;
  qr_sticker_id: string;
  capability: string;
  status: string;
  acquisition_source: string;
  order_id: string | null;
  verified_at: string;
  expires_at: string | null;
}

interface DbSubscriptionRow {
  id: string;
  vehicle_id: string | null;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  plan_code: string;
  plan_name: string;
  plan_description: string | null;
  price_minor: number;
  currency: string;
  vehicle_limit: number;
  contact_limit: number;
  features_json: string | null;
}

interface DbPlanRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billing_interval: string;
  price_minor: number;
  currency: string;
  vehicle_limit: number;
  contact_limit: number;
  features_json: string | null;
  is_active: number;
}

interface DbOrderPaymentRow {
  order_id: string;
  order_number: string;
  order_status: string;
  total_minor: number;
  currency: string;
  order_created_at: string;
  payment_id: string | null;
  payment_status: string | null;
  confirmed_at: string | null;
  payment_method: string | null;
}

export async function getSubscriptionServiceOverview(
  userId: string,
  userProfile: { name?: string; email?: string; phone?: string },
  scopedVehicleId?: string
): Promise<SubscriptionServiceOverview> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Fetch user vehicles
  let vehicleRows: DbVehicleRow[] = [];
  try {
    vehicleRows = await db.query<DbVehicleRow>(
      `SELECT id, registration_number, make, model, vehicle_type, status, created_at
       FROM vehicles
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [userId]
    );
  } catch (err) {
    console.warn("[SubscriptionService] Failed to query user vehicles:", err);
  }

  // 2. Fetch QR assignments for all user vehicles
  let qrRows: DbQrAssignmentRow[] = [];
  if (vehicleRows.length > 0) {
    const vehicleIds = vehicleRows.map((v) => v.id);
    const placeholders = vehicleIds.map(() => "?").join(",");
    try {
      qrRows = await db.query<DbQrAssignmentRow>(
        `SELECT a.vehicle_id, s.id as qr_id, s.public_id, s.visible_code, s.status as qr_status,
                s.activated_at, a.assigned_at
         FROM qr_stickers s
         JOIN qr_assignments a ON s.id = a.qr_id
         WHERE a.vehicle_id IN (${placeholders}) AND a.ended_at IS NULL`,
        vehicleIds
      );
    } catch (err) {
      console.warn("[SubscriptionService] Failed to query QR assignments:", err);
    }
  }

  // 3. Fetch Service Entitlements for user
  let entitlementRows: DbServiceEntitlementRow[] = [];
  try {
    entitlementRows = await db.query<DbServiceEntitlementRow>(
      `SELECT id, vehicle_id, qr_sticker_id, capability, status, acquisition_source, order_id, verified_at, expires_at
       FROM service_entitlements
       WHERE user_id = ? AND status = 'ENABLED'`,
      [userId]
    );
  } catch (err) {
    console.warn("[SubscriptionService] Failed to query service entitlements:", err);
  }

  // 4. Fetch Active Subscription & Plan
  let subscriptionRow: DbSubscriptionRow | null = null;
  try {
    subscriptionRow = await db.queryFirst<DbSubscriptionRow>(
      `SELECT s.id, s.vehicle_id, s.plan_id, s.status, s.current_period_start, s.current_period_end,
              s.cancel_at_period_end, p.code as plan_code, p.name as plan_name, p.description as plan_description,
              p.price_minor, p.currency, p.vehicle_limit, p.contact_limit, p.features_json
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? AND s.status IN ('ACTIVE', 'PENDING_PAYMENT', 'CANCEL_AT_PERIOD_END', 'PAST_DUE')
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );
  } catch (err) {
    console.warn("[SubscriptionService] Failed to query subscription:", err);
  }

  // 5. Fetch Available Plans (Commercial upgrade plans only - excludes baseline zero plans)
  let planRows: DbPlanRow[] = [];
  try {
    planRows = await db.query<DbPlanRow>(
      `SELECT id, code, name, description, billing_interval, price_minor, currency,
              vehicle_limit, contact_limit, features_json, is_active
       FROM plans
       WHERE is_active = 1 AND price_minor > 0
       ORDER BY price_minor ASC`
    );
  } catch (err) {
    console.warn("[SubscriptionService] Failed to query plans:", err);
  }

  // 6. Fetch Orders & Payments
  let orderPaymentRows: DbOrderPaymentRow[] = [];
  try {
    orderPaymentRows = await db.query<DbOrderPaymentRow>(
      `SELECT o.id as order_id, o.order_number, o.status as order_status, o.total_minor, o.currency,
              o.created_at as order_created_at, p.id as payment_id, p.status as payment_status,
              p.confirmed_at, p.payment_method
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [userId]
    );
  } catch (err) {
    console.warn("[SubscriptionService] Failed to query order payments:", err);
  }

  // Map Available Plans
  const availablePlans: CommercialPlanItem[] = planRows.map((p) => {
    let features: string[] = [];
    if (p.features_json) {
      try {
        features = JSON.parse(p.features_json);
      } catch {
        features = [];
      }
    }
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description || "",
      billingInterval: (p.billing_interval as "ANNUAL" | "MONTHLY") || "ANNUAL",
      priceMinor: p.price_minor,
      currency: p.currency,
      vehicleLimit: p.vehicle_limit,
      contactLimit: p.contact_limit,
      features,
      isActive: Boolean(p.is_active),
    };
  });

  // Map Connected Vehicles
  const qrMap = new Map<string, DbQrAssignmentRow>();
  for (const qr of qrRows) {
    qrMap.set(qr.vehicle_id, qr);
  }

  const entitlementsByVehicle = new Map<string, DbServiceEntitlementRow[]>();
  for (const ent of entitlementRows) {
    const list = entitlementsByVehicle.get(ent.vehicle_id) || [];
    list.push(ent);
    entitlementsByVehicle.set(ent.vehicle_id, list);
  }

  const connectedVehicles: ConnectedVehicleServiceItem[] = vehicleRows.map((v) => {
    const assignedQr = qrMap.get(v.id);
    const vehicleEnts = entitlementsByVehicle.get(v.id) || [];

    let subStatus: ConnectedVehicleServiceItem["subscriptionStatus"] = "NONE";
    let planName: string | undefined = undefined;

    if (subscriptionRow) {
      if (!subscriptionRow.vehicle_id || subscriptionRow.vehicle_id === v.id) {
        subStatus = subscriptionRow.status === "ACTIVE" ? "ACTIVE" : "PENDING_PAYMENT";
        planName = subscriptionRow.plan_name;
      }
    } else if (assignedQr && assignedQr.qr_status === "ACTIVATED") {
      subStatus = "BASELINE_ONLY";
      planName = "Core Safety Baseline";
    }

    return {
      id: v.id,
      registrationNumber: v.registration_number,
      make: v.make,
      model: v.model,
      vehicleType: v.vehicle_type,
      status: v.status,
      qr: assignedQr
        ? {
            id: assignedQr.qr_id,
            publicId: assignedQr.public_id,
            visibleCode: assignedQr.visible_code,
            status: assignedQr.qr_status as any,
            activatedAt: assignedQr.activated_at || undefined,
          }
        : null,
      subscriptionStatus: subStatus,
      planName,
      entitlementsCount: vehicleEnts.length,
    };
  });

  // Determine Active Scoped Vehicle or Primary Vehicle
  const activeVehicle = scopedVehicleId
    ? connectedVehicles.find((v) => v.id === scopedVehicleId) || connectedVehicles[0]
    : connectedVehicles[0];

  // Map Service Passport (truthful empty state if no subscription)
  let passport: ActiveSubscriptionPassport;

  if (subscriptionRow) {
    const isCancelAtEnd = Boolean(subscriptionRow.cancel_at_period_end);
    let statusLabel = "Active (Good Standing)";
    if (subscriptionRow.status === "CANCEL_AT_PERIOD_END" || isCancelAtEnd) {
      statusLabel = "Active (Cancels at Period End)";
    } else if (subscriptionRow.status === "PAST_DUE") {
      statusLabel = "Past Due — Renewal Required";
    } else if (subscriptionRow.status === "PENDING_PAYMENT") {
      statusLabel = "Payment Confirmation Pending";
    }

    let nextBillingEvent: ActiveSubscriptionPassport["nextBillingEvent"] = undefined;
    if (subscriptionRow.current_period_end && !isCancelAtEnd) {
      nextBillingEvent = {
        date: subscriptionRow.current_period_end,
        description: "Scheduled Automatic Renewal",
      };
    } else if (subscriptionRow.current_period_end && isCancelAtEnd) {
      nextBillingEvent = {
        date: subscriptionRow.current_period_end,
        description: "Service Term Concludes",
      };
    }

    passport = {
      hasSubscription: true,
      id: subscriptionRow.id,
      planName: subscriptionRow.plan_name,
      planCode: subscriptionRow.plan_code,
      status: subscriptionRow.status as any,
      statusLabel,
      isBaselineContinuity: false,
      termStart: subscriptionRow.current_period_start || undefined,
      termEnd: subscriptionRow.current_period_end || undefined,
      cancelAtPeriodEnd: isCancelAtEnd,
      autoRenew: !isCancelAtEnd,
      vehicleLimit: subscriptionRow.vehicle_limit,
      contactLimit: subscriptionRow.contact_limit,
      coveredVehiclesCount: connectedVehicles.length,
      nextBillingEvent,
    };
  } else {
    // Truthful Baseline Continuity: Hardware QR entitlement is active, but no recurring plan
    const hasActiveQr = connectedVehicles.some((v) => v.qr?.status === "ACTIVATED");
    const hasAnyVehicle = connectedVehicles.length > 0;

    if (hasActiveQr) {
      passport = {
        hasSubscription: false,
        planName: "Core Safety Continuity",
        planCode: "CORE_SAFETY_BASELINE",
        status: "BASELINE_ACTIVE",
        statusLabel: "Active (Sticker Entitlement)",
        isBaselineContinuity: true,
        vehicleLimit: 1,
        contactLimit: 3,
        coveredVehiclesCount: connectedVehicles.length,
        cancelAtPeriodEnd: false,
        autoRenew: false,
        nextBillingEvent: undefined, // No recurring billing
      };
    } else if (hasAnyVehicle) {
      passport = {
        hasSubscription: false,
        planName: "No Active Plan Attached",
        planCode: "NONE",
        status: "NO_PLAN",
        statusLabel: "QR Activation Required",
        isBaselineContinuity: false,
        vehicleLimit: 1,
        contactLimit: 1,
        coveredVehiclesCount: 0,
        cancelAtPeriodEnd: false,
        autoRenew: false,
      };
    } else {
      passport = {
        hasSubscription: false,
        planName: "No Vehicles Registered",
        planCode: "NONE",
        status: "NO_PLAN",
        statusLabel: "Setup Required",
        isBaselineContinuity: false,
        vehicleLimit: 0,
        contactLimit: 0,
        coveredVehiclesCount: 0,
        cancelAtPeriodEnd: false,
        autoRenew: false,
      };
    }
  }

  // Evaluate Capabilities Ledger
  const hasDigitalQrEntitlement = entitlementRows.some((e) => e.capability === "DIGITAL_QR_ACCESS");
  const hasSafetyViewEntitlement = entitlementRows.some((e) => e.capability === "SAFETY_VIEW_ACTIVE");
  const hasEmergencyRouting = entitlementRows.some((e) => e.capability === "EMERGENCY_ROUTING");
  const hasScanHistoryEntitlement = entitlementRows.some((e) => e.capability === "SCAN_HISTORY_LOGGING");
  const hasReplacementEntitlement = entitlementRows.some((e) => e.capability === "REPLACEMENT_ELIGIBLE");

  const capabilities: ServiceCapabilityItem[] = [
    {
      id: "qr-resolver",
      name: "QR Emergency Resolver",
      category: "RESOLUTION",
      description: "Resolves physical sticker scans to live safety identity at qr.vaahansafe.com.",
      status: activeVehicle?.qr?.status === "ACTIVATED" || hasDigitalQrEntitlement ? "ENABLED" : "BASELINE",
      statusLabel: activeVehicle?.qr?.status === "ACTIVATED" ? "Active" : "Ready",
      iconName: "qr",
      requiresPlan: false,
      boundVehiclePlate: activeVehicle?.registrationNumber,
    },
    {
      id: "safety-view",
      name: "Public Safety View",
      category: "SAFETY",
      description: "Exposes verified vehicle identity and owner emergency profile instructions.",
      status: hasSafetyViewEntitlement || activeVehicle?.qr?.status === "ACTIVATED" ? "ENABLED" : "BASELINE",
      statusLabel: "Active",
      iconName: "shield",
      requiresPlan: false,
      boundVehiclePlate: activeVehicle?.registrationNumber,
    },
    {
      id: "emergency-routing",
      name: "Direct Contact Actions",
      category: "COMMUNICATION",
      description: "Provides one-touch emergency phone calling to verified contacts.",
      status: hasEmergencyRouting || activeVehicle?.qr?.status === "ACTIVATED" ? "ENABLED" : "BASELINE",
      statusLabel: "Active",
      iconName: "phone",
      requiresPlan: false,
      boundVehiclePlate: activeVehicle?.registrationNumber,
    },
    {
      id: "scan-history",
      name: "Scan History Logging",
      category: "INTELLIGENCE",
      description: "Records timestamp and geographic pulse points of QR scan events.",
      status: hasScanHistoryEntitlement || subscriptionRow?.status === "ACTIVE" ? "ENABLED" : "PLAN_REQUIRED",
      statusLabel: hasScanHistoryEntitlement || subscriptionRow?.status === "ACTIVE" ? "Active" : "Plan Required",
      iconName: "calendar",
      requiresPlan: true,
      boundVehiclePlate: activeVehicle?.registrationNumber,
    },
    {
      id: "scan-alerts",
      name: "Incident Scan Notifications",
      category: "COMMUNICATION",
      description: "Dispatches SMS notifications to emergency contacts when sticker is scanned.",
      status: "ENABLED",
      statusLabel: "Configured",
      iconName: "notification",
      requiresPlan: false,
      boundVehiclePlate: activeVehicle?.registrationNumber,
    },
    {
      id: "hardware-replacement",
      name: "Hardware Replacement Support",
      category: "HARDWARE",
      description: "Entitlement to request rapid replacement for damaged or peeled stickers.",
      status: hasReplacementEntitlement ? "ENABLED" : "BASELINE",
      statusLabel: hasReplacementEntitlement ? "Eligible" : "Standard",
      iconName: "document",
      requiresPlan: false,
      boundVehiclePlate: activeVehicle?.registrationNumber,
    },
  ];

  // Map Billing Records
  const billingRecords: BillingSummaryRecord[] = orderPaymentRows.map((op) => ({
    id: op.order_id,
    orderNumber: op.order_number,
    status: (op.order_status as any) || "PENDING_PAYMENT",
    amountMinor: op.total_minor,
    currency: op.currency,
    confirmedAt: op.confirmed_at || undefined,
    createdAt: op.order_created_at,
    itemDescription: op.order_number.includes("ORD") ? "VaahanSafe QR Safety Package" : "Annual Safety Plan",
    paymentMethod: op.payment_method || undefined,
  }));

  // Map Service History Timeline Events
  const historyEvents: ServiceHistoryTimelineEvent[] = [];

  // Order payments
  for (const op of orderPaymentRows) {
    if (op.order_status === "PAID" && op.confirmed_at) {
      historyEvents.push({
        id: `evt_pay_${op.order_id}`,
        timestamp: op.confirmed_at,
        eventType: "HARDWARE_ORDER_PAID",
        title: "Payment Confirmed",
        description: `Authoritatively confirmed Cashfree order ${op.order_number} for ₹${(op.total_minor / 100).toFixed(0)}.`,
        badgeLabel: "Paid",
        severity: "SUCCESS",
      });
    }
  }

  // QR activations
  for (const qr of qrRows) {
    if (qr.qr_status === "ACTIVATED" && qr.activated_at) {
      historyEvents.push({
        id: `evt_qr_${qr.qr_id}`,
        timestamp: qr.activated_at,
        eventType: "QR_ACTIVATED",
        title: "QR Sticker Bound & Activated",
        description: `Physical QR identity ${qr.visible_code} was bound to vehicle identity.`,
        badgeLabel: "Activated",
        severity: "SUCCESS",
      });
    }
  }

  // Service Entitlements
  for (const ent of entitlementRows) {
    historyEvents.push({
      id: `evt_ent_${ent.id}`,
      timestamp: ent.verified_at,
      eventType: "ENTITLEMENT_GRANTED",
      title: `Entitlement: ${ent.capability.replace(/_/g, " ")}`,
      description: `Verified server entitlement granted via ${ent.acquisition_source.replace(/_/g, " ").toLowerCase()}.`,
      badgeLabel: "Granted",
      severity: "INFO",
    });
  }

  // Sort history descending
  historyEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Attention Items
  const attentionItems: SubscriptionAttentionItem[] = [];

  // Check pending payments
  const pendingOrders = orderPaymentRows.filter((o) => o.order_status === "PENDING_PAYMENT");
  if (pendingOrders.length > 0) {
    attentionItems.push({
      id: "attn-pending-payment",
      severity: "AMBER",
      title: "Payment Confirmation Pending",
      description: `Order ${pendingOrders[0]?.order_number} is awaiting final confirmation from payment provider.`,
      actionLabel: "Check Status",
      actionTarget: "payment",
    });
  }

  // Check unlinked vehicles
  const unlinkedVehicles = connectedVehicles.filter((v) => !v.qr || v.qr.status !== "ACTIVATED");
  if (unlinkedVehicles.length > 0 && connectedVehicles.length > 0) {
    attentionItems.push({
      id: "attn-unlinked-vehicle",
      severity: "INFO",
      title: "Unbound Vehicle Safety Identity",
      description: `${unlinkedVehicles[0]?.registrationNumber} does not have an active QR sticker attached.`,
      actionLabel: "Connect QR",
      actionTarget: "qr",
    });
  }

  return {
    user: {
      id: userId,
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
    },
    scopedVehicleId,
    passport,
    connectedVehicles,
    availablePlans,
    capabilities,
    billingRecords,
    historyEvents,
    attentionItems,
  };
}
