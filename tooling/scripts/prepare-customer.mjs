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
      try {
        const srcStat = fs.statSync(srcPath);
        if (fs.existsSync(destPath)) {
          const destStat = fs.statSync(destPath);
          if (srcStat.size === destStat.size && srcStat.mtimeMs <= destStat.mtimeMs) {
            continue;
          }
        }
      } catch (_) {}
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

// 3. Create vendor_modules mirror (Hostinger packaging preserves vendor_modules and node_modules)
const customerStandaloneModules = path.join(customerStandaloneDir, "node_modules");
const rootStandaloneModules = path.join(rootStandaloneDir, "node_modules");
const rootModules = path.join(rootDir, "node_modules");
const sourceModules = fs.existsSync(customerStandaloneModules)
  ? customerStandaloneModules
  : (fs.existsSync(rootStandaloneModules) ? rootStandaloneModules : rootModules);

if (fs.existsSync(sourceModules)) {
  console.log("[prepare-customer] Creating self-contained module distributions in root, .next, and standalone...");
  const vendorTargets = [
    path.join(rootStandaloneDir, "vendor_modules"),
    path.join(rootStandaloneDir, "node_modules"),
    path.join(customerStandaloneDir, "vendor_modules"),
    path.join(customerStandaloneDir, "node_modules"),
    path.join(rootStandaloneDir, "apps/customer/vendor_modules"),
    path.join(rootStandaloneDir, "apps/customer/node_modules"),
    path.join(customerStandaloneDir, "apps/customer/vendor_modules"),
    path.join(customerStandaloneDir, "apps/customer/node_modules"),
    path.join(customerDir, "vendor_modules"),
    path.join(rootDir, "vendor_modules"),
    path.join(rootNextDir, "vendor_modules"),
    path.join(rootNextDir, "node_modules"),
  ];

  for (const target of vendorTargets) {
    copyDirSync(sourceModules, target);
  }
}

// 4. Ensure static assets and public directory are copied into all deployment locations
const customerStaticDir = path.join(customerNextDir, "static");
const rootStaticDir = path.join(rootNextDir, "static");

const staticTargets = [
  path.join(customerStandaloneDir, "apps/customer/.next/static"),
  path.join(rootStandaloneDir, "apps/customer/.next/static"),
  path.join(rootStandaloneDir, ".next/static"),
  path.join(customerStandaloneDir, ".next/static"),
  path.join(rootStandaloneDir, "static"),
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
  path.join(rootNextDir, "public"),
  rootPublicDir,
];

for (const target of publicTargets) {
  if (fs.existsSync(customerPublicDir)) {
    copyDirSync(customerPublicDir, target);
  }
}

// 5. Self-healing module resolver header to inject into every server entrypoint
const selfHealingHeader = `// --- VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---
;(function () {
  const __fs = require("fs");
  const __path = require("path");
  const __Module = require("module");

  const __candidates = [
    __path.join(__dirname, "vendor_modules"),
    __path.join(__dirname, "node_modules"),
    __path.join(__dirname, "standalone/vendor_modules"),
    __path.join(__dirname, "standalone/node_modules"),
    __path.join(__dirname, ".next/standalone/vendor_modules"),
    __path.join(__dirname, ".next/standalone/node_modules"),
    __path.join(__dirname, "apps/customer/.next/standalone/vendor_modules"),
    __path.join(__dirname, "apps/customer/.next/standalone/node_modules"),
    __path.join(__dirname, "apps/customer/vendor_modules"),
    __path.join(__dirname, "apps/customer/node_modules"),
    __path.join(__dirname, "../vendor_modules"),
    __path.join(__dirname, "../node_modules"),
    __path.join(__dirname, "../../vendor_modules"),
    __path.join(__dirname, "../../node_modules"),
    __path.join(__dirname, "../../../vendor_modules"),
    __path.join(__dirname, "../../../node_modules"),
    __path.join(__dirname, "../standalone/vendor_modules"),
    __path.join(__dirname, "../standalone/node_modules"),
    __path.join(__dirname, "../.next/standalone/vendor_modules"),
    __path.join(__dirname, "../.next/standalone/node_modules"),
    __path.join(__dirname, "../apps/customer/.next/standalone/vendor_modules"),
    __path.join(__dirname, "../apps/customer/.next/standalone/node_modules"),
    __path.join(__dirname, "../apps/customer/vendor_modules"),
    __path.join(__dirname, "../apps/customer/node_modules"),
  ];

  const __knownModuleDirs = __candidates.filter((p) => {
    try {
      return __fs.existsSync(p);
    } catch (_) {
      return false;
    }
  });

  // 1. Global path hook: automatically injects vendor_modules and node_modules into ANY module lookup
  if (!__Module.__vs_nodeModulePathsHooked) {
    __Module.__vs_nodeModulePathsHooked = true;
    const __origNodeModulePaths = __Module._nodeModulePaths;
    __Module._nodeModulePaths = function (from) {
      const paths = __origNodeModulePaths.call(this, from);
      const extra = [...__knownModuleDirs];
      for (const p of paths) {
        if (!extra.includes(p)) extra.push(p);
        const vendor = p.replace(/([/\\\\])node_modules$/, "$1vendor_modules");
        if (vendor !== p && !extra.includes(vendor)) extra.push(vendor);
      }
      return extra;
    };
  }

  // 2. Global fallback resolver for any residual unbundled dependencies (e.g. nested CJS requires)
  if (!__Module.__vs_resolveFilenameHooked) {
    __Module.__vs_resolveFilenameHooked = true;
    const __origResolveFilename = __Module._resolveFilename;
    __Module._resolveFilename = function (request, parent, isMain, options) {
      try {
        return __origResolveFilename.call(this, request, parent, isMain, options);
      } catch (err) {
        if (err.code === "MODULE_NOT_FOUND" && !request.startsWith(".")) {
          for (const dir of __knownModuleDirs) {
            const candidate = __path.join(dir, request);
            try {
              return __origResolveFilename.call(this, candidate, parent, isMain, options);
            } catch (_) {}
          }
        }
        throw err;
      }
    };
  }

  for (const p of __knownModuleDirs) {
    if (!module.paths.includes(p)) {
      module.paths.unshift(p);
    }
  }

  try {
    __Module.Module._initPaths();
  } catch (_) {}
})();
// --- END VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---
`;

