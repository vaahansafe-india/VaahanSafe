import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const directory = "apps/customer/public/fonts";
await fs.mkdir(directory, { recursive: true });
const stylesheet =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap";
const response = await fetch(stylesheet, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  },
});
if (!response.ok) throw new Error("Font stylesheet unavailable");
const source = await response.text();
const faces = [
  ...source.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g),
].map((match) => match[1]);
if (faces.length < 5) throw new Error("Latin font faces unavailable");
const names = new Map();
const localFaces = [];
for (const face of faces) {
  const url = face.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1];
  if (!url) throw new Error("Unsupported font source");
  if (!names.has(url)) {
    const family = face
      .match(/font-family:\s*'([^']+)'/)?.[1]
      .toLowerCase()
      .replaceAll(" ", "-");
    const style = face.match(/font-style:\s*([^;]+)/)?.[1];
    const asset = await fetch(url);
    if (!asset.ok) throw new Error("Font download failed");
    const buffer = Buffer.from(await asset.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    const filename = `${family}-${style}-${hash}.woff2`;
    await fs.writeFile(path.join(directory, filename), buffer);
    names.set(url, filename);
  }
  localFaces.push(face.replace(url, `/fonts/${names.get(url)}`));
}
await fs.writeFile(
  "apps/customer/app/customer-fonts.css",
  "/* Local Latin font subsets; OFL licenses are in public/fonts. */\n" +
    localFaces.join("\n\n") +
    "\n",
);
for (const family of ["cormorantgaramond", "inter", "jetbrainsmono", "geist"]) {
  const license = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`,
  );
  if (!license.ok) throw new Error(`Font license unavailable: ${family}`);
  await fs.writeFile(
    path.join(directory, `${family}-OFL.txt`),
    await license.text(),
  );
}
console.log({
  fontFaces: faces.length,
  fontFiles: names.size,
  externalStylesheetRequired: false,
});
