import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import { AdminError } from "../../../lib/session";
import { canReadModule } from "../../../lib/modules";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  DistributorDetail,
  DistributorFilters,
  DistributorPage,
  DistributorRow,
  DistributorSummary,
} from "../distributor.types";
import { decodeDistributorCursor } from "../distributor.filters";
import { distributorSchema } from "../distributor.schema";
import { canManageDistributors } from "../distributor.permissions";

export async function assertDistributorExportAvailable(
  moduleKey = "distributors",
) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID,
    token = process.env.CLOUDFLARE_API_TOKEN;
  if (account && token) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/workers/scripts/vaahansafe-admin-exports/settings`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        },
      );
      if (response.ok) {
        const result = (await response.json()) as {
          success?: boolean;
          result?: {
            bindings?: {
              name: string;
              type: string;
              bucket_name?: string;
              text?: string;
            }[];
          };
        };
        const bindings = result.result?.bindings || [];
        if (
          (moduleKey !== "retailers" ||
            bindings.some(
              (b) =>
                b.name === "RETAILER_EXPORTS_ENABLED" &&
                b.type === "plain_text" &&
                b.text === "true",
            )) &&
          result.success &&
          ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].every((name) =>
            bindings.some((b) => b.name === name && b.type === "secret_text"),
          ) &&
          bindings.some(
            (b) =>
              b.name === "EXPORT_STORAGE" &&
              b.type === "r2_bucket" &&
              b.bucket_name === process.env.CLOUDFLARE_R2_EXPORTS_BUCKET,
          )
        )
          return;
      }
    } catch {
      /* Return the same recoverable availability state for provider failures. */
    }
  }
  throw new AdminError(
    503,
    "EXPORT_UNAVAILABLE",
    "Partner reports are temporarily unavailable. Please try again later.",
  );
}

export async function distributorRpc<T>(
  identity: AdminIdentity,
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!canReadModule(identity.role, "distributors"))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot access distributors.",
    );
  const { data, error } = await getSupabaseAdminClient()
    .rpc(name, { p_session: identity.sessionId, ...args })
    .abortSignal(AbortSignal.timeout(15000));
  if (error) {
    const m = error.message;
    if (/TERRITORY_REVIEW_REQUIRED/.test(m))
      throw new AdminError(409,"TERRITORY_REVIEW_REQUIRED","Review this retailer's location and supplying distributor in the retailer workspace before linking it.");
    if (/DISTRIBUTOR_CHANGED/.test(m))
      throw new AdminError(
        409,
        "DISTRIBUTOR_CHANGED",
        "This distributor changed while you were editing. Reload the latest record and try again.",
      );
    if (/ADMIN_REQUIRED/.test(m))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Sign in with an authorized admin account to continue.",
      );
    if (/DISTRIBUTOR_NOT_FOUND/.test(m))
      throw new AdminError(
        404,
        "NOT_FOUND",
        "This distributor could not be found.",
      );
    if (/STOCK_CHANGED|TRANSFER_CHANGED/.test(m))
      throw new AdminError(
        409,
        "STOCK_CHANGED",
        "Stock or transfer status has changed. Refresh and review the request.",
      );
    if (/SUSPENDED_PARTNER/.test(m))
      throw new AdminError(
        409,
        "SUSPENDED_PARTNER",
        "Stock transfers are restricted for suspended distributors.",
      );
    if (
      /INVALID_|DUPLICATE_|REASON_REQUIRED|SETUP_REQUIRED|INSUFFICIENT_STOCK/.test(
        m,
      )
    )
      throw new AdminError(
        400,
        "INVALID_REQUEST",
        "Check the required fields, location, and available stock before trying again.",
      );
    if (/EXPORT_RATE_LIMIT/.test(m))
      throw new AdminError(
        429,
        "EXPORT_RATE_LIMIT",
        "Too many exports were requested. Please try again later.",
      );
    console.error("[distributors] operation failed", {
      operation: name,
      code: error.code,
    });
    throw new AdminError(
      503,
      "DISTRIBUTORS_UNAVAILABLE",
      "We couldn't load or update distributors right now. Please try again.",
    );
  }
  return data as T;
}
export async function listDistributors(
  identity: AdminIdentity,
  filters: DistributorFilters,
  cursor: string | null = null,
): Promise<DistributorPage> {
  let parsed;
  try {
    parsed = decodeDistributorCursor(cursor);
  } catch {
    throw new AdminError(
      400,
      "INVALID_CURSOR",
      "Refresh distributors to restart this list.",
    );
  }
  const rows = await distributorRpc<DistributorRow[]>(
    identity,
    "admin_distributor_list",
    { p_filters: filters, p_cursor: parsed },
  );
  const visible = rows.slice(0, 50),
    last = visible.at(-1);
  return {
    rows: visible,
    nextCursor:
      rows.length > 50 && last
        ? btoa(JSON.stringify({ id: last.id, created_at: last.created_at }))
        : null,
  };
}
export const getDistributorSummary = (identity: AdminIdentity) =>
  distributorRpc<DistributorSummary>(identity, "admin_distributor_summary");
export async function getDistributorDetail(
  identity: AdminIdentity,
  id: string,
): Promise<DistributorDetail> {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new AdminError(
      400,
      "INVALID_REFERENCE",
      "Choose a valid distributor.",
    );
  const detail = await distributorRpc<Omit<DistributorDetail, "nextSections">>(
    identity,
    "admin_distributor_detail",
    { p_id: id },
  );
  const nextSections: string[] = [];
  for (const key of [
    "transfers",
    "retailers",
    "reconciliations",
    "activity",
  ] as const) {
    if (detail[key].length > 20) nextSections.push(key);
    detail[key] = detail[key].slice(0, 20) as never;
  }
  return { ...detail, nextSections };
}
export async function saveDistributor(
  identity: AdminIdentity,
  body: unknown,
  id: string | null = null,
) {
  if (!canManageDistributors(identity.role))
    throw new AdminError(
      403,
      "FORBIDDEN",
      "Your role cannot manage distributors.",
    );
  const payload = body as { values: unknown; updatedAt?: string };
  const result = distributorSchema.safeParse(payload?.values);
  if (!result.success)
    throw new AdminError(
      400,
      "INVALID_DISTRIBUTOR",
      "Check all required organization, location, contact, and service territory fields.",
    );
  const { reason, ...values } = result.data;
  return distributorRpc<string>(identity, "admin_distributor_save", {
    p_id: id,
    p_updated_at: payload.updatedAt || null,
    p_values: values,
    p_reason: reason,
    p_request: crypto.randomUUID(),
  });
}
