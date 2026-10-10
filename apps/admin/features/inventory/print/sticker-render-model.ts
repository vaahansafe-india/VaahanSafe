import { generateScannableQrMatrix } from "@vaahansafe/qr-core";
import type { StickerTemplate } from "../inventory.types";
import { validateStickerTemplate } from "./sticker-template";
export type PrintPrimitive =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
      stroke?: string;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      size: number;
      anchor: "start" | "middle";
      fill: string;
      mono?: boolean;
    };
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function buildStickerScene(
  template: StickerTemplate,
  publicId: string,
  visibleCode: string,
  code?: string,
  sample = false,
) {
  validateStickerTemplate(template);
  if (
    !/^[A-Za-z0-9_-]{4,64}$/.test(publicId) ||
    !/^VS-[A-Z0-9-]{4,64}$/.test(visibleCode)
  )
    throw new Error("Invalid sticker identity");
  if (code && !/^[A-Z2-9]{16}$/.test(code))
    throw new Error("Invalid activation print material");
  const payload = `https://qr.vaahansafe.com/${publicId}`;
  const qr = generateScannableQrMatrix(payload, {
    errorCorrectionLevel: "Q",
    margin: 4,
  });
  const moduleMm = template.qr.size / qr.size;
  if (moduleMm < 0.5)
    throw new Error(
      "QR modules are too small for this production specification",
    );
  const shapes: PrintPrimitive[] = [
    {
      type: "rect",
      x: 0,
      y: 0,
      width: template.widthMm,
      height: template.heightMm,
      fill: "#ffffff",
    },
    {
      type: "text",
      x: 40,
      y: 9,
      text: "VAAHANSAFE",
      size: 5,
      anchor: "middle",
      fill: "#17231b",
    },
  ];
  for (let r = 0; r < qr.size; r++)
    for (let c = 0; c < qr.size; c++)
      if (qr.matrix[r]?.[c])
        shapes.push({
          type: "rect",
          x: template.qr.x + c * moduleMm,
          y: template.qr.y + r * moduleMm,
          width: moduleMm,
          height: moduleMm,
          fill: "#000000",
        });
  shapes.push(
    {
      type: "text",
      x: 45,
      y: 20,
      text: "SCAN FOR HELP",
      size: 2.8,
      anchor: "start",
      fill: "#17231b",
    },
    {
      type: "text",
      x: 45,
      y: 26,
      text: "Emergency contact",
      size: 2.2,
      anchor: "start",
      fill: "#444444",
    },
    {
      type: "text",
      x: 45,
      y: 32,
      text: visibleCode,
      size: 2.2,
      anchor: "start",
      fill: "#111111",
      mono: true,
    },
    {
      type: "rect",
      x: template.scratch.x,
      y: template.scratch.y,
      width: template.scratch.width,
      height: template.scratch.height,
      fill: code ? "#ffffff" : "#d8d0c5",
      stroke: "#827a6e",
    },
    {
      type: "text",
      x: template.scratch.x + template.scratch.width / 2,
      y: template.scratch.y + 4,
      text: code ? "PRIVATE ACTIVATION CODE" : "SCRATCH TO REVEAL",
      size: 1.8,
      anchor: "middle",
      fill: "#333333",
    },
    {
      type: "text",
      x: template.scratch.x + template.scratch.width / 2,
      y: template.scratch.y + 9,
      text: code ? code.match(/.{4}/g)!.join("-") : "•••• •••• •••• ••••",
      size: 2.1,
      anchor: "middle",
      fill: "#111111",
      mono: true,
    },
    {
      type: "text",
      x: 40,
      y: 56,
      text: "vaahansafe.com",
      size: 2.3,
      anchor: "middle",
      fill: "#555555",
    },
  );
  if (sample)
    shapes.push({
      type: "text",
      x: 40,
      y: 13,
      text: "SAMPLE - NOT FOR ACTIVATION",
      size: 2,
      anchor: "middle",
      fill: "#a9583e",
    });
  return {
    template,
    payload,
    moduleMm,
    shapes,
    containsActivationMaterial: !!code,
  };
}
export function renderStickerSvg(scene: ReturnType<typeof buildStickerScene>) {
  if (scene.containsActivationMaterial)
    throw new Error(
      "Activation material is restricted to protected production output",
    );
  const { template, shapes } = scene;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${template.widthMm}mm" height="${template.heightMm}mm" viewBox="0 0 ${template.widthMm} ${template.heightMm}" role="img" aria-label="VaahanSafe sticker preview; activation code concealed">${shapes.map((s) => (s.type === "rect" ? `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" fill="${s.fill}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="0.2"` : ""}/>` : `<text x="${s.x}" y="${s.y}" text-anchor="${s.anchor}" fill="${s.fill}" font-size="${s.size}" font-family="${s.mono ? "monospace" : "Arial, sans-serif"}">${escape(s.text)}</text>`)).join("")}</svg>`;
}
