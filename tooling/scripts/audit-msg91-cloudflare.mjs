// Read-only audit. Never sends messages, outputs credentials, or reads customer records.
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter(l => /^[A-Z0-9_]+=/.test(l)).map(l => {
  const index = l.indexOf("=");
  return [l.slice(0, index), l.slice(index + 1).replace(/^["']|["']$/g, "")];
}));
try {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`, {
    method: "POST", headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users','auth_identities','sessions','notification_intents','notification_deliveries','auth_otp_requests') ORDER BY name" }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  console.log(JSON.stringify({ service: "Cloudflare D1", httpStatus: response.status, success: data.success === true,
    tables: data.success ? data.result?.[0]?.results?.map(r => r.name) : [],
    errorCodes: data.errors?.map(e => e.code) || [] }));
} catch { console.log(JSON.stringify({ service: "Cloudflare D1", success: false, reason: "Connection unavailable" })); process.exitCode = 1; }
