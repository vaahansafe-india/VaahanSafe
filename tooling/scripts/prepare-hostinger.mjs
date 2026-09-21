import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const webDir = path.join(rootDir, "apps/web");
const webNextDir = path.join(webDir, ".next");
const rootNextDir = path.join(rootDir, ".next");
const webPublicDir = path.join(webDir, "public");
const rootPublicDir = path.join(rootDir, "public");

console.log("[prepare-hostinger] Preparing Hostinger build artifacts...");

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

// Determine where Next.js output the build
let primaryNextDir = null;
if (fs.existsSync(path.join(rootNextDir, "BUILD_ID"))) {
  primaryNextDir = rootNextDir;
} else if (fs.existsSync(path.join(webNextDir, "BUILD_ID"))) {
  primaryNextDir = webNextDir;
} else if (fs.existsSync(rootNextDir)) {
  primaryNextDir = rootNextDir;
} else if (fs.existsSync(webNextDir)) {
  primaryNextDir = webNextDir;
}

if (!primaryNextDir) {
  console.error("[prepare-hostinger] ERROR: No Next.js build output directory found!");
  process.exit(1);
}

console.log(`[prepare-hostinger] Found primary build output at: ${primaryNextDir}`);

// Mirror to BOTH root and apps/web so Next.js finds it anywhere
if (primaryNextDir === webNextDir) {
  console.log("[prepare-hostinger] Copying apps/web/.next -> root .next...");
  copyDirSync(webNextDir, rootNextDir);
} else {
  console.log("[prepare-hostinger] Copying root .next -> apps/web/.next...");
  copyDirSync(rootNextDir, webNextDir);
}

// Copy public assets to both root and apps/web
if (fs.existsSync(webPublicDir)) {
  copyDirSync(webPublicDir, rootPublicDir);
}

// Verify BUILD_ID in root .next
const rootBuildId = path.join(rootNextDir, "BUILD_ID");
if (fs.existsSync(rootBuildId)) {
  console.log(`[prepare-hostinger] Verified BUILD_ID at root: ${fs.readFileSync(rootBuildId, "utf-8").trim()}`);
} else {
  console.warn("[prepare-hostinger] WARNING: BUILD_ID not found at root .next/BUILD_ID!");
}

console.log("[prepare-hostinger] All build artifacts synchronized successfully!");
