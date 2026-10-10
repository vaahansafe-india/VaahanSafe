import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig("apps/customer", true);
const root = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^\w+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")];
    }),
);
const base = `https://api.cloudflare.com/client/v4/accounts/${root.CLOUDFLARE_ACCOUNT_ID}`;
async function cf(path, method = "GET", body) {
  const response = await fetch(base + path, {
    method,
    headers: {
      Authorization: `Bearer ${root.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!result.success)
    throw new Error(
      "Cloudflare configuration failed: " +
        response.status +
        " " +
        JSON.stringify(
          result.errors?.map((e) => ({ code: e.code, message: e.message })),
        ),
    );
  return result.result;
}
if (!process.argv.includes("--apply"))
  throw new Error(
    "Use --apply to configure the private document bucket and upload Worker.",
  );
if (!process.argv.includes("--deploy-only")) {
  const buckets = await cf("/r2/buckets");
  if (!buckets.buckets.some((b) => b.name === "vaahansafe-prod-documents"))
    await cf("/r2/buckets", "POST", { name: "vaahansafe-prod-documents" });
  await cf("/r2/buckets/vaahansafe-prod-documents/domains/managed", "PUT", {
    enabled: false,
  });
  const domains = await cf(
    "/r2/buckets/vaahansafe-prod-documents/domains/custom",
  );
  if (domains.domains?.length)
    throw new Error(
      "Document bucket has unexpected public domains. Review before proceeding.",
    );
}
async function wrangler(args, input) {
  const child = spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      ...args,
      "--config",
      "infrastructure/cloudflare/workers/document-vault/wrangler.toml",
    ],
    {
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: root.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: root.CLOUDFLARE_ACCOUNT_ID,
      },
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    },
  );
  let output = "";
  child.stdout.on("data", (b) => (output += b));
  child.stderr.on("data", (b) => (output += b));
  child.stdin.end(input ? JSON.stringify(input) : "");
  const code = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  for (const val of [
    root.CLOUDFLARE_API_TOKEN,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ])
    if (val) output = output.replaceAll(val, "[redacted]");
  if (code !== 0) throw new Error(output);
  console.log(output);
}
await wrangler(["deploy"]);
if (process.argv.includes("--deploy-only")) {
  console.log(
    "Document Worker deployed; existing secrets and bucket configuration preserved.",
  );
  process.exit(0);
}
await wrangler(["secret", "bulk"], {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});
const subdomain = await cf("/workers/subdomain");
const workerUrl = `https://vaahansafe-document-vault.${subdomain.subdomain}.workers.dev`;
for (const file of [
  "apps/customer/.env.local",
  "apps/customer/.env.production",
]) {
  let source = readFileSync(file, "utf8");
  source = /^DOCUMENT_VAULT_WORKER_URL=.*$/m.test(source)
    ? source.replace(
        /^DOCUMENT_VAULT_WORKER_URL=.*$/m,
        "DOCUMENT_VAULT_WORKER_URL=" + workerUrl,
      )
    : source.trimEnd() + "\nDOCUMENT_VAULT_WORKER_URL=" + workerUrl + "\n";
  writeFileSync(file, source);
}
console.log("Private document bucket and Worker configured:", workerUrl);
