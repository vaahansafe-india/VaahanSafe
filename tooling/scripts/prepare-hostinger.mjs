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
const rootServerJs = path.join(rootDir, "server.js");

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

// 2. Synchronize .next build folder
if (fs.existsSync(webNextDir)) {
  copyDirSync(webNextDir, rootNextDir);
} else if (fs.existsSync(rootNextDir)) {
  copyDirSync(rootNextDir, webNextDir);
}

// 3. Ensure public directory has brand assets
if (fs.existsSync(webPublicDir)) {
  copyDirSync(webPublicDir, rootPublicDir);
}

// 4. Create standalone layout expected by Hostinger's Next.js validator
// Hostinger checks: [ -f ".next/standalone/server.js" ]
const rootStandaloneDir = path.join(rootNextDir, "standalone");
const webStandaloneDir = path.join(webNextDir, "standalone");
const rootStandaloneAppsWeb = path.join(rootStandaloneDir, "apps/web");
const webStandaloneAppsWeb = path.join(webStandaloneDir, "apps/web");

for (const dir of [rootStandaloneDir, webStandaloneDir, rootStandaloneAppsWeb, webStandaloneAppsWeb]) {
  fs.mkdirSync(dir, { recursive: true });
}

// Copy our zero-dependency server.js to all standalone server locations
if (fs.existsSync(rootServerJs)) {
  const serverJsContent = fs.readFileSync(rootServerJs, "utf-8");
  fs.writeFileSync(path.join(rootStandaloneDir, "server.js"), serverJsContent, "utf-8");
  fs.writeFileSync(path.join(webStandaloneDir, "server.js"), serverJsContent, "utf-8");
  fs.writeFileSync(path.join(rootStandaloneAppsWeb, "server.js"), serverJsContent, "utf-8");
  fs.writeFileSync(path.join(webStandaloneAppsWeb, "server.js"), serverJsContent, "utf-8");
}

// Create minimal package.json in standalone
const standalonePkg = JSON.stringify({
  name: "vaahansafe-standalone",
  version: "1.0.0",
  private: true,
  scripts: { start: "node server.js" },
}, null, 2);

fs.writeFileSync(path.join(rootStandaloneDir, "package.json"), standalonePkg, "utf-8");
fs.writeFileSync(path.join(webStandaloneDir, "package.json"), standalonePkg, "utf-8");

// Copy out and public to standalone folders so server.js finds static files in any working directory
if (fs.existsSync(webOutDir)) {
  copyDirSync(webOutDir, path.join(rootStandaloneDir, "public"));
  copyDirSync(webOutDir, path.join(rootStandaloneDir, "out"));
  copyDirSync(webOutDir, path.join(webStandaloneDir, "public"));
  copyDirSync(webOutDir, path.join(webStandaloneDir, "out"));
}

// Verify target files exist
const verifiedRootOut = path.join(rootOutDir, "index.html");
const verifiedPublicHtml = path.join(rootPublicHtmlDir, "index.html");
const verifiedStandaloneServer = path.join(rootStandaloneDir, "server.js");

if (fs.existsSync(verifiedRootOut)) {
  console.log("[prepare-hostinger] Verified static index.html at root/out/index.html");
}
if (fs.existsSync(verifiedPublicHtml)) {
  console.log("[prepare-hostinger] Verified static index.html at root/public_html/index.html");
}
if (fs.existsSync(verifiedStandaloneServer)) {
  console.log("[prepare-hostinger] Verified standalone server at root/.next/standalone/server.js");
}

console.log("[prepare-hostinger] All Hostinger deployment artifacts prepared successfully!");
