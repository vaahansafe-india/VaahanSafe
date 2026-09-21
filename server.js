// Hostinger root server runner
const path = require("path");
const fs = require("fs");

const candidatePaths = [
  path.join(__dirname, ".next/standalone/apps/web/server.js"),
  path.join(__dirname, ".next/standalone/server.js"),
  path.join(__dirname, "apps/web/.next/standalone/apps/web/server.js"),
  path.join(__dirname, "apps/web/.next/standalone/server.js"),
];

let started = false;
for (const target of candidatePaths) {
  if (fs.existsSync(target)) {
    console.log(`[server.js] Starting Next.js standalone server from: ${target}`);
    process.chdir(path.dirname(target));
    require(target);
    started = true;
    break;
  }
}

if (!started) {
  console.error("[server.js] ERROR: No standalone server.js found! Checked paths:\n" + candidatePaths.join("\n"));
  process.exit(1);
}
