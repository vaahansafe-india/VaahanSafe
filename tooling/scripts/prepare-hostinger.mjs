import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const webDir = path.join(rootDir, "apps/web");
const webNextDir = path.join(webDir, ".next");
const rootNextDir = path.join(rootDir, ".next");

console.log("[prepare-hostinger] Preparing Hostinger standalone server layout...");

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

// 1. Check if apps/web/.next exists
if (!fs.existsSync(webNextDir)) {
  console.error("[prepare-hostinger] ERROR: apps/web/.next does not exist!");
  process.exit(1);
}

const webStandaloneDir = path.join(webNextDir, "standalone");
const nestedServerJs = path.join(webStandaloneDir, "apps/web/server.js");
const rootStandaloneDir = path.join(rootNextDir, "standalone");

// 2. Ensure public and static assets are copied to standalone folder
const webPublicDir = path.join(webDir, "public");
const webStaticDir = path.join(webNextDir, "static");

// Copy static to apps/web/.next/standalone/apps/web/.next/static
if (fs.existsSync(webStaticDir)) {
  copyDirSync(webStaticDir, path.join(webStandaloneDir, "apps/web/.next/static"));
  copyDirSync(webStaticDir, path.join(webStandaloneDir, ".next/static"));
}

// Copy public to apps/web/.next/standalone/apps/web/public
if (fs.existsSync(webPublicDir)) {
  copyDirSync(webPublicDir, path.join(webStandaloneDir, "apps/web/public"));
  copyDirSync(webPublicDir, path.join(webStandaloneDir, "public"));
}

// Ensure server.js exists at webStandaloneDir root
if (fs.existsSync(nestedServerJs)) {
  fs.copyFileSync(nestedServerJs, path.join(webStandaloneDir, "server.js"));
}

// 3. Mirror the entire .next folder to monorepo root .next
console.log("[prepare-hostinger] Mirroring apps/web/.next to root .next...");
copyDirSync(webNextDir, rootNextDir);

// Copy public to root public for next start
if (fs.existsSync(webPublicDir)) {
  copyDirSync(webPublicDir, path.join(rootDir, "public"));
}

// Ensure server.js exists at rootNextDir/standalone/server.js
if (fs.existsSync(nestedServerJs)) {
  fs.mkdirSync(rootStandaloneDir, { recursive: true });
  fs.copyFileSync(nestedServerJs, path.join(rootStandaloneDir, "server.js"));
  
  // Also create a fallback root server.js entrypoint
  const rootServerJs = path.join(rootDir, "server.js");
  const serverProxyCode = `// Hostinger root server runner
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
`;
  fs.writeFileSync(rootServerJs, serverProxyCode, "utf-8");
}

console.log("[prepare-hostinger] Standalone server prepared successfully at all target locations!");
