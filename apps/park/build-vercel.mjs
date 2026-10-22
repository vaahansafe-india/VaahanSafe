import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, cpSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const root = path.dirname(fileURLToPath(import.meta.url));
execFileSync(process.execPath, [path.join(root, "build.mjs")], {
  cwd: root,
  stdio: "inherit",
});
const target = path.join(root, ".vercel/output/static");
mkdirSync(target, { recursive: true });
mkdirSync(path.join(root, ".build"), { recursive: true });
const renderer = path.join(root, ".build/landing.mjs");
await build({
  entryPoints: [path.join(root, "src/landing.ts")],
  outfile: renderer,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
});
const { landing } = await import(pathToFileURL(renderer).href);
cpSync(path.join(root, "public"), target, { recursive: true });
writeFileSync(path.join(target, "index.html"), landing());
writeFileSync(
  path.join(target, "robots.txt"),
  "User-agent: *\nAllow: /\nSitemap: https://park.vaahansafe.com/sitemap.xml\n",
);
writeFileSync(
  path.join(target, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://park.vaahansafe.com/</loc></url></urlset>',
);
const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
};
writeFileSync(
  path.join(root, ".vercel/output/config.json"),
  JSON.stringify({
    version: 3,
    routes: [
      {
        src: "/workspace",
        status: 302,
        headers: { Location: "https://app.vaahansafe.com/park" },
      },
      { src: "/(.*)", headers, continue: true },
      { handle: "filesystem" },
    ],
  }),
);
console.log(
  "Park Vercel build output ready. No Cloudflare proxy or runtime required.",
);
