import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import type {
  PaymentsPageData,
  PaymentRecordItem,
  PaymentSignalMetrics,
  PaymentPulseEvent,
  PaymentStateComposition,
  PaymentPurposeItem,
  PaymentAttentionItem,
  AuthoritativePaymentStatus,
  PaymentPurposeCategory,
  VerificationMilestone,
} from "./payments-types";

interface DbPaymentRow {
  id: string;
  order_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: string;
  amount_minor: number;
  currency: string;
  attempt_number: number;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  // Joined Order fields
  order_number: string;
  order_status: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  order_created_at: string;
  paid_at: string | null;
  shipping_address_id: string | null;
  vehicle_id: string | null;
  // Joined Vehicle fields
  vehicle_plate: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_type: string | null;
  // Joined Address fields
  address_name: string | null;
  address_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
}

interface DbOrderItemRow {
  id: string;
  order_id: string;
  item_type: string;
  product_id: string | null;
  plan_id: string | null;
  catalog_code: string;
  name: string;
  quantity: number;
  unit_price_minor: number;
  total_price_minor: number;
}

interface DbQrAssignmentRow {
  vehicle_id: string;
  qr_id: string;
  public_id: string;
  visible_code: string;
  qr_status: string;
}

/**
 * Maps raw database payment status to authoritative domain status
 */
function mapPaymentStatus(dbStatus: string): AuthoritativePaymentStatus {
  switch (dbStatus?.toUpperCase()) {
    case "SUCCESS":
    case "PAID":
    case "CONFIRMED":
      return "SUCCESS";
    case "PENDING":
    case "CREATED":
      return "PENDING";
    case "REFUNDED":
      return "REFUNDED";
    case "REFUND_PENDING":
      return "REFUND_PENDING";
    case "FAILED":
    case "EXPIRED":
    default:
      return "FAILED";
  }
}

/**
 * Determines payment purpose category from line items and catalog codes
 */
function determinePurpose(items: DbOrderItemRow[]): {
  purpose: PaymentPurposeCategory;
  label: string;
  description: string;
} {
  if (items.some((i) => i.item_type === "PLAN")) {
    return {
      purpose: "SUBSCRIPTION",
      label: "Service Subscription",
      description: items.map((i) => i.name).join(", ") || "VaahanSafe Service Plan",
    };
  }
  if (items.some((i) => i.item_type === "REPLACEMENT_FEE" || i.catalog_code.includes("REPLACEMENT"))) {
    return {
      purpose: "REPLACEMENT",
      label: "Replacement Hardware",
      description: "Replacement Vehicle QR Identity Sticker",
    };
  }
  return {
    purpose: "QR_PURCHASE",
    label: "QR Safety Kit",
    description: items.map((i) => i.name).join(", ") || "VaahanSafe Automotive Safety Kit",
  };
}

/**
 * Constructs verification timeline milestones based on real recorded timestamps
 */
