// Hostinger & LiteSpeed root server runner (vaahansafe.com)
const path = require("path");
const fs = require("fs");
const Module = require("module");

// Ensure module lookup resolves monorepo and standalone dependencies across the entire process
const additionalPaths = [
  path.join(__dirname, "node_modules"),
  path.join(__dirname, ".next/standalone/node_modules"),
  path.join(__dirname, "apps/web/node_modules"),
  path.join(__dirname, "apps/web/.next/standalone/node_modules"),
];

for (const p of additionalPaths) {
  if (fs.existsSync(p)) {
    if (!module.paths.includes(p)) {
      module.paths.unshift(p);
    }
    if (!Module.globalPaths.includes(p)) {
      Module.globalPaths.unshift(p);
    }
  }
}

// Update NODE_PATH so subprocesses or child loaders inherit it
const currentDelimiter = path.delimiter || ":";
process.env.NODE_PATH = [
  ...additionalPaths.filter((p) => fs.existsSync(p)),
  process.env.NODE_PATH || "",
].filter(Boolean).join(currentDelimiter);

// Candidate locations for Next.js standalone server
const candidatePaths = [
  path.join(__dirname, ".next/standalone/apps/web/server.js"),
  path.join(__dirname, ".next/standalone/server.js"),
  path.join(__dirname, "apps/web/.next/standalone/apps/web/server.js"),
  path.join(__dirname, "apps/web/.next/standalone/server.js"),
];

let started = false;
for (const target of candidatePaths) {
  if (fs.existsSync(target)) {
    try {
      console.log(`[server.js] Attempting Next.js standalone server from: ${target}`);
      process.chdir(path.dirname(target));
      require(target);
      started = true;
      console.log(`[server.js] Successfully loaded standalone server: ${target}`);
      break;
    } catch (err) {
      console.warn(`[server.js] Standalone runner at ${target} threw error:`, err.message);
      process.chdir(__dirname);
    }
  }
}

// Fallback: standard Next.js production server runner
if (!started) {
  console.log("[server.js] Starting standard Next.js production server runner...");
  const { createServer } = require("http");
  const { parse } = require("url");

  let next;
  try {
    next = require("next");
  } catch (err) {
    console.error("[server.js] FATAL: Failed to require('next'). Node module paths:", Module.globalPaths);
    process.exit(1);
  }

  const dev = false;
  const hostname = process.env.HOSTNAME || "0.0.0.0";
  const port = parseInt(process.env.PORT, 10) || 3000;

  // Determine working app directory where .next or BUILD_ID resides
  let appDir = __dirname;
  if (!fs.existsSync(path.join(__dirname, ".next/BUILD_ID")) && fs.existsSync(path.join(__dirname, "apps/web/.next/BUILD_ID"))) {
    appDir = path.join(__dirname, "apps/web");
  }

  const app = next({ dev, hostname, port, dir: appDir });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`[server.js] Ready on http://${hostname}:${port}`);
    });
  }).catch((err) => {
    console.error("[server.js] Failed to start Next.js server:", err);
    process.exit(1);
  });
}
