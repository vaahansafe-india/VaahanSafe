import type { jsPDF } from "jspdf";
import { C, setDraw, setFill, setText } from "../placard-theme";
import { PAGE } from "../placard-layout";
import { PLACARD_COPY } from "../placard-copy";

/* -------------------------------------------------------------------------- */
/*                                  HEADER                                    */
/* -------------------------------------------------------------------------- */

export function drawBrandHeader(doc: jsPDF): void {
  const left = PAGE.marginX;
  const right = PAGE.width - PAGE.marginX;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setText(doc, C.ink);
  doc.text(PLACARD_COPY.brandTitle, left, 24);

  doc.setFont("courier", "normal");
  doc.setFontSize(6.5);
  setText(doc, C.muted);
  doc.text(PLACARD_COPY.brandSubtitle, left + 29, 24);

  // ACTIVE status indicator
  setFill(doc, C.success);
  doc.circle(right - 21, 22.8, 1.1, "F");

  doc.setFont("courier", "bold");
  doc.setFontSize(6.5);
  setText(doc, C.ink);
  doc.text(PLACARD_COPY.statusActive, right, 24, {
    align: "right",
  });

  // Divider rule
  setDraw(doc, C.line);
  doc.setLineWidth(0.3);
  doc.line(left, 30, right, 30);

  // Sparse registration point
  setFill(doc, C.coral);
  doc.circle(left + 38, 30, 0.8, "F");
}
