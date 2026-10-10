import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminError } from "../../../lib/session";
import { canReadModule, canSearchPhone } from "../../../lib/modules";
import { maskName, maskPhone, maskEmail, maskVehiclePlate } from "../../../lib/presentation";
import type {
  GlobalSearchResult,
  QrSearchResult,
  VehicleSearchResult,
  CustomerSearchResult,
  OrderSearchResult,
  BatchSearchResult,
  TransferSearchResult,
  PartnerSearchResult,
  ShipmentSearchResult,
  SupportSearchResult,
  SearchScope,
  SearchResponseData,
} from "../search.types";
import { classifySearchInput } from "./classify-query";
import { resolveExactEntityGraph } from "./get-entity-graph";

export async function executeOperationsSearch(
  identity: AdminIdentity,
  rawQuery: string,
  scope: SearchScope = "all",
  options: { phoneLookup?: boolean } = {}
): Promise<SearchResponseData> {
  const startTime = Date.now();
  const classification = classifySearchInput(rawQuery);
  const term = rawQuery.trim();

  if (term.length < 3) {
    return {
      results: [],
      groupedResults: {},
      exactMatch: null,
      latencyMs: Date.now() - startTime,
      totalCount: 0,
      classification,
    };
  }

  const supabase = getSupabaseAdminClient();

  // 1. Audited Phone Lookup (explicit or classified phone query)
  const isPhoneSearch = options.phoneLookup || classification.isSensitivePhone;
  if (isPhoneSearch) {
    if (!canSearchPhone(identity.role)) {
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Phone lookup is restricted to authorized support administrators."
      );
    }

    const digits = term.replace(/\D/g, "");
    if (!/^(?:91)?[6-9]\d{9}$/.test(digits)) {
      throw new AdminError(
        400,
        "INVALID_SEARCH",
        "Enter a complete 10-digit Indian mobile number."
      );
    }

    const phoneNumber = `+91${digits.slice(-10)}`;
    const { data: users, error } = await supabase
      .from("users")
      .select("id,full_name,primary_phone,primary_email,status,created_at")
      .eq("primary_phone", phoneNumber)
      .limit(10);

    if (error) throw error;

    // Record required audit log for sensitive phone lookup
    await supabase.from("admin_audit_logs").insert({
      actor_id: identity.id,
      action: "PHONE_SEARCH",
      resource_type: "customers",
      resource_id: "restricted-lookup",
      reason: "Audited customer phone search in Operations Console",
      request_id: crypto.randomUUID(),
      before_summary: {},
      after_summary: { matched: users?.length || 0 },
    });

    const results: CustomerSearchResult[] = (users || []).map((u) => ({
      id: u.id,
      entityType: "customer",
      reference: `CUST-••${u.id.slice(-4)}`,
      title: maskName(u.full_name),
      subtitle: maskPhone(u.primary_phone),
      fullName: maskName(u.full_name),
      primaryPhone: maskPhone(u.primary_phone),
      primaryEmail: maskEmail(u.primary_email),
      status: u.status || "ACTIVE",
      statusSeverity: u.status === "ACTIVE" ? "success" : "default",
      vehicleCount: 0,
      orderCount: 0,
      createdAt: u.created_at,
      href: `/customers?q=${encodeURIComponent(u.id)}`,
    }));

    const exactMatch = results.length === 1 ? await resolveExactEntityGraph(results[0]!) : null;

    return {
      results,
      groupedResults: { customer: results },
      exactMatch,
      latencyMs: Date.now() - startTime,
      totalCount: results.length,
      classification,
    };
  }

  // 2. Parallel Bounded Entity Searches based on Scope and Permissions
  const tasks: Promise<GlobalSearchResult[]>[] = [];

  const shouldSearch = (s: SearchScope, moduleKey: string) => {
    if (!canReadModule(identity.role, moduleKey)) return false;
    if (scope === "all") return true;
    return scope === s;
  };

  // --- QR Identities ---
  if (shouldSearch("qr", "inventory")) {
    tasks.push(
      (async () => {
        try {
          const q = supabase
            .from("qr_stickers")
            .select("id,public_id,visible_code,batch_id,status,lifecycle_state,activated_at,created_at")
            .or(`visible_code.ilike.%${term}%,public_id.ilike.%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          const { data } = await q;
          if (!data) return [];

          return data.map((r): QrSearchResult => ({
            id: r.id,
            entityType: "qr",
            reference: r.visible_code || r.public_id,
            title: r.visible_code || r.public_id,
            subtitle: `Lifecycle: ${r.lifecycle_state || r.status}`,
            publicId: r.public_id,
            visibleCode: r.visible_code,
            batchId: r.batch_id,
            batchReference: null,
            status: r.status,
            statusSeverity: r.status === "ACTIVATED" ? "success" : r.status === "BLOCKED" ? "error" : "default",
            lifecycleState: r.lifecycle_state || r.status,
            activatedAt: r.activated_at,
            createdAt: r.created_at,
            assignedVehicle: null,
            ownerCustomer: null,
            custody: r.status === "ACTIVATED" ? "Customer" : "Inventory",
            scanCount: 0,
            lastScanAt: null,
            href: `/inventory?q=${encodeURIComponent(r.visible_code || r.public_id)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Vehicles ---
  if (shouldSearch("vehicle", "vehicles")) {
    tasks.push(
      (async () => {
        try {
          const norm = classification.normalizedQuery || term.toUpperCase().replace(/[\s\-_.]/g, "");
          const { data } = await supabase
            .from("vehicles")
            .select("id,registration_number_normalized,vehicle_type,make,model,status,owner_user_id,created_at")
            .or(`registration_number_normalized.ilike.%${norm}%,make.ilike.%${term}%,model.ilike.%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (!data) return [];

          return data.map((v): VehicleSearchResult => ({
            id: v.id,
            entityType: "vehicle",
            reference: maskVehiclePlate(v.registration_number_normalized),
            title: maskVehiclePlate(v.registration_number_normalized),
            subtitle: `${v.make || ""} ${v.model || ""} · ${v.vehicle_type || "Vehicle"}`.trim(),
            registrationNumberNormalized: v.registration_number_normalized,
            registrationNumberDisplay: maskVehiclePlate(v.registration_number_normalized),
            vehicleType: v.vehicle_type || "Vehicle",
            make: v.make || "",
            model: v.model || "",
            status: v.status || "ACTIVE",
            statusSeverity: v.status === "ACTIVE" ? "success" : "default",
            createdAt: v.created_at,
            ownerCustomerId: v.owner_user_id,
            ownerCustomerName: null,
            assignedQrId: null,
            assignedQrCode: null,
            href: `/vehicles?q=${encodeURIComponent(v.registration_number_normalized)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Orders ---
  if (shouldSearch("order", "orders")) {
    tasks.push(
      (async () => {
        try {
          const { data } = await supabase
            .from("orders")
            .select("id,order_number,status,payment_state,total_minor,currency,paid_at,user_id,vehicle_id,created_at")
            .ilike("order_number", `%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (!data) return [];

          return data.map((o): OrderSearchResult => ({
            id: o.id,
            entityType: "order",
            reference: o.order_number,
            title: o.order_number,
            subtitle: `₹${Math.round(o.total_minor / 100)} · ${o.payment_state}`,
            orderNumber: o.order_number,
            status: o.payment_state || o.status,
            statusSeverity: o.payment_state === "PAID" ? "success" : o.payment_state === "FAILED" ? "error" : "warning",
            paymentState: o.payment_state,
            totalMinor: o.total_minor,
            currency: o.currency || "INR",
            paidAt: o.paid_at,
            createdAt: o.created_at,
            customerName: null,
            customerId: o.user_id,
            vehicleId: o.vehicle_id,
            assignedQrId: null,
            assignedQrCode: null,
            fulfillmentStatus: o.status,
            href: `/orders?q=${encodeURIComponent(o.order_number)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Batches ---
  if (shouldSearch("batch", "batches")) {
    tasks.push(
      (async () => {
        try {
          const { data } = await supabase
            .from("qr_batches")
            .select("id,reference_code,inventory_channel,quantity,status,manufacturer_name,printed_at,created_at")
            .or(`reference_code.ilike.%${term}%,manufacturer_name.ilike.%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (!data) return [];

          return data.map((b): BatchSearchResult => ({
            id: b.id,
            entityType: "batch",
            reference: b.reference_code,
            title: b.reference_code,
            subtitle: `${b.quantity.toLocaleString("en-IN")} units · ${b.inventory_channel}`,
            referenceCode: b.reference_code,
            inventoryChannel: b.inventory_channel,
            quantity: b.quantity,
            status: b.status,
            statusSeverity: b.status === "ACTIVE" ? "success" : "default",
            manufacturerName: b.manufacturer_name,
            printedAt: b.printed_at,
            createdAt: b.created_at,
            href: `/batches?q=${encodeURIComponent(b.reference_code)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Transfers ---
  if (shouldSearch("transfer", "transfers")) {
    tasks.push(
      (async () => {
        try {
          const { data } = await supabase
            .from("admin_stock_transfers")
            .select("id,reference_code,quantity,status,source_partner_id,destination_partner_id,created_at")
            .ilike("reference_code", `%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (!data) return [];

          return data.map((t): TransferSearchResult => ({
            id: t.id,
            entityType: "transfer",
            reference: t.reference_code,
            title: t.reference_code,
            subtitle: `${t.quantity.toLocaleString("en-IN")} QR identities`,
            referenceCode: t.reference_code,
            quantity: t.quantity,
            status: t.status,
            statusSeverity: t.status === "COMPLETED" ? "success" : t.status === "IN_TRANSIT" ? "warning" : "default",
            sourcePartnerId: t.source_partner_id,
            sourceName: null,
            destinationPartnerId: t.destination_partner_id,
            destinationName: null,
            createdAt: t.created_at,
            href: `/transfers?q=${encodeURIComponent(t.reference_code)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Partners (Distributors & Retailers) ---
  if (shouldSearch("partner", "distributors") || shouldSearch("partner", "retailers")) {
    tasks.push(
      (async () => {
        try {
          const { data } = await supabase
            .from("admin_partners")
            .select("id,reference_code,kind,name,city,state,status,created_at")
            .or(`reference_code.ilike.%${term}%,name.ilike.%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (!data) return [];

          return data.map((p): PartnerSearchResult => ({
            id: p.id,
            entityType: "partner",
            reference: p.reference_code,
            title: p.name,
            subtitle: `${p.kind === "DISTRIBUTOR" ? "Distributor" : "Retailer"} · ${p.city}`,
            referenceCode: p.reference_code,
            kind: p.kind as "DISTRIBUTOR" | "RETAILER",
            name: p.name,
            city: p.city,
            state: p.state || null,
            status: p.status,
            statusSeverity: p.status === "ACTIVE" ? "success" : "default",
            stockCount: null,
            createdAt: p.created_at,
            href: `/${p.kind === "DISTRIBUTOR" ? "distributors" : "retailers"}?q=${encodeURIComponent(p.reference_code)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Support Tickets ---
  if (shouldSearch("support", "support")) {
    tasks.push(
      (async () => {
        try {
          const { data } = await supabase
            .from("admin_support_tickets")
            .select("id,reference_code,subject,priority,status,customer_user_id,created_at")
            .or(`reference_code.ilike.%${term}%,subject.ilike.%${term}%`)
            .order("created_at", { ascending: false })
            .limit(8);

          if (!data) return [];

          return data.map((s): SupportSearchResult => ({
            id: s.id,
            entityType: "support",
            reference: s.reference_code,
            title: s.reference_code,
            subtitle: s.subject,
            referenceCode: s.reference_code,
            subject: s.subject,
            priority: s.priority,
            status: s.status,
            statusSeverity: s.status === "RESOLVED" || s.status === "CLOSED" ? "success" : "warning",
            customerId: s.customer_user_id,
            customerName: null,
            createdAt: s.created_at,
            href: `/support?q=${encodeURIComponent(s.reference_code)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // --- Customers (Name or ID only, never un-audited phone) ---
  if (shouldSearch("customer", "customers")) {
    tasks.push(
      (async () => {
        try {
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          let filter = `full_name.ilike.%${term}%,primary_email.ilike.%${term}%`;
          if (UUID_REGEX.test(term)) {
            filter += `,id.eq.${term}`;
          }

          const { data, error } = await supabase
            .from("users")
            .select("id,full_name,primary_phone,primary_email,status,created_at")
            .or(filter)
            .order("created_at", { ascending: false })
            .limit(6);

          if (error) {
            console.error("Customers search error:", error);
            return [];
          }
          if (!data) return [];

          return data.map((u): CustomerSearchResult => ({
            id: u.id,
            entityType: "customer",
            reference: `CUST-••${u.id.slice(-4)}`,
            title: maskName(u.full_name),
            subtitle: maskEmail(u.primary_email),
            fullName: maskName(u.full_name),
            primaryPhone: maskPhone(u.primary_phone),
            primaryEmail: maskEmail(u.primary_email),
            status: u.status || "ACTIVE",
            statusSeverity: u.status === "ACTIVE" ? "success" : "default",
            vehicleCount: 0,
            orderCount: 0,
            createdAt: u.created_at,
            href: `/customers?q=${encodeURIComponent(u.id)}`,
          }));
        } catch {
          return [];
        }
      })()
    );
  }

  // Execute all authorized queries concurrently
  const settled = await Promise.allSettled(tasks);
  const allResults: GlobalSearchResult[] = [];

  for (const s of settled) {
    if (s.status === "fulfilled") {
      allResults.push(...s.value);
    }
  }

  // Deterministic Ranking:
  // 1. Exact canonical reference match (case-insensitive)
  // 2. Exact normalized identifier match
  // 3. Prefix match
  // 4. Substring match
  const termLower = term.toLowerCase();
  const normalizedLower = classification.normalizedQuery.toLowerCase();

  allResults.sort((a, b) => {
    const aRef = a.reference.toLowerCase();
    const bRef = b.reference.toLowerCase();

    const aExact = aRef === termLower || aRef === normalizedLower;
    const bExact = bRef === termLower || bRef === normalizedLower;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = aRef.startsWith(termLower) || aRef.startsWith(normalizedLower);
    const bStarts = bRef.startsWith(termLower) || bRef.startsWith(normalizedLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Group by entity type
  const groupedResults: Partial<Record<SearchScope, GlobalSearchResult[]>> = {};
  for (const item of allResults) {
    if (!groupedResults[item.entityType]) {
      groupedResults[item.entityType] = [];
    }
    groupedResults[item.entityType]!.push(item);
  }

  // Exact Match Entity Graph:
  // If top result is an exact canonical match or solitary candidate, resolve its entity intelligence graph
  let exactMatch = null;
  const topResult = allResults[0];
  if (topResult) {
    const topRef = topResult.reference.toLowerCase();
    const topTitle = (topResult.title || "").toLowerCase();
    const isExact =
      topRef === termLower ||
      topRef === normalizedLower ||
      topTitle === termLower ||
      topTitle.startsWith(termLower) ||
      allResults.length === 1;

    if (isExact) {
      exactMatch = await resolveExactEntityGraph(topResult);
    }
  }

  return {
    results: allResults,
    groupedResults,
    exactMatch,
    latencyMs: Date.now() - startTime,
    totalCount: allResults.length,
    classification,
  };
}
