// Uses Wrangler's versioned migration workflow; never creates a local database.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const env = Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).filter(l => /^[A-Z0-9_]+=/.test(l)).map(l => {
  const index = l.indexOf("="); return [l.slice(0, index), l.slice(index + 1).replace(/^["']|["']$/g, "")];
}));
const action = process.argv[2];
if (!["list", "apply"].includes(action)) throw new Error("Choose list or apply");
const result = spawnSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "migrations", action,
  "vaahansafe-prod-db", "--remote", "--config", "apps/api/wrangler.jsonc", "--env", "production"], {
  stdio: "inherit", env: { ...process.env, CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID, CI: "true" },
});
process.exitCode = result.status ?? 1;