function buildVerificationTimeline(
  p: DbPaymentRow,
  mappedStatus: AuthoritativePaymentStatus
): VerificationMilestone[] {
  const milestones: VerificationMilestone[] = [
    {
      stage: "ORDER_CREATED",
      label: "Order Created",
      description: `Order ${p.order_number} initialized`,
      timestamp: p.order_created_at || p.created_at,
      status: "COMPLETED",
    },
    {
      stage: "PAYMENT_INITIATED",
      label: "Payment Initiated",
      description: `Gateway session created with ${p.provider || "Razorpay"}`,
      timestamp: p.created_at,
      status: "COMPLETED",
    },
  ];

  if (mappedStatus === "SUCCESS") {
    milestones.push(
      {
        stage: "PROVIDER_PROCESSING",
        label: "Gateway Authorization",
        description: `Authorization confirmed (Ref: ${p.provider_payment_id || "Razorpay"})`,
        timestamp: p.confirmed_at || p.updated_at,
        status: "COMPLETED",
      },
      {
        stage: "SERVER_VERIFIED",
        label: "Server Verified",
        description: `Authoritative ${p.provider || "Razorpay"} webhook signature validated by VaahanSafe`,
        timestamp: p.confirmed_at || p.updated_at,
        status: "COMPLETED",
      },
      {
        stage: "ORDER_UPDATED",
        label: "Order Transitioned to Paid",
        description: "Entitlements issued and fulfillment unlocked",
        timestamp: p.paid_at || p.confirmed_at || p.updated_at,
        status: "COMPLETED",
      }
    );
  } else if (mappedStatus === "PENDING") {
    milestones.push(
      {
        stage: "PROVIDER_PROCESSING",
        label: "Gateway Authorization",
        description: "Waiting for authoritative payment gateway confirmation",
        timestamp: p.updated_at,
        status: "CURRENT",
      },
      {
        stage: "SERVER_VERIFIED",
        label: "Server Verification",
        description: `Awaiting signed webhook event from ${p.provider || "Razorpay"}`,
        timestamp: null,
        status: "PENDING",
      },
      {
        stage: "ORDER_UPDATED",
        label: "Order Transition",
        description: "Order status will update upon signature verification",
        timestamp: null,
        status: "PENDING",
      }
    );
  } else {
    milestones.push(
      {
        stage: "PROVIDER_PROCESSING",
        label: "Payment Incomplete",
        description: "Transaction did not complete or was dropped",
        timestamp: p.updated_at,
        status: "FAILED",
      }
    );
  }

  return milestones;
}

/**
 * Fetches and synthesizes the complete Payments Read Model for a user from Cloudflare D1
 */
