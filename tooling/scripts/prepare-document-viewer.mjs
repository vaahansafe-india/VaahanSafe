import { mkdirSync, copyFileSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url));
mkdirSync(resolve(root, "apps/customer/public/pdfjs"), { recursive: true });
copyFileSync(
  resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
  resolve(root, "apps/customer/public/pdfjs/pdf.worker-6.4.299.min.mjs"),
);
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  cpSync(
    resolve(root, "node_modules/pdfjs-dist", directory),
    resolve(root, "apps/customer/public/pdfjs/6.4.299", directory),
    { recursive: true },
  );
}
console.log(
  "Prepared versioned PDF.js worker, character maps, fonts and image decoders.",
);
