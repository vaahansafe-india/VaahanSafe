import type { jsPDF } from "jspdf";
import { C, setDraw, setText } from "../placard-theme";
import { PAGE } from "../placard-layout";
import { HOW_TO_USE_STEPS, PLACARD_COPY } from "../placard-copy";

/* -------------------------------------------------------------------------- */
/*                              HOW TO USE                                    */
/* -------------------------------------------------------------------------- */

export function drawInstructions(doc: jsPDF): void {
  const left = PAGE.marginX;
  const right = PAGE.width - PAGE.marginX;
  const y = 226;

  doc.setFont("courier", "bold");
  doc.setFontSize(6);
  setText(doc, C.coralDark);
  doc.text(PLACARD_COPY.instructionTag, left, y);

  setDraw(doc, C.line);
  doc.line(left, y + 4, right, y + 4);

  const colWidth = 54;
  const gap = 7;

  HOW_TO_USE_STEPS.forEach((step, index) => {
    const x = left + index * (colWidth + gap);

    doc.setFont("courier", "bold");
    doc.setFontSize(6);
    setText(doc, C.coral);
    doc.text(step.n, x, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, C.ink);
    doc.text(step.title, x + 9, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setText(doc, C.muted);

    const body = doc.splitTextToSize(step.body, colWidth - 9);
    doc.text(body, x + 9, y + 20, {
      lineHeightFactor: 1.35,
    });
  });
}
