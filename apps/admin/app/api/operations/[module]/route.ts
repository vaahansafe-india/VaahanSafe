import { getSupabaseAdminClient } from "@vaahansafe/database";
import {
  requireAdmin,
  assertSameOrigin,
  AdminError,
} from "../../../../lib/session";
import { adminResponse, adminFailure } from "../../../../lib/api";
import { listAdminRecords } from "../../../../lib/operations";
import { canMutateModule, getAdminModule } from "../../../../lib/modules";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    const { module } = await params;
    const identity = await requireAdmin(module);
    const p = new URL(request.url).searchParams;
    return adminResponse(
      await listAdminRecords(identity, module, {
        q: p.get("q") || "",
        status: p.get("status") || "",
        page: Number(p.get("page")) || 1,
      }),
    );
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ module: string }> },
) {
  try {
    assertSameOrigin(request);
    const { module } = await params;
    const identity = await requireAdmin(module, { stepUp: module === "flags" });
    if (module === "distributors" || module === "retailers")
      throw new AdminError(
        400,
        "PARTNER_WORKFLOW_REQUIRED",
        "Use the dedicated distributor or retailer workspace to manage the supply network, location and contacts.",
      );
    if (!canMutateModule(identity.role, module))
      throw new AdminError(
        403,
        "FORBIDDEN",
        "Your role cannot change these records.",
      );
    const body = await request.json();
    if (
      !body.confirmed ||
      typeof body.reason !== "string" ||
      body.reason.trim().length < 10 ||
      body.reason.length > 500
    )
      throw new AdminError(
        400,
        "REASON_REQUIRED",
        "Confirm the change and provide a reason of 10–500 characters.",
      );
    const values = body.values;
    if (!values || typeof values !== "object" || Array.isArray(values))
      throw new AdminError(
        400,
        "INVALID_VALUES",
        "Provide the required fields.",
      );
    const allowed: Record<string, string[]> = {
      distributors: ["reference_code", "name", "city", "status"],
      retailers: ["reference_code", "name", "city", "status"],
      support: [
        "reference_code",
        "subject",
        "priority",
        "status",
        "customer_user_id",
      ],
      incidents: ["title", "summary", "impact", "status"],
      documents: ["title", "asset_key", "status"],
      flags: ["name", "description", "enabled"],
    };
    if (
      Object.keys(values).some((k) => !allowed[module]?.includes(k)) ||
      Object.values(values).some(
        (v) => typeof v !== "string" && typeof v !== "boolean",
      ) ||
      Object.values(values).some(
        (v) => typeof v === "string" && v.length > 2000,
      )
    )
      throw new AdminError(
        400,
        "INVALID_VALUES",
        "Check the supplied fields and try again.",
      );
    if (module === "distributors" || module === "retailers")
      values.kind = module === "distributors" ? "DISTRIBUTOR" : "RETAILER";
    if (module === "support") {
      if (values.customer_user_id === "") delete values.customer_user_id;
      if (
        values.customer_user_id &&
        !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
          values.customer_user_id,
        )
      )
        throw new AdminError(
          400,
          "INVALID_CUSTOMER",
          "Choose a valid customer account ID.",
        );
    }
    if (
      module === "documents" &&
      (typeof values.asset_key !== "string" ||
        values.asset_key.startsWith("/") ||
        values.asset_key.includes("..") ||
        values.asset_key.includes("://"))
    )
      throw new AdminError(
        400,
        "INVALID_ASSET",
        "Choose a valid Cloudflare R2 object key.",
      );
    if (module === "documents") {
      const { data: asset, error: assetError } = await getSupabaseAdminClient()
        .from("media_assets")
        .select("id")
        .eq("object_key", values.asset_key)
        .eq("status", "READY")
        .eq("visibility", "PUBLIC")
        .maybeSingle();
      if (assetError) throw assetError;
      if (!asset)
        throw new AdminError(
          400,
          "INVALID_ASSET",
          "Choose a ready public asset from the media catalog.",
        );
    }
    const id = typeof body.id === "string" ? body.id : crypto.randomUUID();
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
      throw new AdminError(
        400,
        "INVALID_REFERENCE",
        "Check the record reference.",
      );
    const { data, error } = await getSupabaseAdminClient().rpc(
      "admin_console_mutate",
      {
        p_session: identity.sessionId,
        p_module: module,
        p_id: id,
        p_values: values,
        p_reason: body.reason.trim(),
        p_request: crypto.randomUUID(),
      },
    );
    if (error) throw error;
    return adminResponse({ id: data.id, label: getAdminModule(module)?.label });
  } catch (error) {
    return adminFailure(error);
  }
}
