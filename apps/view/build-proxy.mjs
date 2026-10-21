import { mkdirSync, writeFileSync } from "node:fs";
const workerOrigin = (
  process.env.REPORT_VIEWER_WORKER_ORIGIN ||
  "https://vaahansafe-view.vaahansafe.workers.dev"
).replace(/\/$/, "");
if (workerOrigin !== "https://vaahansafe-view.vaahansafe.workers.dev") {
  throw new Error(
    "Report viewer Worker origin must match the approved deployment",
  );
}
// No credentials or report data live on the domain-routing project.
mkdirSync(".vercel/output/static", { recursive: true });
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
    routes: [
      {
        src: "/(.*)",
        dest: `${workerOrigin}/$1`,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    ],
  }),
);
