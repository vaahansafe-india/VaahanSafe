import type { jsPDF } from "jspdf";
import { C, setDraw, setFill, setText } from "../placard-theme";

/* -------------------------------------------------------------------------- */
/*                              REGISTRATION GRID                             */
/* -------------------------------------------------------------------------- */

export function drawRegistrationGrid(doc: jsPDF): void {
  setDraw(doc, C.line);
  doc.setLineWidth(0.22);

  // Top-left registration corner
  doc.line(10, 11, 25, 11);
  doc.line(10, 11, 10, 26);

  // Top-right registration corner
  doc.line(185, 11, 200, 11);
  doc.line(200, 11, 200, 26);

  // Bottom-left registration corner
  doc.line(10, 271, 10, 286);
  doc.line(10, 286, 25, 286);

  // Bottom-right registration corner
  doc.line(185, 286, 200, 286);
  doc.line(200, 271, 200, 286);

  // Sparse registration points
  setFill(doc, C.coral);
  doc.circle(35, 11, 0.75, "F");
  doc.circle(175, 286, 0.75, "F");

  setText(doc, C.soft);
  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);

  doc.text("A/01", 10, 9);
  doc.text("B/04", 190, 290);
}
