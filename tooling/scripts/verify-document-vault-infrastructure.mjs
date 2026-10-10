import { readFileSync } from "node:fs";
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
const base = `https://api.cloudflare.com/client/v4/accounts/${root.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/vaahansafe-prod-documents`;
const headers = { Authorization: `Bearer ${root.CLOUDFLARE_API_TOKEN}` };
const managed = await (
  await fetch(base + "/domains/managed", { headers })
).json();
const custom = await (
  await fetch(base + "/domains/custom", { headers })
).json();
if (
  !managed.success ||
  managed.result.enabled ||
  !custom.success ||
  custom.result.domains?.length
)
  throw new Error("Private bucket checks failed");
const worker = process.env.DOCUMENT_VAULT_WORKER_URL;
for (const allowed of ["https://app.vaahansafe.com", "http://localhost:3001"]) {
  const preflight = await fetch(worker + "/uploads/" + "a".repeat(43), {
    method: "OPTIONS",
    headers: {
      Origin: allowed,
      "Access-Control-Request-Method": "PUT",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  if (
    preflight.status !== 204 ||
    preflight.headers.get("access-control-allow-origin") !== allowed ||
    !preflight.headers.get("access-control-allow-methods")?.includes("PUT")
  )
    throw new Error("Configured origin preflight failed");
}
for (const foreignOrigin of [
  "http://localhost:3002",
  "http://localhost:3001.attacker.invalid",
  "https://untrusted.invalid",
]) {
  const preflight = await fetch(worker + "/uploads/" + "a".repeat(43), {
    method: "OPTIONS",
    headers: { Origin: foreignOrigin, "Access-Control-Request-Method": "PUT" },
  });
  if (
    preflight.status !== 403 ||
    preflight.headers.has("access-control-allow-origin")
  )
    throw new Error("Foreign origin preflight was permitted");
}
const localRejected = await fetch(worker + "/uploads/" + "a".repeat(43), {
  method: "PUT",
  headers: { Origin: "http://localhost:3001" },
  body: "invalid",
});
if (
  localRejected.status !== 409 ||
  localRejected.headers.get("access-control-allow-origin") !==
    "http://localhost:3001"
)
  throw new Error(
    "Local upload did not enforce capability authorization with CORS headers",
  );
const denied = await fetch(worker + "/access/" + "a".repeat(43));
if (denied.status !== 403)
  throw new Error("Unknown access grant was not denied");
const foreign = await fetch(worker + "/uploads/" + "b".repeat(43), {
  method: "PUT",
  headers: { Origin: "https://untrusted.invalid" },
  body: "invalid",
});
if (foreign.status !== 403) throw new Error("Foreign origin was not denied");
if (process.argv.includes("--cors-only")) {
  console.log(
    "Verified live: production and localhost:3001 preflights pass; other origins are denied; localhost PUT still requires a valid upload capability; bucket remains private.",
  );
  process.exit(0);
}
const key = `healthchecks/document-vault/${crypto.randomUUID()}.txt`;
const object = base + "/objects/" + key;
try {
  const put = await fetch(object, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "text/plain" },
    body: "VaahanSafe private storage verification",
  });
  if (!put.ok) throw new Error("R2 write failed");
  const get = await fetch(object, { headers });
  if (
    !get.ok ||
    (await get.text()) !== "VaahanSafe private storage verification"
  )
    throw new Error("R2 read failed");
} finally {
  const deleted = await fetch(object, { method: "DELETE", headers });
  if (!deleted.ok) throw new Error("R2 healthcheck cleanup failed");
}
console.log(
  "Verified: dedicated bucket has no public managed/custom domain; live Worker rejects unknown grants and foreign origins; real R2 upload/read/delete passed. No customer documents created.",
);
