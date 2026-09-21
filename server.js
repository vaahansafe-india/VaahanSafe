// Hostinger & LiteSpeed High-Performance Server for VaahanSafe
const http = require("http");
const fs = require("fs");
const path = require("path");
const Module = require("module");

// --- VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---
;(function () {
  const candidateDirs = [
    path.join(__dirname, "vendor_modules"),
    path.join(__dirname, "node_modules"),
    path.join(__dirname, ".next/standalone/vendor_modules"),
    path.join(__dirname, ".next/standalone/node_modules"),
    path.join(__dirname, "apps/customer/.next/standalone/vendor_modules"),
    path.join(__dirname, "apps/customer/.next/standalone/node_modules"),
    path.join(__dirname, "apps/customer/vendor_modules"),
    path.join(__dirname, "apps/customer/node_modules"),
    path.join(__dirname, "../vendor_modules"),
    path.join(__dirname, "../node_modules"),
    path.join(__dirname, "../../vendor_modules"),
    path.join(__dirname, "../../node_modules"),
    path.join(__dirname, "../../../vendor_modules"),
    path.join(__dirname, "../../../node_modules"),
    path.join(__dirname, "../.next/standalone/vendor_modules"),
    path.join(__dirname, "../.next/standalone/node_modules"),
    path.join(__dirname, "../apps/customer/.next/standalone/vendor_modules"),
    path.join(__dirname, "../apps/customer/.next/standalone/node_modules"),
    path.join(__dirname, "../apps/customer/vendor_modules"),
    path.join(__dirname, "../apps/customer/node_modules"),
  ];

  const knownModuleDirs = candidateDirs.filter((p) => {
    try {
      return fs.existsSync(p);
    } catch (_) {
      return false;
    }
  });

  // 1. Global Hook: Module._nodeModulePaths
  // Node calls this for EVERY required file in the entire process to determine where to find packages.
  // We inject all discovered vendor_modules directories so nested requires like 'react' inside react-dom resolve.
  if (!Module.__vs_nodeModulePathsHooked) {
    Module.__vs_nodeModulePathsHooked = true;
    const origNodeModulePaths = Module._nodeModulePaths;
    Module._nodeModulePaths = function (from) {
      const paths = origNodeModulePaths.call(this, from);
      const extra = [...knownModuleDirs];
      for (const p of paths) {
        if (!extra.includes(p)) extra.push(p);
        const vendor = p.replace(/([/\\])node_modules$/, "$1vendor_modules");
        if (vendor !== p && !extra.includes(vendor)) extra.push(vendor);
      }
      return extra;
    };
  }

  // 2. Global Hook: Module._resolveFilename
  // Catch any residual MODULE_NOT_FOUND errors and search candidate vendor directories.
  if (!Module.__vs_resolveFilenameHooked) {
    Module.__vs_resolveFilenameHooked = true;
    const origResolveFilename = Module._resolveFilename;
    Module._resolveFilename = function (request, parent, isMain, options) {
      try {
        return origResolveFilename.call(this, request, parent, isMain, options);
      } catch (err) {
        if (err.code === "MODULE_NOT_FOUND" && !request.startsWith(".")) {
          for (const dir of knownModuleDirs) {
            const candidate = path.join(dir, request);
            try {
              return origResolveFilename.call(this, candidate, parent, isMain, options);
            } catch (_) {}
          }
        }
        throw err;
      }
    };
  }

  for (const p of knownModuleDirs) {
    if (!module.paths.includes(p)) {
      module.paths.unshift(p);
    }
  }

  try {
    Module._initPaths();
  } catch (_) {}
})();
// --- END VAAHANSAFE HOSTINGER SELF-HEALING MODULE RESOLVER ---

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

// 1. Check if running as customer SSR application on Hostinger
const customerStandaloneCandidates = [
  path.join(__dirname, ".next/standalone/apps/customer/server.js"),
  path.join(__dirname, "apps/customer/.next/standalone/apps/customer/server.js"),
  path.join(__dirname, ".next/standalone/server.js"),
  path.join(__dirname, "apps/customer/.next/standalone/server.js"),
  path.join(__dirname, "../.next/standalone/apps/customer/server.js"),
  path.join(__dirname, "../apps/customer/.next/standalone/apps/customer/server.js"),
  path.join(__dirname, "../.next/standalone/server.js"),
  path.join(__dirname, "apps/customer/server.js"),
].filter((p) => p !== __filename && fs.existsSync(p));

const foundCustomerServer = customerStandaloneCandidates[0];
const isCustomerApp =
  process.env.APP_NAME === "customer" ||
  process.env.NEXT_PUBLIC_APP_URL?.includes("app.vaahansafe.com") ||
  (!fs.existsSync(path.join(__dirname, "public_html/index.html")) &&
   !fs.existsSync(path.join(__dirname, "out/index.html")) &&
   Boolean(foundCustomerServer));

if (isCustomerApp) {
  if (foundCustomerServer) {
    console.log(`[server.js] Launching VaahanSafe Customer App from: ${foundCustomerServer}`);
    require(foundCustomerServer);
    return;
  }

  console.log(`[server.js] Starting Customer App directly with Next.js...`);
  const next = require("next");
  const customerDir = fs.existsSync(path.join(__dirname, "apps/customer"))
    ? path.join(__dirname, "apps/customer")
    : __dirname;
  const app = next({ dev: false, dir: customerDir });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    http.createServer((req, res) => handle(req, res)).listen(PORT, HOSTNAME, () => {
      console.log(`[server.js] VaahanSafe Customer App running on http://${HOSTNAME}:${PORT}`);
    });
  }).catch((err) => {
    console.error("[server.js] Failed to start Customer App:", err);
    process.exit(1);
  });
  return;
}


// Candidate static asset directories in order of preference
const candidateDirs = [
  path.join(__dirname, "public_html"),
  path.join(__dirname, "out"),
  path.join(__dirname, "apps/web/out"),
  path.join(__dirname, "public"),
  path.join(__dirname, "../../public_html"),
  path.join(__dirname, "../../out"),
  path.join(__dirname, "../../apps/web/out"),
  path.join(__dirname, "../../public"),
  path.join(__dirname, "../public_html"),
  path.join(__dirname, "../out"),
  path.join(__dirname, "../public"),
];

let staticDir = candidateDirs.find((d) => fs.existsSync(path.join(d, "index.html"))) || candidateDirs[0];
console.log(`[server.js] Serving VaahanSafe static portal from: ${staticDir}`);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webmanifest": "application/manifest+json",
};

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // Normalize path
    if (pathname.endsWith("/") && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    // Prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
    let filePath = path.join(staticDir, safePath);

    let is404 = false;

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const indexCandidate = path.join(filePath, "index.html");
      if (fs.existsSync(indexCandidate)) {
        filePath = indexCandidate;
      } else {
        is404 = true;
      }
    } else if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + ".html")) {
        filePath = filePath + ".html";
      } else {
        is404 = true;
      }
    }

    if (is404) {
      const notFoundPath = path.join(staticDir, "404.html");
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, {
          "Content-Type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
        });
        fs.createReadStream(notFoundPath).pipe(res);
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const headers = {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    };

    if (pathname.startsWith("/_next/static/") || pathname.startsWith("/brand/") || pathname.startsWith("/images/")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else if (ext === ".html") {
      headers["Cache-Control"] = "public, max-age=0, must-revalidate";
    } else {
      headers["Cache-Control"] = "public, max-age=86400";
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("[server.js] Request error:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`[server.js] VaahanSafe portal ready on http://${HOSTNAME}:${PORT}`);
});