export async function getCustomerPayments(userId: string): Promise<PaymentsPageData> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Fetch payments joined with orders, vehicles, and addresses
  let paymentRows: DbPaymentRow[] = [];
  try {
    paymentRows = await db.query<DbPaymentRow>(
      `SELECT 
        p.id, p.order_id, p.provider, p.provider_order_id, p.provider_payment_id,
        p.status, p.amount_minor, p.currency, p.attempt_number, p.payment_method,
        p.created_at, p.updated_at, p.confirmed_at,
        o.order_number, o.status as order_status, o.subtotal_minor, o.discount_minor,
        o.shipping_minor, o.tax_minor, o.total_minor, o.created_at as order_created_at,
        o.paid_at, o.shipping_address_id, o.vehicle_id,
        v.registration_number as vehicle_plate, v.make as vehicle_make,
        v.model as vehicle_model, v.vehicle_type,
        a.recipient_name as address_name, a.phone as address_phone,
        a.line1 as address_line1, a.line2 as address_line2,
        a.city as address_city, a.state as address_state,
        a.postal_code as address_postal_code, a.country_code as address_country
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN vehicles v ON o.vehicle_id = v.id
       LEFT JOIN addresses a ON o.shipping_address_id = a.id
       WHERE o.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );
  } catch (err) {
    console.error("[PaymentsService] Failed to query payments:", err);
  }

  // 2. Fetch order items for all user orders
  let orderItemRows: DbOrderItemRow[] = [];
  const orderIds = Array.from(new Set(paymentRows.map((p) => p.order_id)));
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => "?").join(",");
    try {
      orderItemRows = await db.query<DbOrderItemRow>(
        `SELECT id, order_id, item_type, product_id, plan_id, catalog_code, name, quantity, unit_price_minor, total_price_minor
         FROM order_items
         WHERE order_id IN (${placeholders})`,
        orderIds
      );
    } catch (err) {
      console.warn("[PaymentsService] Failed to query order items:", err);
    }
  }

  // Group order items by order_id
  const itemsByOrder = new Map<string, DbOrderItemRow[]>();
  for (const item of orderItemRows) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  // 3. Fetch active QR stickers for vehicles
  const vehicleIds = Array.from(new Set(paymentRows.map((p) => p.vehicle_id).filter(Boolean))) as string[];
  let qrRows: DbQrAssignmentRow[] = [];
  if (vehicleIds.length > 0) {
    const placeholders = vehicleIds.map(() => "?").join(",");
    try {
      qrRows = await db.query<DbQrAssignmentRow>(
        `SELECT a.vehicle_id, s.id as qr_id, s.public_id, s.visible_code, s.status as qr_status
         FROM qr_assignments a
         JOIN qr_stickers s ON a.qr_id = s.id
         WHERE a.vehicle_id IN (${placeholders}) AND a.ended_at IS NULL`,
        vehicleIds
      );
    } catch (err) {
      console.warn("[PaymentsService] Failed to query QR stickers:", err);
    }
  }

  const qrByVehicle = new Map<string, DbQrAssignmentRow>();
  for (const qr of qrRows) {
    qrByVehicle.set(qr.vehicle_id, qr);
  }

  // 4. Map payment records
  const payments: PaymentRecordItem[] = paymentRows.map((p) => {
    const mappedStatus = mapPaymentStatus(p.status);
    const items = itemsByOrder.get(p.order_id) || [];
    const purposeInfo = determinePurpose(items);
    const qrData = p.vehicle_id ? qrByVehicle.get(p.vehicle_id) : undefined;

    let statusLabel = "Confirmed";
    if (mappedStatus === "PENDING") statusLabel = "Confirmation Pending";
    else if (mappedStatus === "FAILED") statusLabel = "Payment Incomplete";
    else if (mappedStatus === "REFUNDED") statusLabel = "Refunded";
    else if (mappedStatus === "REFUND_PENDING") statusLabel = "Refund Pending";

    // Safe customer reference: mask internal database ID, expose safe provider or order reference
    const paymentRef = p.provider_payment_id
      ? `${p.provider === "RAZORPAY" ? "RZP" : "PAY"}-${p.provider_payment_id.slice(-6).toUpperCase()}`
      : `PAY-${p.id.slice(-6).toUpperCase()}`;

    return {
      id: p.id,
      paymentReference: paymentRef,
      provider: p.provider,
      providerPaymentId: p.provider_payment_id,
      providerOrderId: p.provider_order_id,
      orderId: p.order_id,
      orderNumber: p.order_number,
      status: mappedStatus,
      statusLabel,
      amountMinor: p.amount_minor,
      currency: p.currency || "INR",
      paymentMethod: p.payment_method || (mappedStatus === "SUCCESS" ? "UPI / NetBanking" : null),
      purpose: purposeInfo.purpose,
      purposeLabel: purposeInfo.label,
      productDescription: purposeInfo.description,
      createdAt: p.created_at,
      confirmedAt: p.confirmed_at,
      attemptNumber: p.attempt_number,
      vehicle: p.vehicle_id && p.vehicle_plate
        ? {
            id: p.vehicle_id,
            plateNumber: p.vehicle_plate,
            makeModel: [p.vehicle_make, p.vehicle_model].filter(Boolean).join(" ") || "Registered Vehicle",
            vehicleType: p.vehicle_type || "FOUR_WHEELER",
          }
        : null,
      qrSticker: qrData
        ? {
            id: qrData.qr_id,
            publicId: qrData.public_id,
            visibleCode: qrData.visible_code,
            status: qrData.qr_status,
          }
        : null,
      billingAddress: p.address_name && p.address_line1
        ? {
            recipientName: p.address_name,
            phone: p.address_phone || "",
            line1: p.address_line1,
            line2: p.address_line2,
            city: p.address_city || "",
            state: p.address_state || "",
            postalCode: p.address_postal_code || "",
            countryCode: p.address_country || "IN",
          }
        : null,
      lineItems: items.map((i) => ({
        id: i.id,
        name: i.name,
        itemType: i.item_type as any,
        quantity: i.quantity,
        unitPriceMinor: i.unit_price_minor,
        totalPriceMinor: i.total_price_minor,
      })),
      subtotalMinor: p.subtotal_minor,
      discountMinor: p.discount_minor,
      shippingMinor: p.shipping_minor,
      taxMinor: p.tax_minor,
      totalMinor: p.total_minor,
      timeline: buildVerificationTimeline(p, mappedStatus),
      isInvoiceAvailable: mappedStatus === "SUCCESS",
    };
  });

  // 5. Aggregate Signal Metrics
  let totalConfirmedMinor = 0;
  let totalConfirmedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let lastVerifiedAt: string | null = null;

  for (const p of payments) {
    if (p.status === "SUCCESS") {
      totalConfirmedMinor += p.amountMinor;
      totalConfirmedCount += 1;
      if (!lastVerifiedAt || (p.confirmedAt && new Date(p.confirmedAt) > new Date(lastVerifiedAt))) {
        lastVerifiedAt = p.confirmedAt || p.createdAt;
      }
    } else if (p.status === "PENDING") {
      pendingCount += 1;
    } else {
      failedCount += 1;
    }
  }

  const signals: PaymentSignalMetrics = {
    totalConfirmedMinor,
    totalConfirmedCount,
    pendingCount,
    failedCount,
    lastVerifiedAt,
  };

  // 6. Aggregate Temporal Pulse Events
  const pulseEvents: PaymentPulseEvent[] = payments
    .filter((p) => p.status === "SUCCESS")
    .map((p) => ({
      id: p.id,
      date: p.confirmedAt || p.createdAt,
      amountMinor: p.amountMinor,
      orderNumber: p.orderNumber,
      purposeLabel: p.purposeLabel,
      status: p.status,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 7. State Composition
  const totalCount = payments.length;
  const stateComposition: PaymentStateComposition = {
    confirmedCount: totalConfirmedCount,
    pendingCount,
    failedCount,
    totalCount,
    allConfirmed: totalCount > 0 && totalConfirmedCount === totalCount,
  };

  // 8. Purpose Composition
  const purposeMap = new Map<PaymentPurposeCategory, { count: number; amountMinor: number; label: string }>();
  for (const p of payments) {
    if (p.status === "SUCCESS") {
      const entry = purposeMap.get(p.purpose) || { count: 0, amountMinor: 0, label: p.purposeLabel };
      entry.count += 1;
      entry.amountMinor += p.amountMinor;
      purposeMap.set(p.purpose, entry);
    }
  }

  const purposeComposition: PaymentPurposeItem[] = Array.from(purposeMap.entries()).map(([category, data]) => ({
    category,
    label: data.label,
    count: data.count,
    amountMinor: data.amountMinor,
    percentage: totalConfirmedMinor > 0 ? Math.round((data.amountMinor / totalConfirmedMinor) * 100) : 0,
  }));

  // 9. Attention Items
  const attentionItems: PaymentAttentionItem[] = [];
  for (const p of payments) {
    if (p.status === "PENDING") {
      attentionItems.push({
        id: `att-pend-${p.id}`,
        paymentId: p.id,
        orderNumber: p.orderNumber,
        type: "PENDING_VERIFICATION",
        title: "Payment Confirmation Pending",
        description: `Order ${p.orderNumber} is awaiting authoritative confirmation from ${p.provider || "Razorpay"}.`,
        actionLabel: "Check Status",
        actionType: "REFRESH",
      });
    } else if (p.status === "FAILED") {
      attentionItems.push({
        id: `att-fail-${p.id}`,
        paymentId: p.id,
        orderNumber: p.orderNumber,
        type: "PAYMENT_FAILED",
        title: "Payment Incomplete",
        description: `Transaction for order ${p.orderNumber} (₹${(p.amountMinor / 100).toFixed(0)}) was not completed.`,
        actionLabel: "Retry Payment",
        actionType: "RETRY",
      });
    }
  }

  // 10. Distinct Vehicles
  const vehicleMap = new Map<string, { id: string; plateNumber: string; label: string }>();
  for (const p of payments) {
    if (p.vehicle) {
      vehicleMap.set(p.vehicle.id, {
        id: p.vehicle.id,
        plateNumber: p.vehicle.plateNumber,
        label: `${p.vehicle.plateNumber} (${p.vehicle.makeModel})`,
      });
    }
  }

  return {
    payments,
    signals,
    pulseEvents,
    stateComposition,
    purposeComposition,
    attentionItems,
    vehicles: Array.from(vehicleMap.values()),
  };
}
