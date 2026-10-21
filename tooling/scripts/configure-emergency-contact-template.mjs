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
const name = "vhn_emergency_contact_report_v1";
const response = await fetch(
  `https://control.msg91.com/api/v5/whatsapp/get-template-client/${env.MSG91_WHATSAPP_NUMBER}?pagination=false`,
  {
    headers: { authkey: env.MSG91_AUTH_KEY },
    signal: AbortSignal.timeout(15000),
  },
);
const data = await response.json();
console.log("template lookup", { http: response.status, status: data.status });
if (!response.ok || data.status !== "success" || !Array.isArray(data.data))
  throw new Error("Template lookup unavailable; no template submitted");
const existing = data.data.find(
  (t) => t.name === name && t.namespace === env.MSG91_WHATSAPP_NAMESPACE,
);
if (!existing && process.argv.includes("--submit")) {
  const created = await fetch(
    "https://api.msg91.com/api/v5/whatsapp/client-panel-template/",
    {
      method: "POST",
      headers: {
        authkey: env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        integrated_number: env.MSG91_WHATSAPP_NUMBER,
        template_name: name,
        language: "en",
        category: "UTILITY",
        button_url: false,
        components: [
          { type: "HEADER", format: "TEXT", text: "Emergency contact alert" },
          {
            type: "BODY",
            text: "You are listed as an emergency contact for vehicle {{1}}. A finder submitted this report: {{2}}.\nTime: {{3}}\nFinder-shared location: {{4}}\nPlease contact the vehicle owner and check the situation. This is a finder report, not a confirmed accident. In immediate danger, call 112.",
            example: {
              body_text: [
                [
                  "MH •••• 1234",
                  "Possible accident or emergency",
                  "21 Oct 2026, 12:00 IST",
                  "Location was not shared",
                ],
              ],
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    },
  );
  const result = await created.json();
  console.log("template submission", {
    http: created.status,
    status: result.status,
  });
  if (!created.ok || result.hasError || result.status === "error")
    throw new Error("Emergency contact template submission failed");
} else {
  const language = existing?.languages?.find((l) => l.language === "en");
  const valid =
    language?.variables?.join(",") === "body_1,body_2,body_3,body_4";
  const status = !valid
    ? "PENDING"
    : language.is_disabled
      ? "DISABLED"
      : String(language.status || "").toUpperCase();
  if (
    !["PENDING", "APPROVED", "REJECTED", "PAUSED", "DISABLED"].includes(status)
  )
    throw new Error("Unknown provider status");
  console.log("template contract", { exists: !!existing, valid, status });
  if (process.argv.includes("--sync"))
    await executeAdminSql(
      `UPDATE public.scan_report_template_approvals SET status='${status}',checked_at=clock_timestamp() WHERE template_name='${name}'`,
    );
}
