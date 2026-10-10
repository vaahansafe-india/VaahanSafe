import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type {
  ExactMatchData,
  GlobalSearchResult,
  OperationalLensData,
  ReferenceSpineNode,
  TimelineEvent,
  SearchScope,
} from "../search.types";
import { maskName, maskPhone, maskEmail, maskVehiclePlate } from "../../../lib/presentation";

function timeAgo(dateString?: string | null): string {
  if (!dateString) return "No activity";
  const ms = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export async function resolveExactEntityGraph(
  primaryResult: GlobalSearchResult
): Promise<ExactMatchData | null> {
  const supabase = getSupabaseAdminClient();

  if (primaryResult.entityType === "qr") {
    // 1. Resolve QR Sticker
    const { data: sticker } = await supabase
      .from("qr_stickers")
      .select("id,public_id,visible_code,batch_id,status,lifecycle_state,current_distributor_id,current_retailer_id,activated_at,created_at")
      .eq("id", primaryResult.id)
      .single();

    if (!sticker) return null;

    // 2. Resolve Batch
    let batch: { id: string; reference_code: string; inventory_channel: string } | null = null;
    if (sticker.batch_id) {
      const { data: b } = await supabase
        .from("qr_batches")
        .select("id,reference_code,inventory_channel")
        .eq("id", sticker.batch_id)
        .single();
      batch = b;
    }

    // 3. Resolve Current Assignment & Vehicle
    let vehicle: { id: string; registration_number_normalized: string; make: string; model: string; status: string } | null = null;
    let customer: { id: string; full_name: string; primary_phone: string; status: string } | null = null;

    const { data: assignment } = await supabase
      .from("qr_assignments")
      .select("vehicle_id,user_id,assigned_at")
      .eq("qr_id", sticker.id)
      .eq("is_current", 1)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignment) {
      if (assignment.vehicle_id) {
        const { data: v } = await supabase
          .from("vehicles")
          .select("id,registration_number_normalized,make,model,status")
          .eq("id", assignment.vehicle_id)
          .single();
        vehicle = v;
      }
      if (assignment.user_id) {
        const { data: u } = await supabase
          .from("users")
          .select("id,full_name,primary_phone,status")
          .eq("id", assignment.user_id)
          .single();
        customer = u;
      }
    }

    // 4. Resolve Order (if vehicle or customer exists)
    let order: { id: string; order_number: string; payment_state: string; total_minor: number } | null = null;
    if (vehicle?.id || customer?.id) {
      const query = supabase.from("orders").select("id,order_number,payment_state,total_minor");
      if (vehicle?.id) query.eq("vehicle_id", vehicle.id);
      else if (customer?.id) query.eq("user_id", customer.id);
      const { data: o } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
      order = o;
    }

    // 5. Resolve Scans
    const { data: scans, count: scanCount } = await supabase
      .from("qr_scan_events")
      .select("id,scan_type,result,city,state,created_at", { count: "exact" })
      .eq("qr_id", sticker.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // 6. Support cases count
    let supportCount = 0;
    if (customer?.id) {
      const { count: sc } = await supabase
        .from("admin_support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("customer_user_id", customer.id);
      supportCount = sc || 0;
    }

    const lastScan = scans?.[0];
    const custodyLabel =
      sticker.status === "ACTIVATED"
        ? "Activated / Customer"
        : sticker.current_retailer_id
        ? "Retailer Custody"
        : sticker.current_distributor_id
        ? "Distributor Custody"
        : sticker.status === "PRINTED"
        ? "Printed / Central Inventory"
        : "Central Inventory";

    // Build Operational Lens
    const lens: OperationalLensData = {
      identity: {
        label: "QR Identity",
        reference: sticker.visible_code || sticker.public_id,
        type: "Physical Security Identity",
        createdAt: formatDate(sticker.created_at),
        subLabel: batch?.reference_code ? `Batch ${batch.reference_code}` : undefined,
      },
      state: {
        lifecycle: sticker.lifecycle_state || sticker.status,
        status: sticker.status,
        custody: custodyLabel,
        alert: sticker.status === "BLOCKED" ? "Identity Blocked" : undefined,
      },
      relationships: {
        batch: batch ? { id: batch.id, reference: batch.reference_code, label: "Manufacturing Batch" } : undefined,
        vehicle: vehicle ? { id: vehicle.id, reference: maskVehiclePlate(vehicle.registration_number_normalized), label: `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Vehicle" } : undefined,
        customer: customer ? { id: customer.id, reference: `CUST-••${customer.id.slice(-4)}`, label: maskName(customer.full_name) } : undefined,
        order: order ? { id: order.id, reference: order.order_number, label: `₹${Math.round(order.total_minor / 100)} · ${order.payment_state}` } : undefined,
        support: { count: supportCount, openCount: supportCount },
        scans: { total: scanCount || 0, lastScanAt: lastScan ? timeAgo(lastScan.created_at) : undefined },
      },
      activity: {
        lastActivityLabel: lastScan ? `Scan recorded (${lastScan.city || "India"})` : sticker.activated_at ? "Activated" : "Created",
        lastActivityTimestamp: timeAgo(lastScan?.created_at || sticker.activated_at || sticker.created_at),
        totalEvents: (scanCount || 0) + (sticker.activated_at ? 1 : 0) + 1,
      },
    };

    // Build Reference Spine
    const spine: ReferenceSpineNode = {
      id: sticker.id,
      label: "QR Identity",
      type: "qr",
      reference: sticker.visible_code || sticker.public_id,
      status: sticker.status,
      active: true,
      children: [
        ...(batch ? [{
          id: batch.id,
          label: "Batch",
          type: "batch" as SearchScope,
          reference: batch.reference_code,
          meta: batch.inventory_channel,
        }] : []),
        ...(vehicle ? [{
          id: vehicle.id,
          label: "Vehicle",
          type: "vehicle" as SearchScope,
          reference: maskVehiclePlate(vehicle.registration_number_normalized),
          status: vehicle.status,
          meta: `${vehicle.make || ""} ${vehicle.model || ""}`.trim(),
        }] : []),
        ...(customer ? [{
          id: customer.id,
          label: "Customer",
          type: "customer" as SearchScope,
          reference: `CUST-••${customer.id.slice(-4)}`,
          meta: maskName(customer.full_name),
        }] : []),
        ...(order ? [{
          id: order.id,
          label: "Order",
          type: "order" as SearchScope,
          reference: order.order_number,
          status: order.payment_state,
        }] : []),
        ...(supportCount > 0 ? [{
          id: `sup-${sticker.id}`,
          label: "Support",
          type: "support" as SearchScope,
          reference: `${supportCount} tickets`,
        }] : []),
      ],
    };

    // Build Timeline Events
    const timeline: TimelineEvent[] = [];
    if (scans && scans.length > 0) {
      for (const s of scans) {
        timeline.push({
          id: s.id,
          title: `Scan event · ${s.result || "RESOLVED"}`,
          description: s.city ? `${s.city}, ${s.state || "India"}` : "Resolver hit recorded",
          timestamp: timeAgo(s.created_at),
          icon: "qr",
          severity: s.result === "BLOCKED" ? "error" : "success",
        });
      }
    }
    if (sticker.activated_at) {
      timeline.push({
        id: `act-${sticker.id}`,
        title: "QR Identity activated",
        description: vehicle ? `Bound to vehicle ${maskVehiclePlate(vehicle.registration_number_normalized)}` : "Verified ownership bound",
        timestamp: timeAgo(sticker.activated_at),
        icon: "check",
        severity: "success",
      });
    }
    if (batch) {
      timeline.push({
        id: `batch-${batch.id}`,
        title: "Lot manufacturing allocated",
        description: `Batch ${batch.reference_code} (${batch.inventory_channel})`,
        timestamp: timeAgo(sticker.created_at),
        icon: "layers",
      });
    }

    return {
      primaryResult,
      lens,
      spine,
      timeline,
    };
  }

  if (primaryResult.entityType === "vehicle") {
    // 1. Resolve Vehicle
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id,registration_number_normalized,vehicle_type,make,model,status,owner_user_id,created_at")
      .eq("id", primaryResult.id)
      .single();

    if (!vehicle) return null;

    // 2. Resolve Owner
    let customer: { id: string; full_name: string; primary_phone: string; status: string } | null = null;
    if (vehicle.owner_user_id) {
      const { data: u } = await supabase
        .from("users")
        .select("id,full_name,primary_phone,status")
        .eq("id", vehicle.owner_user_id)
        .single();
      customer = u;
    }

    // 3. Resolve Current QR assignment
    let sticker: { id: string; visible_code: string; public_id: string; status: string; batch_id: string | null } | null = null;
    const { data: assignment } = await supabase
      .from("qr_assignments")
      .select("qr_id")
      .eq("vehicle_id", vehicle.id)
      .eq("is_current", 1)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignment?.qr_id) {
      const { data: s } = await supabase
        .from("qr_stickers")
        .select("id,visible_code,public_id,status,batch_id")
        .eq("id", assignment.qr_id)
        .single();
      sticker = s;
    }

    // 4. Resolve Order
    const { data: order } = await supabase
      .from("orders")
      .select("id,order_number,payment_state,total_minor")
      .eq("vehicle_id", vehicle.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lens: OperationalLensData = {
      identity: {
        label: "Vehicle",
        reference: maskVehiclePlate(vehicle.registration_number_normalized),
        type: vehicle.vehicle_type || "Motor Vehicle",
        createdAt: formatDate(vehicle.created_at),
        subLabel: `${vehicle.make || ""} ${vehicle.model || ""}`.trim(),
      },
      state: {
        lifecycle: vehicle.status,
        status: vehicle.status,
        custody: customer ? "Customer Owned" : "Unassigned",
      },
      relationships: {
        customer: customer ? { id: customer.id, reference: `CUST-••${customer.id.slice(-4)}`, label: maskName(customer.full_name) } : undefined,
        vehicle: { id: vehicle.id, reference: maskVehiclePlate(vehicle.registration_number_normalized), label: vehicle.registration_number_normalized },
        order: order ? { id: order.id, reference: order.order_number, label: `₹${Math.round(order.total_minor / 100)}` } : undefined,
      },
      activity: {
        lastActivityLabel: "Profile updated",
        lastActivityTimestamp: timeAgo(vehicle.created_at),
        totalEvents: 2,
      },
    };

    const spine: ReferenceSpineNode = {
      id: vehicle.id,
      label: "Vehicle",
      type: "vehicle",
      reference: maskVehiclePlate(vehicle.registration_number_normalized),
      status: vehicle.status,
      active: true,
      children: [
        ...(sticker ? [{
          id: sticker.id,
          label: "QR Identity",
          type: "qr" as SearchScope,
          reference: sticker.visible_code || sticker.public_id,
          status: sticker.status,
        }] : []),
        ...(customer ? [{
          id: customer.id,
          label: "Owner",
          type: "customer" as SearchScope,
          reference: `CUST-••${customer.id.slice(-4)}`,
          meta: maskName(customer.full_name),
        }] : []),
        ...(order ? [{
          id: order.id,
          label: "Order",
          type: "order" as SearchScope,
          reference: order.order_number,
          status: order.payment_state,
        }] : []),
      ],
    };

    return {
      primaryResult,
      lens,
      spine,
      timeline: [
        {
          id: `veh-${vehicle.id}`,
          title: "Vehicle profile active",
          description: `${vehicle.make || ""} ${vehicle.model || ""} registered in identity network`,
          timestamp: timeAgo(vehicle.created_at),
          icon: "vehicle",
          severity: "success",
        },
      ],
    };
  }

  if (primaryResult.entityType === "order") {
    // 1. Resolve Order
    const { data: order } = await supabase
      .from("orders")
      .select("id,order_number,user_id,vehicle_id,status,payment_state,total_minor,currency,paid_at,created_at")
      .eq("id", primaryResult.id)
      .single();

    if (!order) return null;

    // 2. Resolve Customer
    let customer: { id: string; full_name: string; primary_phone: string } | null = null;
    if (order.user_id) {
      const { data: u } = await supabase
        .from("users")
        .select("id,full_name,primary_phone")
        .eq("id", order.user_id)
        .single();
      customer = u;
    }

    // 3. Resolve Vehicle
    let vehicle: { id: string; registration_number_normalized: string } | null = null;
    if (order.vehicle_id) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("id,registration_number_normalized")
        .eq("id", order.vehicle_id)
        .single();
      vehicle = v;
    }

    // 4. Resolve Shipment
    const { data: shipment } = await supabase
      .from("shipments")
      .select("id,tracking_reference,courier_code,status,shipped_at,delivered_at")
      .eq("order_id", order.id)
      .maybeSingle();

    const lens: OperationalLensData = {
      identity: {
        label: "Order",
        reference: order.order_number,
        type: "Online QR Purchase",
        createdAt: formatDate(order.created_at),
        subLabel: `₹${Math.round(order.total_minor / 100)}`,
      },
      state: {
        lifecycle: order.status,
        status: order.payment_state,
        custody: shipment ? `Courier · ${shipment.status}` : "Processing",
      },
      relationships: {
        customer: customer ? { id: customer.id, reference: `CUST-••${customer.id.slice(-4)}`, label: maskName(customer.full_name) } : undefined,
        vehicle: vehicle ? { id: vehicle.id, reference: maskVehiclePlate(vehicle.registration_number_normalized), label: "Target vehicle" } : undefined,
      },
      activity: {
        lastActivityLabel: order.paid_at ? "Payment confirmed" : "Order placed",
        lastActivityTimestamp: timeAgo(order.paid_at || order.created_at),
        totalEvents: order.paid_at ? 2 : 1,
      },
    };

    const spine: ReferenceSpineNode = {
      id: order.id,
      label: "Order",
      type: "order",
      reference: order.order_number,
      status: order.payment_state,
      active: true,
      children: [
        ...(customer ? [{
          id: customer.id,
          label: "Customer",
          type: "customer" as SearchScope,
          reference: `CUST-••${customer.id.slice(-4)}`,
          meta: maskName(customer.full_name),
        }] : []),
        ...(vehicle ? [{
          id: vehicle.id,
          label: "Vehicle",
          type: "vehicle" as SearchScope,
          reference: maskVehiclePlate(vehicle.registration_number_normalized),
        }] : []),
        ...(shipment ? [{
          id: shipment.id,
          label: "Shipment",
          type: "shipment" as SearchScope,
          reference: shipment.tracking_reference,
          status: shipment.status,
          meta: shipment.courier_code,
        }] : []),
      ],
    };

    const timeline: TimelineEvent[] = [
      {
        id: `ord-create-${order.id}`,
        title: "Order placed",
        description: `Order ${order.order_number} created with total ₹${Math.round(order.total_minor / 100)}`,
        timestamp: timeAgo(order.created_at),
        icon: "file",
      },
    ];

    if (order.paid_at) {
      timeline.unshift({
        id: `ord-paid-${order.id}`,
        title: "Payment confirmed (Authoritative)",
        description: "Cashfree payment verified server-side",
        timestamp: timeAgo(order.paid_at),
        icon: "check",
        severity: "success",
      });
    }

    if (shipment?.delivered_at) {
      timeline.unshift({
        id: `ship-del-${shipment.id}`,
        title: "Shipment delivered",
        description: `Delivered by ${shipment.courier_code}`,
        timestamp: timeAgo(shipment.delivered_at),
        icon: "route",
        severity: "success",
      });
    }

    return {
      primaryResult,
      lens,
      spine,
      timeline,
    };
  }

  if (primaryResult.entityType === "customer") {
    const { data: user } = await supabase
      .from("users")
      .select("id,full_name,primary_phone,primary_email,status,created_at")
      .eq("id", primaryResult.id)
      .single();

    if (!user) return null;

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id,registration_number_normalized,make,model,status")
      .eq("owner_user_id", user.id)
      .limit(5);

    const { data: orders } = await supabase
      .from("orders")
      .select("id,order_number,status,payment_state,total_minor")
      .eq("user_id", user.id)
      .limit(5);

    const { count: supportCount } = await supabase
      .from("admin_support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("customer_user_id", user.id);

    const firstVehicle = vehicles?.[0];
    const firstOrder = orders?.[0];

    const lens: OperationalLensData = {
      identity: {
        label: "Customer Account",
        reference: `CUST-••${user.id.slice(-4)}`,
        type: maskName(user.full_name),
        createdAt: formatDate(user.created_at),
        subLabel: maskEmail(user.primary_email),
      },
      state: {
        lifecycle: user.status || "ACTIVE",
        status: user.status || "ACTIVE",
        custody: "Verified Customer",
      },
      relationships: {
        customer: { id: user.id, reference: `CUST-••${user.id.slice(-4)}`, label: maskName(user.full_name) },
        vehicle: firstVehicle ? { id: firstVehicle.id, reference: maskVehiclePlate(firstVehicle.registration_number_normalized), label: `${firstVehicle.make || ""} ${firstVehicle.model || ""}`.trim() || "Vehicle" } : undefined,
        order: firstOrder ? { id: firstOrder.id, reference: firstOrder.order_number, label: `₹${Math.round(firstOrder.total_minor / 100)}` } : undefined,
        support: { count: supportCount || 0, openCount: supportCount || 0 },
      },
      activity: {
        lastActivityLabel: "Account registered",
        lastActivityTimestamp: timeAgo(user.created_at),
        totalEvents: (vehicles?.length || 0) + (orders?.length || 0) + 1,
      },
    };

    const spine: ReferenceSpineNode = {
      id: user.id,
      label: "Customer",
      type: "customer",
      reference: maskName(user.full_name),
      status: user.status,
      active: true,
      children: [
        ...(vehicles || []).map((v) => ({
          id: v.id,
          label: "Vehicle",
          type: "vehicle" as SearchScope,
          reference: maskVehiclePlate(v.registration_number_normalized),
          status: v.status,
          meta: `${v.make || ""} ${v.model || ""}`.trim(),
        })),
        ...(orders || []).map((o) => ({
          id: o.id,
          label: "Order",
          type: "order" as SearchScope,
          reference: o.order_number,
          status: o.payment_state,
        })),
        ...(supportCount ? [{
          id: `sup-${user.id}`,
          label: "Support",
          type: "support" as SearchScope,
          reference: `${supportCount} tickets`,
        }] : []),
      ],
    };

    const timeline: TimelineEvent[] = [
      {
        id: `cust-reg-${user.id}`,
        title: "Customer registered",
        description: `Account created for ${maskName(user.full_name)}`,
        timestamp: timeAgo(user.created_at),
        icon: "users",
        severity: "success",
      },
    ];

    return {
      primaryResult,
      lens,
      spine,
      timeline,
    };
  }

  // Fallback for batch, transfer, etc.
  const lens: OperationalLensData = {
    identity: {
      label: primaryResult.title,
      reference: primaryResult.reference,
      type: primaryResult.subtitle || primaryResult.entityType.toUpperCase(),
      createdAt: formatDate(primaryResult.createdAt),
    },
    state: {
      lifecycle: primaryResult.status,
      status: primaryResult.status,
      custody: "Operational Ledger",
    },
    relationships: {},
    activity: {
      lastActivityLabel: "Record created",
      lastActivityTimestamp: timeAgo(primaryResult.createdAt),
      totalEvents: 1,
    },
  };

  const spine: ReferenceSpineNode = {
    id: primaryResult.id,
    label: primaryResult.title,
    type: primaryResult.entityType,
    reference: primaryResult.reference,
    status: primaryResult.status,
    active: true,
    children: [],
  };

  return {
    primaryResult,
    lens,
    spine,
    timeline: [
      {
        id: `rec-${primaryResult.id}`,
        title: `${primaryResult.title} record created`,
        description: `Reference ${primaryResult.reference} registered in operational database`,
        timestamp: timeAgo(primaryResult.createdAt),
        icon: "file",
      },
    ],
  };
}
