import { readFileSync } from "node:fs";
import { adminService } from "./admin-service.mjs";

const client = adminService();
export async function query(sql) {
  const { data, error } = await client.rpc("exec_sql", { p_sql: sql });
  if (error || data?.error) {
    console.error("Database audit failed", {
      code: error?.code,
      message: error?.message || data?.error,
    });
    throw new Error("QR alert database audit unavailable");
  }
  return data;
}
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^\w+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
console.log(
  "schema",
  JSON.stringify(
    await query(
      "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('notification_intents','emergency_contacts','emergency_profiles') ORDER BY table_name,ordinal_position",
    ),
  ),
);
console.log(
  "template approvals",
  JSON.stringify(
    await query(
      "SELECT template_name,status FROM public.scan_report_template_approvals",
    ),
  ),
);
console.log(
  "scheduler",
  JSON.stringify(
    await query(
      "SELECT jobname,schedule,active FROM cron.job WHERE jobname ILIKE '%notif%'",
    ),
  ),
);
console.log(
  "contact counts",
  JSON.stringify(
    await query(
      "SELECT count(*) AS total,count(*) FILTER(WHERE is_enabled=1 AND allow_message=1) AS messaging_enabled FROM public.emergency_contacts",
    ),
  ),
);
for (const name of [
  "vhn_vehicle_report_v1",
  "vhn_vehicle_emergency_report_v1",
  "vhn_emergency_contact_report_v1",
]) {
  const response = await fetch(
    `https://control.msg91.com/api/v5/whatsapp/get-template-client/${env.MSG91_WHATSAPP_NUMBER}?template_name=${name}&pagination=false`,
    {
      headers: { authkey: env.MSG91_AUTH_KEY },
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = await response.json();
  console.log("provider template", name, {
    http: response.status,
    status: data.status,
    contracts: Array.isArray(data.data)
      ? data.data
          .filter((row) => row.name === name)
          .flatMap((row) =>
            row.languages?.map((language) => ({
              language: language.language,
              status: language.status,
              variables: language.variables,
              disabled: language.is_disabled,
            })),
          )
      : [],
  });
}
const changelog = await fetch("https://supabase.com/changelog.md").then((r) =>
  r.text(),
);
const cfHeaders = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };
const cfBase = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}`;
for (const [label, path] of [
  [
    "R2 managed public access",
    "/r2/buckets/vaahansafe-prod-private/domains/managed",
  ],
  [
    "R2 custom public access",
    "/r2/buckets/vaahansafe-prod-private/domains/custom",
  ],
  ["Turnstile", "/challenges/widgets"],
]) {
  const response = await fetch(`${cfBase}${path}`, {
    headers: cfHeaders,
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  console.log(label, {
    http: response.status,
    success: data.success,
    ...(label === "Turnstile"
      ? {
          qrHostnameConfigured: data.result?.some((widget) =>
            widget.domains?.includes("qr.vaahansafe.com"),
          ),
        }
      : label.includes("managed")
        ? { enabled: data.result?.enabled }
        : { publicDomains: data.result?.domains?.length }),
  });
}
console.log(
  "changelog",
  changelog
    .split("\n")
    .filter((line) => /breaking-change|postgres|row.level|RLS/i.test(line))
    .slice(0, 8)
    .join("\n"),
);
