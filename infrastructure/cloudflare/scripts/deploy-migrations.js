/**
 * Cross-platform migration runner helper
 */
const { execSync } = require("child_process");

const env = process.argv[2] || "dev";
const isRemote = process.argv.includes("--remote") || env === "prod" ? "--remote" : "--local";
const configFile = `infrastructure/cloudflare/environments/wrangler.${env}.toml`;

console.log(`[VaahanSafe] Applying D1 migrations (${env}, ${isRemote})...`);

try {
  execSync(`npx wrangler d1 migrations apply vaahansafe-${env}-db ${isRemote} --config ${configFile}`, {
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });
  console.log("[VaahanSafe] Migrations applied successfully.");
} catch (err) {
  console.error("[VaahanSafe] Error applying migrations:", err.message);
  process.exit(1);
}
