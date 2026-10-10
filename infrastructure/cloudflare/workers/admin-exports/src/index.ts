import {
  ADMIN_ROLES,
  getAdminModule,
} from "../../../../../apps/admin/lib/modules";
import {
  canExport,
  csvCell,
  exportRows,
  INVENTORY_EXPORT_FIELDS,
  DISTRIBUTOR_EXPORT_FIELDS,
  RETAILER_EXPORT_FIELDS,
} from "../../../../../apps/admin/lib/exports";
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  EXPORT_STORAGE: {
    put(key: string, value: string, options: unknown): Promise<unknown>;
    delete(key: string): Promise<void>;
  };
}
interface Job {
  id: string;
  actor_id: string;
  module_key: string;
  status: string;
  expires_at: string;
  object_key: string | null;
  updated_at: string;
}
async function api<T>(
  env: Env,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`,
    {
      method,
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(`Export database request failed (${response.status})`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
async function transition(
  env: Env,
  job: Job,
  to: string,
  key: string | null = null,
  count: number | null = null,
) {
  return api<Job | null>(env, "rpc/admin_export_transition", "POST", {
    p_id: job.id,
    p_from: job.status,
    p_to: to,
    p_key: key,
    p_count: count,
    p_request: crypto.randomUUID(),
  });
}
export async function processExportJobs(env: Env) {
  const now = new Date().toISOString();
  // Expired files are deleted from private R2; access is rejected independently at download.
  const expired = await api<Job[]>(
    env,
    `admin_export_jobs?status=eq.READY&expires_at=lt.${now}&limit=20`,
  );
  for (const job of expired) {
    if (job.object_key) await env.EXPORT_STORAGE.delete(job.object_key);
    await transition(env, job, "EXPIRED");
  }
  // Recover interrupted work using a lease. Object keys are deterministic per job.
  const interrupted = await api<Job[]>(
    env,
    `admin_export_jobs?status=eq.PROCESSING&updated_at=lt.${new Date(Date.now() - 900000).toISOString()}`,
  );
  for (const job of interrupted) await transition(env, job, "QUEUED");
  const jobs = await api<Job[]>(
    env,
    "admin_export_jobs?status=eq.QUEUED&order=created_at.asc&limit=5",
  );
  for (const job of jobs) {
    const claimed = await transition(env, job, "PROCESSING");
    if (!claimed) continue;
    try {
      const actors = await api<
        Array<{ role: (typeof ADMIN_ROLES)[number]; status: string }>
      >(
        env,
        `admin_users?id=eq.${encodeURIComponent(job.actor_id)}&select=role,status&limit=1`,
      );
      const actor = actors[0];
      if (
        !actor ||
        actor.status !== "ACTIVE" ||
        !canExport(actor.role, job.module_key) ||
        Date.parse(job.expires_at) <= Date.now()
      )
        throw new Error("Export access expired");
      const exportModule = getAdminModule(job.module_key)!;
      const lines = [
        (job.module_key === "inventory"
          ? INVENTORY_EXPORT_FIELDS
          : job.module_key === "distributors"
            ? DISTRIBUTOR_EXPORT_FIELDS
            : job.module_key === "retailers"
              ? RETAILER_EXPORT_FIELDS
              : exportModule.fields!
        )
          .map(csvCell)
          .join(","),
      ];
      let count = 0;
      if (job.module_key === "inventory") {
        let cursor: Record<string, unknown> | null = null;
        for (let page = 0; page <= 20; page++) {
          const rows = await api<Record<string, unknown>[]>(
            env,
            "rpc/admin_inventory_export_page",
            "POST",
            { p_job: job.id, p_cursor: cursor },
          );
          if (count + rows.length > 10000)
            throw new Error("Export exceeds 10000-row limit");
          lines.push(...exportRows("inventory", rows));
          count += rows.length;
          if (rows.length < 500) break;
          const last = rows.at(-1)!;
          cursor = { created_at: last.created_at, id: last.id };
        }
      } else if (
        job.module_key === "distributors" ||
        job.module_key === "retailers"
      ) {
        let cursor: Record<string, unknown> | null = null;
        for (let page = 0; page <= 20; page++) {
          const rows = await api<Record<string, unknown>[]>(
            env,
            job.module_key === "distributors"
              ? "rpc/admin_distributor_export_page"
              : "rpc/admin_retailer_export_page",
            "POST",
            { p_job: job.id, p_cursor: cursor },
          );
          if (count + rows.length > 10000)
            throw new Error("Export exceeds 10000-row limit");
          lines.push(...exportRows(job.module_key, rows));
          count += rows.length;
          if (rows.length < 500) break;
          const last = rows.at(-1)!;
          cursor = { created_at: last.created_at, id: last.id };
        }
      } else
        for (let offset = 0; offset <= 10000; offset += 500) {
          const query = new URLSearchParams({
            select: exportModule.fields!.join(","),
            order: "id.asc",
            limit: "500",
            offset: String(offset),
          });
          if (
            job.module_key === "distributors" ||
            job.module_key === "retailers"
          )
            query.set(
              "kind",
              `eq.${job.module_key === "distributors" ? "DISTRIBUTOR" : "RETAILER"}`,
            );
          if (job.module_key === "fraud") query.set("outcome", "neq.SUCCESS");
          const rows = await api<Record<string, unknown>[]>(
            env,
            `${exportModule.table}?${query}`,
          );
          if (count + rows.length > 10000)
            throw new Error("Export exceeds 10000-row limit");
          lines.push(...exportRows(job.module_key, rows));
          count += rows.length;
          if (rows.length < 500) break;
        }
      const key = `admin-exports/${job.actor_id}/${job.id}.csv`;
      await env.EXPORT_STORAGE.put(key, lines.join("\r\n"), {
        httpMetadata: { contentType: "text/csv; charset=utf-8" },
      });
      await transition(env, claimed, "READY", key, count);
    } catch {
      await transition(env, claimed, "FAILED");
      console.error("[admin-export] job failed", { jobId: job.id });
    }
  }
}
const exportWorker = {
  async scheduled(_event: unknown, env: Env) {
    await processExportJobs(env);
  },
};
export default exportWorker;
