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

// 3. Create vendor_modules mirror (Hostinger packaging ignores node_modules, but preserves vendor_modules)
const customerStandaloneModules = path.join(customerStandaloneDir, "node_modules");
const rootStandaloneModules = path.join(rootStandaloneDir, "node_modules");
const sourceModules = fs.existsSync(customerStandaloneModules) ? customerStandaloneModules : rootStandaloneModules;

if (fs.existsSync(sourceModules)) {
  console.log("[prepare-customer] Creating self-contained vendor_modules distributions...");
  const vendorTargets = [
    path.join(rootStandaloneDir, "vendor_modules"),
    path.join(customerStandaloneDir, "vendor_modules"),
    path.join(rootStandaloneDir, "apps/customer/vendor_modules"),
    path.join(customerStandaloneDir, "apps/customer/vendor_modules"),
    path.join(rootStandaloneDir, "apps/customer/node_modules"),
    path.join(rootDir, "vendor_modules"),
    path.join(rootNextDir, "vendor_modules"),
  ];

  for (const target of vendorTargets) {
    copyDirSync(sourceModules, target);
  }
}

// 4. Ensure static assets and public directory are copied into all standalone directories
const customerStaticDir = path.join(customerNextDir, "static");
const rootStaticDir = path.join(rootNextDir, "static");

const staticTargets = [
  path.join(customerStandaloneDir, "apps/customer/.next/static"),
  path.join(rootStandaloneDir, "apps/customer/.next/static"),
  path.join(rootStandaloneDir, ".next/static"),
  path.join(customerStandaloneDir, ".next/static"),
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
  path.join(customerStandaloneDir, "public"),
  rootPublicDir,
];

for (const target of publicTargets) {
  if (fs.existsSync(customerPublicDir)) {
    copyDirSync(customerPublicDir, target);
  }
}

// 5. Self-healing module resolver header to inject into every standalone server.js
const selfHealingHeader = `// --- VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---
const __fs = require("fs");
const __path = require("path");

function __registerSearchPaths() {
  const __candidates = [
    __path.join(__dirname, "vendor_modules"),
    __path.join(__dirname, "node_modules"),
    __path.join(__dirname, "../vendor_modules"),
    __path.join(__dirname, "../node_modules"),
    __path.join(__dirname, "../../vendor_modules"),
    __path.join(__dirname, "../../node_modules"),
    __path.join(__dirname, "../../../vendor_modules"),
    __path.join(__dirname, "../../../node_modules"),
    __path.join(__dirname, ".next/standalone/vendor_modules"),
    __path.join(__dirname, ".next/standalone/node_modules"),
    __path.join(__dirname, "../.next/standalone/vendor_modules"),
    __path.join(__dirname, "../.next/standalone/node_modules"),
    __path.join(__dirname, "apps/customer/.next/standalone/vendor_modules"),
    __path.join(__dirname, "apps/customer/.next/standalone/node_modules"),
    __path.join(__dirname, "../apps/customer/.next/standalone/vendor_modules"),
    __path.join(__dirname, "../apps/customer/.next/standalone/node_modules"),
    __path.join(__dirname, "apps/customer/vendor_modules"),
    __path.join(__dirname, "apps/customer/node_modules"),
    __path.join(__dirname, "../apps/customer/vendor_modules"),
    __path.join(__dirname, "../apps/customer/node_modules"),
  ];

  for (const p of __candidates) {
    if (__fs.existsSync(p) && !module.paths.includes(p)) {
      module.paths.unshift(p);
    }
  }

  try {
    require("module").Module._initPaths();
  } catch (_) {}
}
__registerSearchPaths();
// --- END VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---
`;

// Patch a generated Next.js server.js file to inject the self-healing resolver
function patchServerJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  if (content.includes("VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER")) return;

  // Insert header right before require('next') or at the top
  let patched = content;
  if (patched.includes("require('next')")) {
    patched = patched.replace("require('next')", `${selfHealingHeader}\nrequire('next')`);
  } else {
    patched = `${selfHealingHeader}\n${patched}`;
  }

  fs.writeFileSync(filePath, patched, "utf-8");
  console.log(`[prepare-customer] Patched server with self-healing loader: ${path.relative(rootDir, filePath)}`);
}

const customerAppServerJs = path.join(customerStandaloneDir, "apps/customer/server.js");
const rootCustomerAppServerJs = path.join(rootStandaloneDir, "apps/customer/server.js");
patchServerJs(customerAppServerJs);
patchServerJs(rootCustomerAppServerJs);

// 6. Create root standalone entrypoint expected by Hostinger's Next.js validator
// Hostinger checks: [ -f ".next/standalone/server.js" ]
fs.mkdirSync(rootStandaloneDir, { recursive: true });
const standaloneServerJs = path.join(rootStandaloneDir, "server.js");

const launcherCode = `${selfHealingHeader}
// VaahanSafe Customer App — Hostinger Standalone Launcher
const customerServer = [
  __path.join(__dirname, "apps/customer/server.js"),
  __path.join(__dirname, "server.js"),
  __path.join(__dirname, "../apps/customer/.next/standalone/apps/customer/server.js"),
].find((p) => p !== __filename && __fs.existsSync(p));

if (customerServer) {
  console.log("[standalone] Launching VaahanSafe Customer App from:", customerServer);
  require(customerServer);
} else {
  // Direct Next.js start fallback
  const next = require("next");
  const http = require("http");
  const port = parseInt(process.env.PORT, 10) || 3000;
  const hostname = process.env.HOSTNAME || "0.0.0.0";
  const app = next({ dev: false, dir: __dirname });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    http.createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
      console.log(\`[standalone] VaahanSafe Customer App running on http://\${hostname}:\${port}\`);
    });
  }).catch((err) => {
    console.error("[standalone] Failed to start:", err);
    process.exit(1);
  });
}
`;

fs.writeFileSync(standaloneServerJs, launcherCode, "utf-8");

// Also ensure package.json exists in root standalone
const rootStandalonePkg = path.join(rootStandaloneDir, "package.json");
if (!fs.existsSync(rootStandalonePkg) && fs.existsSync(path.join(rootDir, "package.json"))) {
  fs.copyFileSync(path.join(rootDir, "package.json"), rootStandalonePkg);
}

// 7. Verify target artifacts
const rootBuildId = path.join(rootNextDir, "BUILD_ID");
if (fs.existsSync(rootBuildId)) {
  console.log(`[prepare-customer] Verified BUILD_ID at root: ${fs.readFileSync(rootBuildId, "utf-8").trim()}`);
}

if (fs.existsSync(standaloneServerJs)) {
  console.log("[prepare-customer] Verified standalone server at root/.next/standalone/server.js");
}

console.log("[prepare-customer] Customer App artifacts prepared successfully for Hostinger!");

