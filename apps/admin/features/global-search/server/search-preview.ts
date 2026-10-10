import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import { AdminError } from "../../../lib/session";
import { maskName, maskPhone, maskEmail, maskVehiclePlate } from "../../../lib/presentation";
import type { EntityPreviewData, SearchScope, TimelineEvent } from "../search.types";

function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function getEntityPreview(
  identity: AdminIdentity,
  entityType: SearchScope,
  id: string
): Promise<EntityPreviewData> {
  const supabase = getSupabaseAdminClient();

  if (entityType === "qr") {
    if (!canReadModule(identity.role, "inventory")) {
      throw new AdminError(403, "FORBIDDEN", "Unauthorized to view QR identities.");
    }

    const { data: s } = await supabase
      .from("qr_stickers")
      .select("id,public_id,visible_code,batch_id,status,lifecycle_state,current_distributor_id,current_retailer_id,activated_at,created_at")
      .eq("id", id)
      .single();

    if (!s) throw new AdminError(404, "NOT_FOUND", "QR record not found.");

    // Related batch
    let batch = null;
    if (s.batch_id) {
      const { data: b } = await supabase
        .from("qr_batches")
        .select("id,reference_code,inventory_channel,quantity")
        .eq("id", s.batch_id)
        .single();
      batch = b;
    }

    // Related assignment
    const { data: assignment } = await supabase
      .from("qr_assignments")
      .select("vehicle_id,user_id,assigned_at")
      .eq("qr_id", s.id)
      .eq("is_current", 1)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let vehicle = null;
    let customer = null;
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
          .select("id,full_name,primary_phone,primary_email,status")
          .eq("id", assignment.user_id)
          .single();
        customer = u;
      }
    }

    // Scan stats
    const { data: scans, count: scanCount } = await supabase
      .from("qr_scan_events")
      .select("id,scan_type,result,city,state,created_at", { count: "exact" })
      .eq("qr_id", s.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const relatedEntities = [];
    if (batch) {
      relatedEntities.push({
        label: "Manufacturing Lot",
        entityType: "batch" as SearchScope,
        id: batch.id,
        reference: batch.reference_code,
        title: `Batch ${batch.reference_code}`,
        meta: batch.inventory_channel,
      });
    }
    if (vehicle) {
      relatedEntities.push({
        label: "Bound Vehicle",
        entityType: "vehicle" as SearchScope,
        id: vehicle.id,
        reference: maskVehiclePlate(vehicle.registration_number_normalized),
        title: `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Vehicle",
        meta: vehicle.status,
      });
    }
    if (customer) {
      relatedEntities.push({
        label: "Account Owner",
        entityType: "customer" as SearchScope,
        id: customer.id,
        reference: `CUST-••${customer.id.slice(-4)}`,
        title: maskName(customer.full_name),
        meta: maskPhone(customer.primary_phone),
      });
    }

    const activity: TimelineEvent[] = (scans || []).map((sc) => ({
      id: sc.id,
      title: `Scan: ${sc.result || "RESOLVED"}`,
      description: sc.city ? `${sc.city}, ${sc.state || "India"}` : "Resolver access recorded",
      timestamp: formatDate(sc.created_at),
      icon: "qr",
      severity: sc.result === "BLOCKED" ? "error" : "success",
    }));

    return {
      entityType: "qr",
      id: s.id,
      reference: s.visible_code || s.public_id,
      title: `QR ${s.visible_code || s.public_id}`,
      status: s.status,
      statusSeverity: s.status === "ACTIVATED" ? "success" : s.status === "BLOCKED" ? "error" : "default",
      createdAt: formatDate(s.created_at),
      href: `/inventory?q=${encodeURIComponent(s.visible_code || s.public_id)}`,
      sections: [
        {
          heading: "Identity & Physical Metadata",
          fields: [
            { label: "Visible Code", value: s.visible_code, isCode: true },
            { label: "Public Identifier", value: s.public_id, isCode: true },
            { label: "Lifecycle State", value: s.lifecycle_state || s.status },
            { label: "Created At", value: formatDate(s.created_at) },
            { label: "Activated At", value: formatDate(s.activated_at) },
          ],
        },
        {
          heading: "Custody & Distribution",
          fields: [
            {
              label: "Current Custody",
              value:
                s.status === "ACTIVATED"
                  ? "Customer Custody"
                  : s.current_retailer_id
                  ? "Retail Partner"
                  : s.current_distributor_id
                  ? "Distribution Network"
                  : "Central Warehouse",
            },
            { label: "Total Scans Recorded", value: scanCount || 0 },
            { label: "Last Scan Event", value: scans?.[0] ? formatDate(scans[0].created_at) : "None recorded" },
          ],
        },
      ],
      relatedEntities,
      activity,
    };
  }

  if (entityType === "vehicle") {
    if (!canReadModule(identity.role, "vehicles")) {
      throw new AdminError(403, "FORBIDDEN", "Unauthorized to view vehicles.");
    }

    const { data: v } = await supabase
      .from("vehicles")
      .select("id,registration_number_normalized,vehicle_type,make,model,status,owner_user_id,created_at")
      .eq("id", id)
      .single();

    if (!v) throw new AdminError(404, "NOT_FOUND", "Vehicle record not found.");

    let customer = null;
    if (v.owner_user_id) {
      const { data: u } = await supabase
        .from("users")
        .select("id,full_name,primary_phone,primary_email,status")
        .eq("id", v.owner_user_id)
        .single();
      customer = u;
    }

    const { data: assignment } = await supabase
      .from("qr_assignments")
      .select("qr_id")
      .eq("vehicle_id", v.id)
      .eq("is_current", 1)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let qr = null;
    if (assignment?.qr_id) {
      const { data: s } = await supabase
        .from("qr_stickers")
        .select("id,visible_code,public_id,status")
        .eq("id", assignment.qr_id)
        .single();
      qr = s;
    }

    const relatedEntities = [];
    if (qr) {
      relatedEntities.push({
        label: "Assigned QR Identity",
        entityType: "qr" as SearchScope,
        id: qr.id,
        reference: qr.visible_code || qr.public_id,
        title: `QR ${qr.visible_code || qr.public_id}`,
        meta: qr.status,
      });
    }
    if (customer) {
      relatedEntities.push({
        label: "Registered Owner",
        entityType: "customer" as SearchScope,
        id: customer.id,
        reference: `CUST-••${customer.id.slice(-4)}`,
        title: maskName(customer.full_name),
        meta: maskPhone(customer.primary_phone),
      });
    }

    return {
      entityType: "vehicle",
      id: v.id,
      reference: maskVehiclePlate(v.registration_number_normalized),
      title: `${v.make || ""} ${v.model || ""}`.trim() || "Vehicle",
      status: v.status,
      statusSeverity: v.status === "ACTIVE" ? "success" : "default",
      createdAt: formatDate(v.created_at),
      href: `/vehicles?q=${encodeURIComponent(v.registration_number_normalized)}`,
      sections: [
        {
          heading: "Registration & Specs",
          fields: [
            { label: "Registration Plate", value: maskVehiclePlate(v.registration_number_normalized), isCode: true },
            { label: "Vehicle Type", value: v.vehicle_type || "Motor Vehicle" },
            { label: "Make / Manufacturer", value: v.make || "—" },
            { label: "Model", value: v.model || "—" },
            { label: "Registration Date", value: formatDate(v.created_at) },
          ],
        },
      ],
      relatedEntities,
    };
  }

  if (entityType === "order") {
    if (!canReadModule(identity.role, "orders")) {
      throw new AdminError(403, "FORBIDDEN", "Unauthorized to view orders.");
    }

    const { data: o } = await supabase
      .from("orders")
      .select("id,order_number,user_id,vehicle_id,status,payment_state,total_minor,currency,paid_at,created_at")
      .eq("id", id)
      .single();

    if (!o) throw new AdminError(404, "NOT_FOUND", "Order record not found.");

    let customer = null;
    if (o.user_id) {
      const { data: u } = await supabase
        .from("users")
        .select("id,full_name,primary_phone")
        .eq("id", o.user_id)
        .single();
      customer = u;
    }

    const { data: shipment } = await supabase
      .from("shipments")
      .select("id,tracking_reference,courier_code,status,shipped_at,delivered_at")
      .eq("order_id", o.id)
      .maybeSingle();

    const relatedEntities = [];
    if (customer) {
      relatedEntities.push({
        label: "Customer Account",
        entityType: "customer" as SearchScope,
        id: customer.id,
        reference: `CUST-••${customer.id.slice(-4)}`,
        title: maskName(customer.full_name),
      });
    }
    if (shipment) {
      relatedEntities.push({
        label: "Courier Shipment",
        entityType: "shipment" as SearchScope,
        id: shipment.id,
        reference: shipment.tracking_reference,
        title: `Waybill ${shipment.tracking_reference}`,
        meta: shipment.courier_code,
      });
    }

    return {
      entityType: "order",
      id: o.id,
      reference: o.order_number,
      title: `Order ${o.order_number}`,
      status: o.payment_state || o.status,
      statusSeverity: o.payment_state === "PAID" ? "success" : o.payment_state === "FAILED" ? "error" : "warning",
      createdAt: formatDate(o.created_at),
      href: `/orders?q=${encodeURIComponent(o.order_number)}`,
      sections: [
        {
          heading: "Financial & Payment Gate",
          fields: [
            { label: "Order Reference", value: o.order_number, isCode: true },
            { label: "Payment State", value: o.payment_state },
            { label: "Authoritative Total", value: `₹${(o.total_minor / 100).toFixed(2)} ${o.currency}` },
            { label: "Paid Timestamp", value: formatDate(o.paid_at) },
            { label: "Fulfilment State", value: o.status },
          ],
        },
      ],
      relatedEntities,
    };
  }

  if (entityType === "batch") {
    if (!canReadModule(identity.role, "batches")) {
      throw new AdminError(403, "FORBIDDEN", "Unauthorized to view batches.");
    }

    const { data: b } = await supabase
      .from("qr_batches")
      .select("id,reference_code,inventory_channel,quantity,status,manufacturer_name,printed_at,created_at")
      .eq("id", id)
      .single();

    if (!b) throw new AdminError(404, "NOT_FOUND", "Batch record not found.");

    return {
      entityType: "batch",
      id: b.id,
      reference: b.reference_code,
      title: `Batch ${b.reference_code}`,
      status: b.status,
      statusSeverity: b.status === "ACTIVE" ? "success" : "default",
      createdAt: formatDate(b.created_at),
      href: `/batches?q=${encodeURIComponent(b.reference_code)}`,
      sections: [
        {
          heading: "Manufacturing Details",
          fields: [
            { label: "Reference Code", value: b.reference_code, isCode: true },
            { label: "Inventory Channel", value: b.inventory_channel },
            { label: "Total Manufactured Lot", value: `${b.quantity.toLocaleString("en-IN")} units` },
            { label: "Manufacturer", value: b.manufacturer_name || "VaahanSafe Direct" },
            { label: "Print Recorded", value: formatDate(b.printed_at) },
          ],
        },
      ],
      relatedEntities: [],
    };
  }

  if (entityType === "customer") {
    if (!canReadModule(identity.role, "customers")) {
      throw new AdminError(403, "FORBIDDEN", "Unauthorized to view customers.");
    }

    const { data: u } = await supabase
      .from("users")
      .select("id,full_name,primary_phone,primary_email,status,created_at")
      .eq("id", id)
      .single();

    if (!u) throw new AdminError(404, "NOT_FOUND", "Customer record not found.");

    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id,registration_number_normalized,make,model,status")
      .eq("owner_user_id", u.id)
      .limit(5);

    const { data: orders } = await supabase
      .from("orders")
      .select("id,order_number,status,payment_state,total_minor")
      .eq("user_id", u.id)
      .limit(5);

    const relatedEntities = [];
    if (vehicles) {
      for (const v of vehicles) {
        relatedEntities.push({
          label: "Registered Vehicle",
          entityType: "vehicle" as SearchScope,
          id: v.id,
          reference: maskVehiclePlate(v.registration_number_normalized),
          title: `${v.make || ""} ${v.model || ""}`.trim() || "Vehicle",
          meta: v.status,
        });
      }
    }
    if (orders) {
      for (const o of orders) {
        relatedEntities.push({
          label: "Customer Order",
          entityType: "order" as SearchScope,
          id: o.id,
          reference: o.order_number,
          title: `Order ${o.order_number}`,
          meta: o.payment_state,
        });
      }
    }

    return {
      entityType: "customer",
      id: u.id,
      reference: `CUST-••${u.id.slice(-4)}`,
      title: maskName(u.full_name),
      status: u.status || "ACTIVE",
      statusSeverity: u.status === "ACTIVE" ? "success" : "default",
      createdAt: formatDate(u.created_at),
      href: `/customers?q=${encodeURIComponent(u.id)}`,
      sections: [
        {
          heading: "Account Identity (Masked)",
          fields: [
            { label: "Account Name", value: maskName(u.full_name) },
            { label: "Contact Phone", value: maskPhone(u.primary_phone) },
            { label: "Primary Email", value: maskEmail(u.primary_email) },
            { label: "Account Status", value: u.status || "ACTIVE" },
            { label: "Registered At", value: formatDate(u.created_at) },
          ],
        },
      ],
      relatedEntities,
    };
  }

  // Fallback for generic entity
  return {
    entityType,
    id,
    reference: id,
    title: `${entityType.toUpperCase()} Record`,
    status: "ACTIVE",
    createdAt: formatDate(new Date().toISOString()),
    href: `/${entityType}`,
    sections: [
      {
        heading: "Record Details",
        fields: [{ label: "Identifier", value: id, isCode: true }],
      },
    ],
    relatedEntities: [],
  };
}
