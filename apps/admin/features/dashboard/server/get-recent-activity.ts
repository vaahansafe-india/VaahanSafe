import "server-only";
import { getSupabaseAdminClient } from "@vaahansafe/database";
import type { AdminIdentity } from "../../../lib/contracts";
import { canReadModule } from "../../../lib/modules";
import { formatIstTimestamp, formatRelativeAge } from "../presentation";
import type { DashboardAuditItem } from "../types";

export async function getRecentAdminActivity(
  identity: AdminIdentity,
): Promise<DashboardAuditItem[]> {
  const db = getSupabaseAdminClient();
  const items: DashboardAuditItem[] = [];

  // Super admins, ops admins, finance admins can view audit logs
  if (!canReadModule(identity.role, "audit")) {
    return items;
  }

  try {
    const { data, error } = await db
      .from("admin_audit_logs")
      .select(
        "id,actor_id,action,resource_type,resource_id,reason,request_id,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(6);

    if (!error && data) {
      for (const log of data) {
        let actionLabel = log.action;
        let summary = log.reason || "Administrative operation recorded";

        if (log.action === "BLOCK_QR") {
          actionLabel = "QR Blocked";
          summary = `Identity ${log.resource_id.slice(0, 8)}… placed on hold`;
        } else if (log.action === "PHONE_SEARCH") {
          actionLabel = "Customer Phone Lookup";
          summary = "Verified identity lookup in support workflow";
        } else if (log.action === "CREATE") {
          actionLabel = `Created ${log.resource_type}`;
          summary = `New ${log.resource_type} registered by operator`;
        } else if (log.action === "UPDATE") {
          actionLabel = `Updated ${log.resource_type}`;
          summary = log.reason || `Record in ${log.resource_type} modified`;
        }

        items.push({
          id: log.id,
          action: actionLabel,
          summary,
          actor: "Admin Operator",
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          age: formatRelativeAge(log.created_at),
          timestamp: formatIstTimestamp(log.created_at),
        });
      }
    }
  } catch {
    // Graceful error isolation
  }

  return items;
}
