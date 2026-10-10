import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const parse = (path) => Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/)
  .filter((line) => /^\w+=/.test(line)).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).replace(/^["']|["']$/g, "")];
  }));
const root = parse(".env");
const customer = { ...root, ...parse("apps/customer/.env.production") };
const secrets = Object.fromEntries([
  "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "MSG91_AUTH_KEY", "MSG91_WHATSAPP_NUMBER", "MSG91_WHATSAPP_NAMESPACE",
].map((key) => [key, customer[key]]));
secrets.SUPABASE_SECRET_KEY = customer.SUPABASE_SERVICE_ROLE_KEY;
if (Object.values(secrets).some((value) => !value) || customer.PAYMENT_PROVIDER !== "razorpay" || customer.RAZORPAY_MODE !== "live") {
  throw new Error("Real production monitoring credentials are missing or payment provider differs. No configuration changed.");
}

const base = "https://vaahansafe-supabase-keepalive.vaahansafe.workers.dev/services";
const targets = { STATUS_PAYMENTS_HEALTH_URL: `${base}/payments`, STATUS_NOTIFICATIONS_HEALTH_URL: `${base}/notifications`, STATUS_ANALYTICS_HEALTH_URL: `${base}/customer-analytics` };
for (const path of ["apps/status/.env.local", "apps/status/.env.production", "apps/status/.env.example"]) {
  let source = readFileSync(path, "utf8");
  for (const [key, value] of Object.entries(targets)) {
    const matcher = new RegExp(`^#?\\s*${key}=.*$`, "m");
    source = matcher.test(source) ? source.replace(matcher, `${key}=${value}`) : `${source.trimEnd()}\n${key}=${value}\n`;
  }
  writeFileSync(path, source);
}
writeFileSync("apps/status/vercel.monitoring.env.example", Object.entries(targets).map(([key, value]) => `${key}=${value}`).join("\n") + "\n");
console.log("Localhost monitoring targets and Vercel deployment settings prepared (no credentials exported).");
if (!process.argv.includes("--apply")) process.exit(0);

if (process.argv.includes("--analytics-catalog")) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${root.CLOUDFLARE_ACCOUNT_ID}/d1/database/${root.CLOUDFLARE_D1_DATABASE_ID}/query`, {
    method: "POST", headers: { Authorization: `Bearer ${root.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql: readFileSync("database/migrations/0019_status_analytics_monitor.sql", "utf8") }), signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json();
  if (!data.success) throw new Error("Versioned analytics status catalog migration failed");
  console.log("Analytics catalog migration 0019 applied; no check history generated.");
}

async function wrangler(args, input) {
  const child = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", ...args,
    "--config", "infrastructure/cloudflare/workers/supabase-keepalive/wrangler.toml"], {
    env: { ...process.env, CLOUDFLARE_API_TOKEN: root.CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: root.CLOUDFLARE_ACCOUNT_ID },
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.stdin.end(input ? JSON.stringify(input) : "");
  const code = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  for (const value of [root.CLOUDFLARE_API_TOKEN, ...Object.values(secrets)]) if (value) output = output.replaceAll(value, "[redacted]");
  if (code !== 0) throw new Error(output);
  console.log(output);
}
if (!process.argv.includes("--deploy-only")) await wrangler(["secret", "bulk"], secrets);
await wrangler(["deploy", "--keep-vars"]);
console.log("Cloudflare service monitoring deployed. Vercel status app deployment remains pending.");
