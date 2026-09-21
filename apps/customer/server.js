// --- VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---
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
        const vendor = p.replace(/([/\\])node_modules$/, "$1vendor_modules");
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
      console.log(`[standalone] VaahanSafe Customer App running on http://${hostname}:${port}`);
    });
  }).catch((err) => {
    console.error("[standalone] Failed to start:", err);
    process.exit(1);
  });
}
