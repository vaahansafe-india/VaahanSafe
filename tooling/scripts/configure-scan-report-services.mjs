import { readFileSync } from "node:fs";
import nextEnv from "@next/env";
const root = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\w+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
nextEnv.loadEnvConfig("apps/qr", true);
const env = { ...root, ...process.env };
const definitions = [
  {
    name: "vhn_vehicle_report_v1",
    header: "Vehicle safety report",
    body: "A finder submitted a report about your vehicle {{1}}.\nReport: {{2}}\nTime: {{3}}\nShared location: {{4}}\nPhotos and report details: {{5}}\nOpen your VaahanSafe account to review. A report does not confirm an accident.",
  },
  {
    name: "vhn_vehicle_emergency_report_v1",
    header: "Vehicle emergency report",
    body: "A finder reported a possible emergency involving your vehicle {{1}}.\nReport: {{2}}\nTime: {{3}}\nShared location: {{4}}\nPhotos and report details: {{5}}\nPlease review the situation. Call local emergency services if needed.",
  },
];
async function msg(path, body) {
  const r = await fetch(`https://api.msg91.com/api/v5/whatsapp/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authkey: env.MSG91_AUTH_KEY,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json();
  return { http: r.status, data };
}
if (process.argv.includes("--templates")) {
  for (const t of definitions) {
    const existing = await fetch(
      `https://control.msg91.com/api/v5/whatsapp/get-template-client/${env.MSG91_WHATSAPP_NUMBER}?template_name=${t.name}&pagination=false`,
      {
        headers: { authkey: env.MSG91_AUTH_KEY },
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!existing.ok)
      throw new Error(
        "Cannot check existing template; no duplicate will be submitted.",
      );
    const data = await existing.json(),
      rows = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
    if (rows.some((row) => (row.name || row.template_name) === t.name)) {
      console.log(t.name, "already exists");
      continue;
    }
    const result = await msg("client-panel-template/", {
      integrated_number: env.MSG91_WHATSAPP_NUMBER,
      template_name: t.name,
      language: "en",
      category: "UTILITY",
      button_url: false,
      components: [
        { type: "HEADER", format: "TEXT", text: t.header },
        {
          type: "BODY",
          text: t.body,
          example: {
            body_text: [
              [
                "MH •••• 1234",
                "Parking obstruction",
                "10 Oct 2026, 14:00 IST",
                "Location was not shared",
                "https://app.vaahansafe.com/scan-history?report=report_example",
              ],
            ],
          },
        },
      ],
    });
    console.log(t.name, { http: result.http, status: result.data.status });
    if (result.http >= 400 || result.data.hasError)
      throw new Error("Template submission failed");
  }
}
if (process.argv.includes("--buckets")) {
  const base = `https://api.cloudflare.com/client/v4/accounts/${root.CLOUDFLARE_ACCOUNT_ID}/r2/buckets`;
  const headers = {
    Authorization: `Bearer ${root.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
  const list = await fetch(base, { headers }).then((r) => r.json());
  if (!list.success) throw new Error("R2 bucket inspection unavailable");
  const name = "vaahansafe-prod-private";
  if (!list.result.buckets.some((b) => b.name === name)) {
    const r = await fetch(base, {
      method: "POST",
      headers,
      body: JSON.stringify({ name }),
    });
    const d = await r.json();
    console.log("private bucket", { http: r.status, success: d.success });
    if (!d.success) throw new Error("Private bucket creation failed");
  }
  const r = await fetch(`${base}/${name}`, { headers });
  const d = await r.json();
  console.log("private bucket verified", {
    http: r.status,
    name: d.result?.name,
    success: d.success,
  });
  if (!d.success) throw new Error("Private bucket lookup failed");
  const managed = await fetch(`${base}/${name}/domains/managed`, {
    headers,
  }).then((r) => r.json());
  const custom = await fetch(`${base}/${name}/domains/custom`, {
    headers,
  }).then((r) => r.json());
  if (
    !managed.success ||
    !custom.success ||
    managed.result?.enabled ||
    custom.result?.domains?.length
  )
    throw new Error(
      "Private bucket access needs review before accepting report photos.",
    );
  console.log("Photo bucket public access disabled");
  const existing = await fetch(`${base}/${name}/lifecycle`, { headers }).then(
    (r) => r.json(),
  );
  if (!existing.success || !Array.isArray(existing.result?.rules))
    throw new Error("Lifecycle inspection failed");
  const rule = {
    id: "scan-report-photos-90-days",
    enabled: true,
    conditions: { prefix: "scan-reports/" },
    deleteObjectsTransition: { condition: { type: "Age", maxAge: 90 * 86400 } },
  };
  if (process.argv.includes("--retention")) {
    const rules = [
      ...existing.result.rules.filter((r) => r.id !== rule.id),
      rule,
    ];
    const result = await fetch(`${base}/${name}/lifecycle`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ rules }),
    }).then((r) => r.json());
    if (!result.success)
      throw new Error("Report photo retention configuration failed");
  }
  const verified = await fetch(`${base}/${name}/lifecycle`, { headers }).then(
    (r) => r.json(),
  );
  console.log(
    "photo retention",
    verified.result?.rules?.filter((r) => r.id === rule.id),
  );
}
