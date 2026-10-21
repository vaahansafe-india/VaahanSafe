import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
const env = {
  ...Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .filter((l) => /^\w+=/.test(l))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
      }),
  ),
  ...process.env,
};
const credentials = {
  SUPABASE_URL: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY:
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY,
};
const secrets = [
  env.CLOUDFLARE_API_TOKEN,
  ...Object.values(credentials),
].filter(Boolean);
async function wrangler(args, input) {
  const child = spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      ...args,
      "--config",
      "apps/view/wrangler.toml",
    ],
    { env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
  );
  let output = "";
  child.stdout.on("data", (d) => (output += d));
  child.stderr.on("data", (d) => (output += d));
  child.stdin.end(input ? JSON.stringify(input) : undefined);
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  for (const secret of secrets)
    output = output.replaceAll(secret, "[redacted]");
  console.log(output);
  if (code !== 0) throw new Error("Report viewer deployment operation failed");
}
if (process.argv.includes("--audit")) {
  const headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` };
  const zones = await fetch(
    "https://api.cloudflare.com/client/v4/zones?name=vaahansafe.com",
    { headers },
  ).then((r) => r.json());
  console.log("Cloudflare zone access", {
    success: zones.success,
    count: zones.result?.length,
    errors: zones.errors?.map((e) => ({ code: e.code, message: e.message })),
  });
  if (!zones.success || zones.result?.length !== 1)
    throw new Error("VaahanSafe zone unavailable");
  const records = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zones.result[0].id}/dns_records?name=view.vaahansafe.com`,
    { headers },
  ).then((r) => r.json());
  if (!records.success) throw new Error("Viewer DNS inspection failed");
  console.log(
    "viewer DNS",
    records.result.map((r) => ({
      name: r.name,
      type: r.type,
      proxied: r.proxied,
    })),
  );
  const workers = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/domains`,
    { headers },
  ).then((r) => r.json());
  if (!workers.success) throw new Error("Worker domain inspection failed");
  console.log(
    "viewer custom domain",
    workers.result
      .filter((r) => r.hostname === "view.vaahansafe.com")
      .map((r) => ({ hostname: r.hostname, service: r.service })),
  );
  const log = await fetch("https://supabase.com/changelog.md").then((r) =>
    r.text(),
  );
  console.log("database changelog inspected", { available: log.length > 100 });
}
if (process.argv.includes("--build"))
  await wrangler(["deploy", "--dry-run", "--outdir", ".build"]);
if (process.argv.includes("--deploy")) await wrangler(["deploy"]);
if (process.argv.includes("--secrets")) {
  if (Object.values(credentials).some((value) => !value))
    throw new Error("Viewer server configuration missing");
  await wrangler(["secret", "bulk"], credentials);
}
if (process.argv.includes("--verify")) {
  const home = await fetch("https://view.vaahansafe.com/", {
    signal: AbortSignal.timeout(15000),
  });
  const html = await home.text();
  const denied = await fetch("https://view.vaahansafe.com/api/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://view.vaahansafe.com",
    },
    body: JSON.stringify({ token: "A".repeat(43) }),
    signal: AbortSignal.timeout(15000),
  });
  console.log("live viewer", {
    http: home.status,
    branded: html.includes("Care starts with"),
    invalidLinkStatus: denied.status,
    noStore: denied.headers.get("cache-control"),
    noIndex: home.headers.get("x-robots-tag"),
  });
  if (!home.ok || denied.status !== 410)
    throw new Error("Viewer release verification failed");
}
