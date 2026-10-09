import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { getAuthoritativeObjectStore } from "@vaahansafe/storage";
import { getOtpDeliveryAvailability } from "@vaahansafe/notifications";
import { canReadModule, canSearchPhone, getAdminModule } from "./modules";
import { AdminError } from "./session";
import { maskAdminRow } from "./presentation";
import { adminSearchFilters } from "./search-filters";
import type {
  AdminIdentity,
  AdminList,
  AdminMetric,
  ConnectionCheck,
} from "./contracts";
export async function listAdminRecords(
  identity: AdminIdentity,
  key: string,
  input: { q?: string; status?: string; page?: number } = {},
): Promise<AdminList> {
  const m = getAdminModule(key);
  if (!m?.table || !m.fields || !canReadModule(identity.role, key))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "This module is not available for your role.",
    );
  const page = Math.max(1, Math.min(10000, Math.floor(input.page || 1))),
    pageSize = 25;
  let query = getSupabaseAdminClient()
    .from(m.table)
    .select(m.fields.join(","), { count: "exact" });
  if (key === "distributors" || key === "retailers")
    query = query.eq(
      "kind",
      key === "distributors" ? "DISTRIBUTOR" : "RETAILER",
    );
  if (key === "fraud") query = query.neq("outcome", "SUCCESS");
  if (key === "reports") query = query.eq("actor_id", identity.id);
  if (input.status && m.statusField)
    query = query.eq(m.statusField, input.status.slice(0, 50));
  const term = (input.q || "")
    .trim()
    .slice(0, 100)
    .replace(/[^\p{L}\p{N} @+_-]/gu, "");
  if (term && m.search?.length) {
    const filters = adminSearchFilters(
      m.search,
      term,
      key === "customers" ? ["id"] : key === "audit" ? ["request_id"] : [],
    );
    if (filters.length) query = query.or(filters.join(","));
  }
  const { data, count, error } = await query
    .order(m.orderField || "created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (error)
    throw new AdminError(
      503,
      "MODULE_UNAVAILABLE",
      "We couldn't load these records right now. Please try again.",
    );
  return {
    rows: (data || []).map((r) =>
      maskAdminRow(r as unknown as Record<string, unknown>),
    ),
    total: count || 0,
    page,
    pageSize,
  };
}
export async function dashboardMetrics(
  identity: AdminIdentity,
): Promise<AdminMetric[]> {
  const definitions = [
    {
      label: "QR identities",
      key: "inventory",
      table: "qr_stickers",
      detail: "Physical inventory records",
      filter: null,
    },
    {
      label: "Active subscriptions",
      key: "subscriptions",
      table: "subscriptions",
      detail: "Plan-backed service access",
      filter: "ACTIVE",
    },
    {
      label: "Confirmed orders",
      key: "orders",
      table: "orders",
      detail: "Verified paid orders",
      filter: "PAID",
    },
    {
      label: "Scan activity",
      key: "analytics",
      table: "qr_scan_events",
      detail: "Recorded scans · last 24 hours",
      filter: null,
    },
  ];
  return Promise.all(
    definitions
      .filter((d) => canReadModule(identity.role, d.key))
      .map(async (d) => {
        try {
          let q = getSupabaseAdminClient()
            .from(d.table)
            .select("id", { count: "exact", head: true });
          if (d.filter)
            q = q.eq(d.key === "orders" ? "payment_state" : "status", d.filter);
          if (d.key === "analytics")
            q = q.gte(
              "created_at",
              new Date(Date.now() - 86400000).toISOString(),
            );
          const { count, error } = await q;
          if (error) throw error;
          return {
            label: d.label,
            value: count,
            detail: d.detail,
            href: `/${d.key}`,
          };
        } catch {
          return {
            label: d.label,
            value: null,
            detail: "Temporarily unavailable",
            href: `/${d.key}`,
          };
        }
      }),
  );
}
export async function checkConnections(): Promise<ConnectionCheck[]> {
  const checkedAt = new Date().toISOString();
  const [database, storage] = await Promise.allSettled([
    (async () => {
      const { error } = await getSupabaseAdminClient()
        .from("admin_users")
        .select("id")
        .limit(1);
      if (error) throw error;
    })(),
    (async () => {
      await getAuthoritativeObjectStore("PUBLIC").head("admin/health-probe");
    })(),
  ]);
  return [
    {
      name: "Supabase database",
      state: database.status === "fulfilled" ? "connected" : "unavailable",
      checkedAt,
    },
    {
      name: "Cloudflare R2",
      state: storage.status === "fulfilled" ? "connected" : "unavailable",
      checkedAt,
    },
    {
      name: "Supabase password authentication",
      state:
        (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_SECRET_KEY)
          ? "connected"
          : "unconfigured",
      checkedAt,
    },
    {
      name: "MSG91 OTP",
      state:
        Object.values(getOtpDeliveryAvailability()).some(Boolean)
          ? "connected"
          : "unconfigured",
      checkedAt,
    },
    {
      name: "Supabase OTP protection",
      state:
        (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) &&
        (process.env.OTP_REQUEST_HASH_SECRET || process.env.SESSION_SECRET || "").length >= 16
          ? "connected"
          : "unconfigured",
      checkedAt,
    },
  ];
}
export async function searchWorkspace(
  identity: AdminIdentity,
  term: string,
  phone = false,
) {
  if (phone && !canSearchPhone(identity.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Phone lookup is restricted to authorized support staff.",
    );
  if (term.trim().length < 3) return [];
  const keys = [
    "inventory",
    "batches",
    "orders",
    "vehicles",
    "customers",
    "support",
    "shipping",
  ];
  const results = await Promise.all(
    keys
      .filter((key) => canReadModule(identity.role, key))
      .map(async (key) => {
        if (phone && key !== "customers") return null;
        if (phone) {
          const digits = term.replace(/\D/g, "");
          if (!/^(91)?[6-9]\d{9}$/.test(digits))
            throw new AdminError(
              400,
              "INVALID_SEARCH",
              "Enter a complete Indian mobile number.",
            );
          const phoneNumber = `+91${digits.slice(-10)}`;
          const { data, error } = await getSupabaseAdminClient()
            .from("users")
            .select(
              "id,full_name,primary_phone,primary_email,status,created_at",
            )
            .eq("primary_phone", phoneNumber)
            .limit(10);
          if (error) throw error;
          return {
            key,
            label: "Customers",
            rows: (data || []).map(maskAdminRow),
            unavailable: false,
          };
        }
        try {
          const list = await listAdminRecords(identity, key, {
            q:
              key === "vehicles"
                ? term.toUpperCase().replace(/[ -]/g, "")
                : term,
          });
          return {
            key,
            label: getAdminModule(key)!.label,
            rows: list.rows.slice(0, 8),
            unavailable: false,
          };
        } catch {
          return {
            key,
            label: getAdminModule(key)!.label,
            rows: [],
            unavailable: true,
          };
        }
      }),
  );
  if (phone) {
    const { error } = await getSupabaseAdminClient()
      .from("admin_audit_logs")
      .insert({
        actor_id: identity.id,
        action: "PHONE_SEARCH",
        resource_type: "customers",
        resource_id: "restricted-lookup",
        reason: "Permission-controlled customer phone lookup",
        request_id: crypto.randomUUID(),
        before_summary: {},
        after_summary: { matched: results[0]?.rows.length || 0 },
      });
    if (error) throw error;
  }
  return results.filter((r): r is NonNullable<typeof r> => !!r);
}
