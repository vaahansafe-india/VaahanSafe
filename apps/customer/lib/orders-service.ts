import { getAuthoritativeDatabaseClient } from "@vaahansafe/database";
import type {
  OrdersPageData,
  OrderListItem,
  OrderItemDetail,
  OrderVehicleRef,
  OrderQrRef,
  OrderAddressRef,
  OrderFulfilmentRef,
  OrderShipmentRef,
  OrderFulfillmentStage,
  FulfillmentRailStep,
  OrdersCategoryCounts,
} from "./orders-types";

interface DbOrder {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  shipping_address_id: string | null;
  vehicle_id: string | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

interface DbOrderItem {
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
  snapshot_json: string | null;
  created_at: string;
}

interface DbPayment {
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
}

interface DbFulfilment {
  id: string;
  order_id: string;
  user_id: string;
  type: string;
  status: string;
  shipping_address_snapshot_json: string;
  processing_at: string | null;
  packed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

interface DbShipment {
  id: string;
  fulfilment_id: string;
  order_id: string;
  user_id: string;
  provider: string;
  provider_shipment_id: string | null;
  tracking_reference: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

interface DbAddress {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
}

interface DbVehicle {
  id: string;
  user_id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
}

interface DbQrAssignment {
  id: string;
  qr_id: string;
  vehicle_id: string;
  user_id: string;
  assignment_type: string;
  public_id: string;
  visible_code: string;
  qr_status: string;
}

export async function getCustomerOrders(userId: string): Promise<OrdersPageData> {
  const db = getAuthoritativeDatabaseClient();

  // 1. Authoritative query: User orders
  const orders = await db.query<DbOrder>(
    `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  if (!orders || orders.length === 0) {
    const userVehicles = await db.query<DbVehicle>(
      `SELECT id, registration_number, make, model FROM vehicles WHERE user_id = ?`,
      [userId]
    );

    return {
      orders: [],
      counts: { all: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
      vehicles: (userVehicles || []).map((v) => ({
        id: v.id,
        plateNumber: v.registration_number,
        makeModel: [v.make, v.model].filter(Boolean).join(" ") || "Vehicle",
      })),
    };
  }

  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map(() => "?").join(",");

  // 2. Fetch related items, payments, fulfillments, shipments, addresses
  const [items, payments, fulfilments, shipments, addresses, vehicles, qrAssignments] =
    await Promise.all([
      db.query<DbOrderItem>(
        `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY created_at ASC`,
        orderIds
      ),
      db.query<DbPayment>(
        `SELECT * FROM payments WHERE order_id IN (${placeholders}) ORDER BY created_at DESC`,
        orderIds
      ),
      db.query<DbFulfilment>(
        `SELECT * FROM fulfilments WHERE order_id IN (${placeholders})`,
        orderIds
      ),
      db.query<DbShipment>(
        `SELECT * FROM shipments WHERE order_id IN (${placeholders})`,
        orderIds
      ),
      db.query<DbAddress>(
        `SELECT * FROM addresses WHERE user_id = ?`,
        [userId]
      ),
      db.query<DbVehicle>(
        `SELECT id, user_id, registration_number, make, model FROM vehicles WHERE user_id = ?`,
        [userId]
      ),
      db.query<DbQrAssignment>(
        `SELECT qa.id, qa.qr_id, qa.vehicle_id, qa.user_id, qa.assignment_type,
                qs.public_id, qs.visible_code, qs.status AS qr_status
         FROM qr_assignments qa
         JOIN qr_stickers qs ON qa.qr_id = qs.id
         WHERE qa.user_id = ?`,
        [userId]
      ),
    ]);

  // Index references by order ID
  const itemsByOrder = new Map<string, DbOrderItem[]>();
  for (const item of items || []) {
    const list = itemsByOrder.get(item.order_id) || [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const paymentByOrder = new Map<string, DbPayment>();
  for (const payment of payments || []) {
    if (!paymentByOrder.has(payment.order_id)) {
      paymentByOrder.set(payment.order_id, payment);
    }
  }

  const fulfilmentByOrder = new Map<string, DbFulfilment>();
  for (const f of fulfilments || []) {
    fulfilmentByOrder.set(f.order_id, f);
  }

  const shipmentByOrder = new Map<string, DbShipment>();
  for (const s of shipments || []) {
    shipmentByOrder.set(s.order_id, s);
  }

  const addressMap = new Map<string, DbAddress>();
  for (const a of addresses || []) {
    addressMap.set(a.id, a);
  }

  const vehicleMap = new Map<string, DbVehicle>();
  for (const v of vehicles || []) {
    vehicleMap.set(v.id, v);
  }

  const qrByVehicle = new Map<string, DbQrAssignment>();
  for (const qa of qrAssignments || []) {
    qrByVehicle.set(qa.vehicle_id, qa);
  }

  // 3. Transform to typed OrderListItem records
  const orderListItems: OrderListItem[] = orders.map((order) => {
    const orderItems = itemsByOrder.get(order.id) || [];
    const payment = paymentByOrder.get(order.id);
    const fulfilment = fulfilmentByOrder.get(order.id);
    const shipment = shipmentByOrder.get(order.id);
    const address = order.shipping_address_id ? addressMap.get(order.shipping_address_id) : null;
    const vehicle = order.vehicle_id ? vehicleMap.get(order.vehicle_id) : null;
    const qrAssignment = order.vehicle_id ? qrByVehicle.get(order.vehicle_id) : null;

    // Determine payment status strictly
    const isPaid =
      order.status === "PAID" ||
      order.status === "FULFILLED" ||
      order.status === "FULFILMENT_PENDING" ||
      payment?.status === "SUCCESS";

    const paymentStatus: "PAID" | "PENDING" | "FAILED" | "REFUNDED" = isPaid
      ? "PAID"
      : order.status === "PAYMENT_FAILED" || payment?.status === "FAILED"
      ? "FAILED"
      : order.status === "REFUNDED" || payment?.status === "REFUNDED"
      ? "REFUNDED"
      : "PENDING";

    // Determine fulfillment stage
    let fulfillmentStage: OrderFulfillmentStage = "ORDER_PLACED";
    if (order.status === "CANCELLED" || fulfilment?.status === "CANCELLED") {
      fulfillmentStage = "CANCELLED";
    } else if (shipment?.status === "DELIVERED" || fulfilment?.status === "DELIVERED") {
      fulfillmentStage = "DELIVERED";
    } else if (
      shipment?.status === "IN_TRANSIT" ||
      shipment?.status === "OUT_FOR_DELIVERY" ||
      fulfilment?.status === "SHIPPED"
    ) {
      fulfillmentStage = "SHIPPED";
    } else if (fulfilment?.status === "PACKED") {
      fulfillmentStage = "PACKED";
    } else if (isPaid || fulfilment?.status === "PROCESSING" || order.status === "FULFILMENT_PENDING") {
      fulfillmentStage = "PROCESSING";
    } else {
      fulfillmentStage = "ORDER_PLACED";
    }

    // Authoritative timeline steps
    const timelineSteps: FulfillmentRailStep[] = [
      {
        id: "placed",
        label: "Order Placed",
        sublabel: "Confirmed",
        state: "completed",
        timestamp: order.created_at,
        description: `Order ${order.order_number} recorded`,
      },
      {
        id: "payment",
        label: "Payment",
        sublabel: isPaid ? "Verified" : paymentStatus === "FAILED" ? "Failed" : "Pending",
        state: isPaid
          ? "completed"
          : paymentStatus === "FAILED"
          ? "failed"
          : "current",
        timestamp: order.paid_at || payment?.confirmed_at || undefined,
        description: isPaid
          ? "Authoritative Cashfree transaction verified"
          : "Awaiting payment verification",
      },
      {
        id: "processing",
        label: "Preparation",
        sublabel:
          fulfillmentStage === "PROCESSING"
            ? "In Progress"
            : ["PACKED", "SHIPPED", "DELIVERED"].includes(fulfillmentStage)
            ? "Allocated"
            : "Upcoming",
        state:
          fulfillmentStage === "PROCESSING"
            ? "current"
            : ["PACKED", "SHIPPED", "DELIVERED"].includes(fulfillmentStage)
            ? "completed"
            : "future",
        timestamp: fulfilment?.processing_at || (isPaid ? order.paid_at || order.created_at : undefined),
        description: "Physical QR kit allocated in fulfillment inventory",
      },
      {
        id: "packed",
        label: "Packed",
        sublabel:
          fulfillmentStage === "PACKED"
            ? "Packaging"
            : ["SHIPPED", "DELIVERED"].includes(fulfillmentStage)
            ? "Sealed"
            : "Upcoming",
        state:
          fulfillmentStage === "PACKED"
            ? "current"
            : ["SHIPPED", "DELIVERED"].includes(fulfillmentStage)
            ? "completed"
            : "future",
        timestamp: fulfilment?.packed_at || undefined,
        description: "Tamper-proof safety pack sealed with vehicle quick-start card",
      },
      {
        id: "shipped",
        label: "Shipped",
        sublabel:
          fulfillmentStage === "SHIPPED"
            ? "In Transit"
            : fulfillmentStage === "DELIVERED"
            ? "Dispatched"
            : "Upcoming",
        state:
          fulfillmentStage === "SHIPPED"
            ? "current"
            : fulfillmentStage === "DELIVERED"
            ? "completed"
            : "future",
        timestamp: shipment?.shipped_at || undefined,
        description: shipment?.tracking_reference
          ? `Dispatched via ${shipment.provider} (${shipment.tracking_reference})`
          : "Courier pickup scheduled",
      },
      {
        id: "delivered",
        label: "Delivered",
        sublabel: fulfillmentStage === "DELIVERED" ? "Completed" : "Final Step",
        state: fulfillmentStage === "DELIVERED" ? "completed" : "future",
        timestamp: shipment?.delivered_at || fulfilment?.completed_at || undefined,
        description: "Delivered to address. Ready to scan and activate.",
      },
    ];

    // Can cancel only if unpaid, or paid but not yet packed/shipped
    const canCancel =
      order.status !== "CANCELLED" &&
      fulfillmentStage !== "SHIPPED" &&
      fulfillmentStage !== "DELIVERED" &&
      fulfillmentStage !== "PACKED";

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      paymentStatus,
      paymentProvider: payment?.provider || "CASHFREE",
      paymentRef: payment?.provider_payment_id || payment?.provider_order_id || null,
      subtotalMinor: order.subtotal_minor,
      shippingMinor: order.shipping_minor,
      taxMinor: order.tax_minor,
      discountMinor: order.discount_minor,
      totalMinor: order.total_minor,
      currency: order.currency,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      items: orderItems.map((item) => ({
        id: item.id,
        name: item.name,
        catalogCode: item.catalog_code,
        quantity: item.quantity,
        unitPriceMinor: item.unit_price_minor,
        totalPriceMinor: item.total_price_minor,
        itemType: item.item_type,
      })),
      productMedia: {
        heroUrl: "/images/products/vaahansafe-qr-kit-hero.jpg",
        thumbUrl: "/images/products/vaahansafe-qr-sticker-thumb.jpg",
        detailUrl: "/images/products/vaahansafe-qr-sticker-thumb.jpg",
        altText: "VaahanSafe Automotive Safety QR Kit",
      },
      vehicle: vehicle
        ? {
            id: vehicle.id,
            plateNumber: vehicle.registration_number,
            makeModel: [vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle",
          }
        : null,
      qrSticker: qrAssignment
        ? {
            id: qrAssignment.qr_id,
            publicId: qrAssignment.public_id,
            visibleCode: qrAssignment.visible_code,
            status: qrAssignment.qr_status,
          }
        : null,
      shippingAddress: address
        ? {
            id: address.id,
            recipientName: address.recipient_name,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postal_code,
            phone: address.phone,
          }
        : null,
      fulfilment: fulfilment
        ? {
            id: fulfilment.id,
            status: fulfilment.status,
            processingAt: fulfilment.processing_at,
            packedAt: fulfilment.packed_at,
            completedAt: fulfilment.completed_at,
          }
        : null,
      shipment: shipment
        ? {
            id: shipment.id,
            provider: shipment.provider,
            trackingReference: shipment.tracking_reference,
            status: shipment.status,
            shippedAt: shipment.shipped_at,
            deliveredAt: shipment.delivered_at,
          }
        : null,
      fulfillmentStage,
      timelineSteps,
      canCancel,
    };
  });

  // 4. Calculate category counts
  const counts: OrdersCategoryCounts = {
    all: orderListItems.length,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const item of orderListItems) {
    if (item.fulfillmentStage === "CANCELLED") {
      counts.cancelled += 1;
    } else if (item.fulfillmentStage === "DELIVERED") {
      counts.delivered += 1;
    } else if (item.fulfillmentStage === "SHIPPED") {
      counts.shipped += 1;
    } else {
      counts.processing += 1;
    }
  }

  const vehiclesList: OrderVehicleRef[] = (vehicles || []).map((v) => ({
    id: v.id,
    plateNumber: v.registration_number,
    makeModel: [v.make, v.model].filter(Boolean).join(" ") || "Vehicle",
  }));

  return {
    orders: orderListItems,
    counts,
    vehicles: vehiclesList,
  };
}
