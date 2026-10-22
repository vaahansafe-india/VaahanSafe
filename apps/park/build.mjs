import { execFileSync } from "node:child_process";
import { mkdirSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.dirname(fileURLToPath(import.meta.url));
for (const folder of ["fonts", "art"])
  mkdirSync(path.join(root, "public", folder), { recursive: true });
for (const name of readdirSync(path.join(root, "../view/public/fonts")))
  copyFileSync(
    path.join(root, "../view/public/fonts", name),
    path.join(root, "public/fonts", name),
  );
copyFileSync(
  path.join(root, "../view/public/art/paper-texture.webp"),
  path.join(root, "public/art/paper-texture.webp"),
);
copyFileSync(
  path.join(root, "../customer/public/favicon.svg"),
  path.join(root, "public/favicon.svg"),
);
if (!existsSync(path.join(root, "public/art/park-hero.webp")))
  throw new Error("Park hero artwork is required");
execFileSync(
  process.execPath,
  [
    path.join(root, "../../node_modules/tailwindcss/lib/cli.js"),
    "-c",
    "tailwind.config.cjs",
    "-i",
    "src/styles.css",
    "-o",
    "public/park.css",
    "--minify",
  ],
  { cwd: root, stdio: "inherit" },
);
