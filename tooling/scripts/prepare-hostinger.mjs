import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");
const webDir = path.join(rootDir, "apps/web");
const webOutDir = path.join(webDir, "out");
const rootOutDir = path.join(rootDir, "out");
const rootPublicHtmlDir = path.join(rootDir, "public_html");
const webNextDir = path.join(webDir, ".next");
const rootNextDir = path.join(rootDir, ".next");
const webPublicDir = path.join(webDir, "public");
const rootPublicDir = path.join(rootDir, "public");

console.log("[prepare-hostinger] Synchronizing Hostinger deployment artifacts...");

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

// 1. Synchronize static export output to root 'out' and 'public_html'
if (fs.existsSync(webOutDir)) {
  console.log("[prepare-hostinger] Copying apps/web/out -> root/out...");
  copyDirSync(webOutDir, rootOutDir);

  console.log("[prepare-hostinger] Copying apps/web/out -> root/public_html for LiteSpeed native serving...");
  copyDirSync(webOutDir, rootPublicHtmlDir);
} else if (fs.existsSync(rootOutDir)) {
  console.log("[prepare-hostinger] Copying root/out -> root/public_html...");
  copyDirSync(rootOutDir, rootPublicHtmlDir);
}

// 2. Synchronize .next build folder if present
if (fs.existsSync(webNextDir)) {
  copyDirSync(webNextDir, rootNextDir);
} else if (fs.existsSync(rootNextDir)) {
  copyDirSync(rootNextDir, webNextDir);
}

// 3. Ensure public directory has brand assets
if (fs.existsSync(webPublicDir)) {
  copyDirSync(webPublicDir, rootPublicDir);
}

// Verify index.html existence in target locations
const verifiedRootOut = path.join(rootOutDir, "index.html");
const verifiedPublicHtml = path.join(rootPublicHtmlDir, "index.html");

if (fs.existsSync(verifiedRootOut)) {
  console.log("[prepare-hostinger] Verified static index.html at root/out/index.html");
}
if (fs.existsSync(verifiedPublicHtml)) {
  console.log("[prepare-hostinger] Verified static index.html at root/public_html/index.html");
}

console.log("[prepare-hostinger] All Hostinger deployment artifacts prepared successfully!");
