import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const source = path.join(root, "apps/park/public/favicon.svg");
const targets = [
  path.join(root, "apps/park/public/icons"),
  path.join(root, "apps/customer/public/images/park"),
];
copyFileSync(source, path.join(root, "apps/customer/app/park/icon.svg"));
for (const target of targets) {
  mkdirSync(target, { recursive: true });
  copyFileSync(source, path.join(target, "icon.svg"));
  for (const size of [180, 192, 512])
    await sharp(readFileSync(source))
      .resize(size, size)
      .png()
      .toFile(path.join(target, `icon-${size}.png`));
  // Maskable icons keep the entire mark inside the central safe area.
  const mark = await sharp(readFileSync(source))
    .resize(360, 360)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: "#304C3B" },
  })
    .composite([{ input: mark, left: 76, top: 76 }])
    .png()
    .toFile(path.join(target, "icon-maskable-512.png"));
}
copyFileSync(
  path.join(root, "apps/park/public/art/park-hero.webp"),
  path.join(targets[1], "park-hero.webp"),
);
for (const [folder, start, scope, prefix] of [
  ["apps/park/public", "/", "/", "/icons"],
  ["apps/customer/public/images/park", "/park", "/park", "/images/park"],
])
  writeFileSync(
    path.join(root, folder, "manifest.webmanifest"),
    JSON.stringify(
      {
        id: start,
        name: "Park by VaahanSafe",
        short_name: "Park",
        description: "Your private parking notebook.",
        start_url: start,
        scope,
        display: "standalone",
        background_color: "#F6F3EB",
        theme_color: "#304C3B",
        icons: [
          {
            src: `${prefix}/icon-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${prefix}/icon-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${prefix}/icon-maskable-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      null,
      2,
    ) + "\n",
  );
console.log("Park SVG, touch and install icons generated for both surfaces.");
