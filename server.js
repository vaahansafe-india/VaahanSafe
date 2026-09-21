// Hostinger root server runner
const path = require("path");
const fs = require("fs");

const candidatePaths = [
  path.join(__dirname, ".next/standalone/apps/web/server.js"),
  path.join(__dirname, ".next/standalone/server.js"),
  path.join(__dirname, "apps/web/.next/standalone/apps/web/server.js"),
  path.join(__dirname, "apps/web/.next/standalone/server.js"),
];

for (const target of candidatePaths) {
  if (fs.existsSync(target)) {
    process.chdir(path.dirname(target));
    require(target);
    break;
  }
}
