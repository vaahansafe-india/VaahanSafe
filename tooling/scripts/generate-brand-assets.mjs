import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// The existing TypeScript compiler strips types; asset geometry is never copied here.
async function loadSource(relative) {
  const source = fs.readFileSync(new URL(relative, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
  );
}
const {
  ALL_CORNERS_PATH,
  VEHICLE_BODY_PATH,
  QR_FINDERS_PATH,
  QR_DATA_PATH,
  QR_COMPACT_PATH,
} = await loadSource("../../packages/ui/src/brand/brand.geometry.tsx");
const { BRAND_COLORS } = await loadSource(
  "../../packages/ui/src/brand/brand.constants.ts",
);

export function assetSvg({
  mono = false,
  compact = false,
  icon = false,
  light = false,
} = {}) {
  const symbol = icon && !light ? BRAND_COLORS.canvas : BRAND_COLORS.ink;
  const frame = mono ? "currentColor" : BRAND_COLORS.coral;
  const paths = `<path d="${ALL_CORNERS_PATH}" fill="${frame}"/><path d="${VEHICLE_BODY_PATH}" fill="${mono ? "currentColor" : symbol}" fill-rule="evenodd"/><path d="${compact ? QR_COMPACT_PATH : QR_FINDERS_PATH}" fill="${mono ? "currentColor" : symbol}" fill-rule="evenodd"/>${compact ? "" : `<path d="${QR_DATA_PATH}" fill="${mono ? "currentColor" : symbol}"/>`}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="VaahanSafe"><title>VaahanSafe</title>${icon ? `<rect width="32" height="32" rx="7.68" fill="${light ? BRAND_COLORS.canvas : BRAND_COLORS.dark}"/><g transform="translate(2.88 2.88) scale(.82)">${paths}</g>` : paths}</svg>\n`;
}

export function generateBrandAssets() {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const dir = path.join(root, "apps/web/public/brand");
  fs.mkdirSync(dir, { recursive: true });
  const assets = {
    "vaahansafe-mark.svg": assetSvg(),
    "vaahansafe-mark-mono.svg": assetSvg({ mono: true }),
    "vaahansafe-app-icon.svg": assetSvg({ icon: true }),
    "vaahansafe-app-icon-light.svg": assetSvg({ icon: true, light: true }),
    "vaahansafe-favicon.svg": assetSvg({ icon: true, compact: true }),
  };
  for (const [name, svg] of Object.entries(assets))
    fs.writeFileSync(path.join(dir, name), svg);
  fs.writeFileSync(
    path.join(root, "apps/web/app/icon.svg"),
    assets["vaahansafe-favicon.svg"],
  );
  return Object.keys(assets);
}

// Uses the repository's existing TypeScript dependency; compatible with Node 20+.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  console.log(`Generated: ${generateBrandAssets().join(", ")}`);
}
