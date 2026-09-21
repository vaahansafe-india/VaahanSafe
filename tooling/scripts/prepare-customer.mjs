import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const customerDir = path.join(rootDir, "apps/customer");
const customerNextDir = path.join(customerDir, ".next");
const rootNextDir = path.join(rootDir, ".next");
const customerStandaloneDir = path.join(customerNextDir, "standalone");
const rootStandaloneDir = path.join(rootNextDir, "standalone");
const customerPublicDir = path.join(customerDir, "public");
const rootPublicDir = path.join(rootDir, "public");

console.log("[prepare-customer] Synchronizing Customer App artifacts for Hostinger...");

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Mirror customer .next to root .next
if (fs.existsSync(customerNextDir)) {
  console.log("[prepare-customer] Copying apps/customer/.next -> root .next...");
  copyDirSync(customerNextDir, rootNextDir);
}

// 2. Mirror standalone folder if present
if (fs.existsSync(customerStandaloneDir)) {
  console.log("[prepare-customer] Copying apps/customer/.next/standalone -> root/.next/standalone...");
  copyDirSync(customerStandaloneDir, rootStandaloneDir);
}

// 3. Ensure static assets and public directory are copied into standalone directories
// (Required by Next.js standalone server to serve _next/static/ and public files)
const customerStaticDir = path.join(customerNextDir, "static");
const rootStaticDir = path.join(rootNextDir, "static");

const staticTargets = [
  path.join(customerStandaloneDir, "apps/customer/.next/static"),
  path.join(rootStandaloneDir, "apps/customer/.next/static"),
  path.join(rootStandaloneDir, ".next/static"),
  rootStaticDir,
];

for (const target of staticTargets) {
  if (fs.existsSync(customerStaticDir)) {
    copyDirSync(customerStaticDir, target);
  }
}

const publicTargets = [
  path.join(customerStandaloneDir, "apps/customer/public"),
  path.join(rootStandaloneDir, "apps/customer/public"),
  path.join(rootStandaloneDir, "public"),
  rootPublicDir,
];

for (const target of publicTargets) {
  if (fs.existsSync(customerPublicDir)) {
    copyDirSync(customerPublicDir, target);
  }
}

// 4. Create root standalone entrypoint expected by Hostinger's Next.js validator
// Hostinger checks: [ -f ".next/standalone/server.js" ]
fs.mkdirSync(rootStandaloneDir, { recursive: true });
const standaloneServerJs = path.join(rootStandaloneDir, "server.js");

const launcherCode = `// VaahanSafe Customer App — Hostinger Standalone Launcher
const path = require("path");
const fs = require("fs");

const customerServer = path.join(__dirname, "apps/customer/server.js");

if (fs.existsSync(customerServer)) {
  console.log("[standalone] Starting VaahanSafe Customer App from:", customerServer);
  require(customerServer);
} else {
  console.error("[standalone] Customer server not found at:", customerServer);
  process.exit(1);
}
`;

fs.writeFileSync(standaloneServerJs, launcherCode, "utf-8");

// Also ensure package.json exists in root standalone
const rootStandalonePkg = path.join(rootStandaloneDir, "package.json");
if (!fs.existsSync(rootStandalonePkg) && fs.existsSync(path.join(rootDir, "package.json"))) {
  fs.copyFileSync(path.join(rootDir, "package.json"), rootStandalonePkg);
}

// 5. Verify target artifacts
const rootBuildId = path.join(rootNextDir, "BUILD_ID");
if (fs.existsSync(rootBuildId)) {
  console.log(`[prepare-customer] Verified BUILD_ID at root: ${fs.readFileSync(rootBuildId, "utf-8").trim()}`);
}

if (fs.existsSync(standaloneServerJs)) {
  console.log("[prepare-customer] Verified standalone server at root/.next/standalone/server.js");
}

console.log("[prepare-customer] Customer App artifacts prepared successfully for Hostinger!");
