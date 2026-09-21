// Hostinger & LiteSpeed High-Performance Static Server for VaahanSafe (Zero-Dependency)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

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
