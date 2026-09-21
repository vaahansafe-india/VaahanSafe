import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const customerDir = path.join(rootDir, "apps/customer");
const customerNextDir = path.join(customerDir, ".next");
const rootNextDir = path.join(rootDir, ".next");
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

// Mirror customer .next to root .next
if (fs.existsSync(customerNextDir)) {
  console.log("[prepare-customer] Copying apps/customer/.next -> root .next...");
  copyDirSync(customerNextDir, rootNextDir);
}

// Mirror public assets
if (fs.existsSync(customerPublicDir)) {
  copyDirSync(customerPublicDir, rootPublicDir);
}

// Verify BUILD_ID in root .next
const rootBuildId = path.join(rootNextDir, "BUILD_ID");
if (fs.existsSync(rootBuildId)) {
  console.log(`[prepare-customer] Verified BUILD_ID at root: ${fs.readFileSync(rootBuildId, "utf-8").trim()}`);
}

console.log("[prepare-customer] Customer App artifacts prepared successfully!");
