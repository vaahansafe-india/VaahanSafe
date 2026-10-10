import { jsPDF } from "jspdf";
import type { buildStickerScene } from "./sticker-render-model";
// Each vector primitive uses the same mm coordinates as the safe SVG preview.
export function renderStickerPdf(
  scenes: ReturnType<typeof buildStickerScene>[],
) {
  if (!scenes.length || scenes.length > 100)
    throw new Error("Invalid production print quantity");
  const t = scenes[0]!.template,
    w = t.widthMm + 2 * t.bleedMm,
    h = t.heightMm + 2 * t.bleedMm;
  const pdf = new jsPDF({
    unit: "mm",
    format: [w, h],
    orientation: w > h ? "landscape" : "portrait",
    compress: true,
    putOnlyUsedFonts: true,
  });
  scenes.forEach((scene, index) => {
    if (JSON.stringify(scene.template) !== JSON.stringify(t))
      throw new Error("Mixed production specifications");
    if (index) pdf.addPage([w, h], w > h ? "landscape" : "portrait");
    for (const s of scene.shapes) {
      if (s.type === "rect") {
        pdf.setFillColor(s.fill);
        if (s.stroke) {
          pdf.setDrawColor(s.stroke);
          pdf.setLineWidth(0.2);
        }
        pdf.rect(
          s.x + t.bleedMm,
          s.y + t.bleedMm,
          s.width,
          s.height,
          s.stroke ? "FD" : "F",
        );
      } else {
        pdf.setTextColor(s.fill);
        pdf.setFont(s.mono ? "courier" : "helvetica");
        pdf.setFontSize((s.size * 72) / 25.4);
        // mm baseline matches SVG; ASCII-only manufacturing typography.
        pdf.text(
          s.text.replaceAll("•", "*"),
          s.x + t.bleedMm,
          s.y + t.bleedMm,
          { align: s.anchor === "middle" ? "center" : "left" },
        );
      }
    }
    // Trim indicators stay in the bleed, outside the safe content and QR quiet zone.
    pdf.setDrawColor("#888888");
    pdf.setLineWidth(0.1);
    for (const x of [t.bleedMm, t.bleedMm + t.widthMm])
      for (const y of [t.bleedMm, t.bleedMm + t.heightMm]) {
        pdf.line(
          x,
          y === t.bleedMm ? 0 : h - t.bleedMm + 0.5,
          x,
          y === t.bleedMm ? t.bleedMm - 0.5 : h,
        );
        pdf.line(
          x === t.bleedMm ? 0 : w - t.bleedMm + 0.5,
          y,
          x === t.bleedMm ? t.bleedMm - 0.5 : w,
          y,
        );
      }
  });
  return new Uint8Array(pdf.output("arraybuffer"));
}
