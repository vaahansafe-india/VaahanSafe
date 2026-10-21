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
const definitions = [
  {
    name: "vhn_vehicle_report_v2",
    header: "A vehicle report for you",
    body: "A finder shared a report about your vehicle {{1}}.\nSituation: {{2}}\nReported at: {{3}}\nShared location: {{4}}\nView photos and report: {{5}}\nThis private link expires after 24 hours. Anyone with the link can view this report until it expires.",
  },
  {
    name: "vhn_vehicle_emergency_report_v2",
    header: "Possible vehicle emergency",
    body: "A finder reported a possible emergency involving your vehicle {{1}}.\nSituation: {{2}}\nReported at: {{3}}\nShared location: {{4}}\nView photos and report: {{5}}\nThis private link expires after 24 hours. Check the situation when safe. In immediate danger, call 112.",
  },
  {
    name: "vhn_emergency_contact_report_v2",
    header: "Emergency contact report",
    body: "You are listed as an emergency contact for vehicle {{1}}. A finder shared this report: {{2}}.\nReported at: {{3}}\nShared location: {{4}}\nView photos and report: {{5}}\nThis private link expires after 24 hours. Please check with the vehicle owner. This report does not confirm an accident. In immediate danger, call 112.",
  },
];
const response = await fetch(
  `https://control.msg91.com/api/v5/whatsapp/get-template-client/${env.MSG91_WHATSAPP_NUMBER}?pagination=false`,
  {
    headers: { authkey: env.MSG91_AUTH_KEY },
    signal: AbortSignal.timeout(15000),
  },
);
const data = await response.json();
if (!response.ok || data.status !== "success" || !Array.isArray(data.data))
  throw new Error("Template listing unavailable");
for (const definition of definitions) {
  const existing = data.data.find(
    (t) =>
      t.name === definition.name &&
      t.namespace === env.MSG91_WHATSAPP_NAMESPACE,
  );
  if (!existing && process.argv.includes("--submit")) {
    const result = await fetch(
      "https://api.msg91.com/api/v5/whatsapp/client-panel-template/",
      {
        method: "POST",
        headers: {
          authkey: env.MSG91_AUTH_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          integrated_number: env.MSG91_WHATSAPP_NUMBER,
          template_name: definition.name,
          language: "en",
          category: "UTILITY",
          button_url: false,
          components: [
            { type: "HEADER", format: "TEXT", text: definition.header },
            {
              type: "BODY",
              text: definition.body,
              example: {
                body_text: [
                  [
                    "MH •••• 1234",
                    definition.name.includes("emergency")
                      ? "Possible accident or emergency"
                      : "Parking or blocked access",
                    "21 Oct 2026, 14:00 IST",
                    "Location was not shared",
                    "https://view.vaahansafe.com/r#example-expiring-link",
                  ],
                ],
              },
            },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      },
    );
    const body = await result.json();
    console.log(definition.name, { http: result.status, status: body.status });
    if (!result.ok || body.hasError || body.status === "error")
      throw new Error("Viewer template submission failed");
  } else {
    const language = existing?.languages?.find((l) => l.language === "en");
    const valid =
      language?.variables?.join(",") === "body_1,body_2,body_3,body_4,body_5";
    const status = !valid
      ? "PENDING"
      : language.is_disabled
        ? "DISABLED"
        : String(language.status || "").toUpperCase();
    if (
      !["PENDING", "APPROVED", "REJECTED", "PAUSED", "DISABLED"].includes(
        status,
      )
    )
      throw new Error("Unknown viewer template status");
    console.log(definition.name, { exists: !!existing, valid, status });
    if (process.argv.includes("--sync"))
      await executeAdminSql(
        `UPDATE public.scan_report_template_approvals SET status='${status}',checked_at=clock_timestamp() WHERE template_name='${definition.name}'`,
      );
  }
}
