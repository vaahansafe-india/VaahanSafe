import { loadEnvFile } from "node:process";
import { reportButtonTemplates } from "../../packages/notifications/src/whatsapp/report-buttons.ts";

loadEnvFile(".env");
const { MSG91_AUTH_KEY: authkey, MSG91_WHATSAPP_NUMBER: sender,
  MSG91_WHATSAPP_NAMESPACE: namespace } = process.env;
if (!authkey || !sender || !namespace) throw new Error("MSG91 configuration missing");
const only = process.argv.find((arg) => arg.startsWith("--template="))?.slice(11);
const definitions = reportButtonTemplates.filter(({ name }) => !only || only === name);
if (!definitions.length) throw new Error("Unknown report button template");

async function findTemplate(name) {
  const lookup = await fetch(
    `https://control.msg91.com/api/v5/whatsapp/get-template-client/${sender}?template_name=${name}&pagination=false`,
    { headers: { authkey }, signal: AbortSignal.timeout(15000) },
  );
  const saved = await lookup.json();
  if (!lookup.ok || saved.status !== "success")
    throw new Error(`Could not list MSG91 template ${name}`);
  if (saved.data == null || (typeof saved.data === "object" && Object.keys(saved.data).length === 0)) return;
  if (!Array.isArray(saved.data)) throw new Error(`Unexpected template response for ${name}`);
  const template = saved.data.find((entry) => entry.name === name);
  const language = template?.languages?.find(({ language }) => language === "en");
  return language && { ...language, namespaceMatches: template.namespace === namespace };
}

let failed = false;
const existingTemplates = await Promise.all(
  definitions.map(({ name }) => findTemplate(name)),
);
for (const [index, definition] of definitions.entries()) {
  const existing = existingTemplates[index];
  if (existing || !process.argv.includes("--submit")) {
    const code = typeof existing?.code === "string" ? JSON.parse(existing.code) : existing?.code;
    console.log(definition.name, {
      status: existing?.status ?? "missing",
      variables: existing?.variables,
      namespaceMatches: existing?.namespaceMatches,
      reason: existing?.rejection_reason || undefined,
      buttonsMatch: Array.isArray(code) && definition.buttons.every(({ base, text }, i) => {
        const button = code.find((component) => component?.type === "BUTTONS")?.buttons?.[i];
        return button?.type === "URL" && button.text === text && button.url === base + "{{1}}";
      }),
    });
    continue;
  }
  const response = await fetch("https://api.msg91.com/api/v5/whatsapp/client-panel-template/", {
    method: "POST",
    headers: { authkey, "Content-Type": "application/json" },
    body: JSON.stringify({
      integrated_number: sender,
      template_name: definition.name,
      language: "en",
      category: "UTILITY",
      button_url: false,
      components: [
        { type: "HEADER", format: "TEXT", text: definition.heading },
        {
          type: "BODY",
          text: definition.body,
          example: { body_text: [["MH••••1234", definition.sampleReason, "14 Nov 2026, 13:09 IST"]] },
        },
        { type: "FOOTER", text: definition.footer },
        {
          type: "BUTTONS",
          buttons: definition.buttons.map(({ text, base, sample }) => ({
            type: "URL",
            text,
            url: base + "{{1}}",
            example: [base + sample],
          })),
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  const accepted = response.ok && result.status === "success" && !result.hasError;
  failed ||= !accepted;
  console.log(definition.name, {
    http: response.status,
    status: accepted ? "submitted for provider approval" : result.status,
    error: accepted ? undefined : result.errors,
  });
}
if (failed) process.exitCode = 1;
