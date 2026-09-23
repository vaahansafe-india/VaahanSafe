import type { jsPDF } from "jspdf";

/* -------------------------------------------------------------------------- */
/*                                DESIGN TOKENS                               */
/* -------------------------------------------------------------------------- */

export const C = {
  paper: [250, 249, 245] as const,
  ink: [20, 20, 19] as const,
  body: [61, 61, 58] as const,
  muted: [108, 106, 100] as const,
  soft: [142, 139, 130] as const,
  line: [230, 223, 216] as const,
  surface: [245, 240, 232] as const,
  coral: [204, 120, 92] as const,
  coralDark: [169, 88, 62] as const,
  success: [93, 184, 114] as const,
  white: [255, 255, 255] as const,
};

export type RgbColor = readonly [number, number, number];

export function setText(doc: jsPDF, color: RgbColor): void {
  doc.setTextColor(color[0], color[1], color[2]);
}

export function setDraw(doc: jsPDF, color: RgbColor): void {
  doc.setDrawColor(color[0], color[1], color[2]);
}

export function setFill(doc: jsPDF, color: RgbColor): void {
  doc.setFillColor(color[0], color[1], color[2]);
}
