import "./build-vercel.mjs";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".vercel/output/static",
);
const outputConfig = JSON.parse(
  await readFile(path.join(root, "../config.json"), "utf8"),
);
const securityHeaders =
  outputConfig.routes.find(
    (route) => route.headers?.["Content-Security-Policy"],
  )?.headers || {};
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost:3011");
    if (url.pathname === "/workspace") {
      res.writeHead(302, { Location: "https://app.vaahansafe.com/park" });
      res.end();
      return;
    }
    const file = path.resolve(
      root,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!file.startsWith(root + path.sep) || !(await stat(file)).isFile())
      throw new Error("Not found");
    res.writeHead(200, {
      ...securityHeaders,
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(3011, "127.0.0.1", () =>
  console.log("Park preview: http://localhost:3011"),
);