// Patch a generated Next.js server.js file to inject or update the self-healing resolver
function patchServerJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf-8");

  const startMarker = "// --- VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---";
  const endMarker = "// --- END VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---";

  if (content.includes(startMarker) && content.includes(endMarker)) {
    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker) + endMarker.length;
    content = content.slice(0, startIndex) + selfHealingHeader.trim() + content.slice(endIndex);
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`[prepare-customer] Updated self-healing loader in: ${path.relative(rootDir, filePath)}`);
    return;
  }

  // Insert header right before require('next') or at the top
  let patched = content;
  if (patched.includes("require('next')")) {
    patched = patched.replace("require('next')", `${selfHealingHeader.trim()}\nrequire('next')`);
  } else {
    patched = `${selfHealingHeader.trim()}\n${patched}`;
  }

  fs.writeFileSync(filePath, patched, "utf-8");
  console.log(`[prepare-customer] Patched server with self-healing loader: ${path.relative(rootDir, filePath)}`);
}

const serversToPatch = [
  path.join(customerStandaloneDir, "apps/customer/server.js"),
  path.join(rootStandaloneDir, "apps/customer/server.js"),
  path.join(customerStandaloneDir, "server.js"),
  path.join(rootStandaloneDir, "server.js"),
  path.join(customerDir, "server.js"),
];

for (const s of serversToPatch) {
  patchServerJs(s);
}

// 6. Create universal entrypoints for Hostinger LiteSpeed
// Hostinger check cases:
// Case A: Output directory is ".next" -> LiteSpeed looks for .next/server.js
// Case B: Output directory is ".next/standalone" -> LiteSpeed looks for .next/standalone/server.js
// Case C: Output directory is "." (root) -> LiteSpeed looks for root server.js
fs.mkdirSync(rootStandaloneDir, { recursive: true });
fs.mkdirSync(rootNextDir, { recursive: true });

const standaloneServerJs = path.join(rootStandaloneDir, "server.js");
const nextServerJs = path.join(rootNextDir, "server.js");

const launcherCode = `${selfHealingHeader}
// VaahanSafe Customer App — Hostinger Standalone Launcher
const __fs = require("fs");
const __path = require("path");

const customerServer = [
  __path.join(__dirname, "standalone/apps/customer/server.js"),
  __path.join(__dirname, "apps/customer/server.js"),
  __path.join(__dirname, ".next/standalone/apps/customer/server.js"),
  __path.join(__dirname, "standalone/server.js"),
  __path.join(__dirname, "../apps/customer/.next/standalone/apps/customer/server.js"),
  __path.join(__dirname, "apps/customer/.next/standalone/apps/customer/server.js"),
  __path.join(__dirname, "../standalone/apps/customer/server.js"),
  __path.join(__dirname, "../.next/standalone/apps/customer/server.js"),
].find((p) => p !== __filename && __fs.existsSync(p));

if (customerServer) {
  console.log("[standalone] Launching VaahanSafe Customer App from:", customerServer);
  process.chdir(__path.dirname(customerServer));
  require(customerServer);
} else {
  // Direct Next.js start fallback
  console.log("[standalone] Standalone server not found, starting via direct Next.js prepare...");
  const next = require("next");
  const http = require("http");
  const port = parseInt(process.env.PORT, 10) || 3000;
  const hostname = process.env.HOSTNAME || "0.0.0.0";
  const appDir = __fs.existsSync(__path.join(__dirname, "app-build-manifest.json"))
    ? __path.join(__dirname, "..")
    : __dirname;
  const app = next({ dev: false, dir: appDir });
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
fs.writeFileSync(nextServerJs, launcherCode, "utf-8");
fs.writeFileSync(path.join(customerDir, "server.js"), launcherCode, "utf-8");

// 7. Ensure production package.json exists in root, .next, and standalone
const productionPackageJson = JSON.stringify({
  name: "vaahansafe-customer",
  version: "1.0.0",
  private: true,
  scripts: {
    start: "node server.js"
  }
}, null, 2);

fs.writeFileSync(path.join(rootStandaloneDir, "package.json"), productionPackageJson, "utf-8");
fs.writeFileSync(path.join(rootNextDir, "package.json"), productionPackageJson, "utf-8");

// 8. Verify target artifacts
const rootBuildId = path.join(rootNextDir, "BUILD_ID");
if (fs.existsSync(rootBuildId)) {
  console.log(`[prepare-customer] Verified BUILD_ID at root: ${fs.readFileSync(rootBuildId, "utf-8").trim()}`);
}

if (fs.existsSync(standaloneServerJs)) {
  console.log("[prepare-customer] Verified standalone server at root/.next/standalone/server.js");
}
if (fs.existsSync(nextServerJs)) {
  console.log("[prepare-customer] Verified next server at root/.next/server.js");
}

console.log("[prepare-customer] Customer App artifacts prepared successfully for Hostinger!");
