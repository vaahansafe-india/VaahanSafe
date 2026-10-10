import { readFileSync } from "node:fs";
import { executeAdminSql } from "./admin-service.mjs";
const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\w+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
for (const name of [
  "vhn_vehicle_report_v1",
  "vhn_vehicle_emergency_report_v1",
]) {
  const url = `https://control.msg91.com/api/v5/whatsapp/get-template-client/${env.MSG91_WHATSAPP_NUMBER}?template_name=${name}&pagination=false`;
  const response = await fetch(url, {
    headers: { authkey: env.MSG91_AUTH_KEY },
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  console.log(name, { http: response.status, status: data.status });
  if (!response.ok) throw new Error("Template approval query failed");
  if (process.argv.includes("--sync")) {
    const rows = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.data?.data)
        ? data.data.data
        : [];
    const row = rows
      .find(
        (row) =>
          (row.template_name || row.name) === name &&
          row.namespace === env.MSG91_WHATSAPP_NAMESPACE,
      )
      ?.languages?.find((language) => language.language === "en");
    if (
      !row ||
      row.variables?.join(",") !== "body_1,body_2,body_3,body_4,body_5"
    )
      throw new Error("Exact template contract unavailable");
    const status = row.is_disabled
      ? "DISABLED"
      : String(row.status || row.template_status).toUpperCase();
    if (
      !["PENDING", "APPROVED", "REJECTED", "PAUSED", "DISABLED"].includes(
        status,
      )
    )
      throw new Error("Unknown provider status");
    await executeAdminSql(
      `UPDATE public.scan_report_template_approvals SET status='${status}',checked_at=clock_timestamp() WHERE template_name='${name}'`,
    );
    console.log(name, "synced", status);
  }
}
