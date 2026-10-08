import { getSupabaseAdminClient } from "@vaahansafe/database";
import { getAuthoritativeObjectStore } from "@vaahansafe/storage";
import { requireAdmin, AdminError } from "../../../../lib/session";
import { adminFailure } from "../../../../lib/api";
import { canExport } from "../../../../lib/exports";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await requireAdmin("reports");
    const { id } = await params;
    const db = getSupabaseAdminClient();
    const { data: job, error } = await db
      .from("admin_export_jobs")
      .select("id,actor_id,module_key,status,object_key,expires_at")
      .eq("id", id)
      .eq("actor_id", identity.id)
      .maybeSingle();
    if (error) throw error;
    if (
      !job ||
      job.status !== "READY" ||
      !job.object_key ||
      Date.parse(job.expires_at) <= Date.now() ||
      !canExport(identity.role, job.module_key)
    )
      throw new AdminError(
        404,
        "EXPORT_UNAVAILABLE",
        "This export is unavailable or has expired. Request a fresh report.",
      );
    const object = await getAuthoritativeObjectStore("EXPORT").get(
      job.object_key,
    );
    if (!object)
      throw new AdminError(
        404,
        "EXPORT_UNAVAILABLE",
        "This export is unavailable. Request a fresh report.",
      );
    const { error: auditError } = await db
      .from("admin_audit_logs")
      .insert({
        actor_id: identity.id,
        action: "EXPORT_DOWNLOAD",
        resource_type: "reports",
        resource_id: id,
        reason: "Authorized private report download",
        request_id: crypto.randomUUID(),
        before_summary: {},
        after_summary: { module: job.module_key },
      });
    if (auditError) throw auditError;
    return new Response(object.data, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vaahansafe-${job.module_key}-${id}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return adminFailure(error);
  }
}
