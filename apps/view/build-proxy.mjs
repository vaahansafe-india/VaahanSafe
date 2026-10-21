import { mkdirSync, writeFileSync } from "node:fs";
// No credentials or report data live on the domain-routing project.
mkdirSync(".vercel/output/static", { recursive: true });
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify({
    version: 3,
    routes: [
      {
        src: "/(.*)",
        dest: "https://vaahansafe-view.vaahansafe.workers.dev/$1",
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    ],
  }),
);
