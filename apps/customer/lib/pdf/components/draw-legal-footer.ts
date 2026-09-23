import type { jsPDF } from "jspdf";
import type { QrDigitalPassData } from "@/lib/qr-types";
import { C, setDraw, setText } from "../placard-theme";
import { PAGE } from "../placard-layout";
import { cleanText, truncateMiddle, PLACARD_COPY } from "../placard-copy";

/* -------------------------------------------------------------------------- */
/*                                   FOOTER                                   */
/* -------------------------------------------------------------------------- */

export function drawLegalFooter(
  doc: jsPDF,
  data: QrDigitalPassData
): void {
  const left = PAGE.marginX;
  const right = PAGE.width - PAGE.marginX;
  const y = 266;

  setDraw(doc, C.line);
  doc.setLineWidth(0.3);
  doc.line(left, y, right, y);

  doc.setFont("courier", "bold");
  doc.setFontSize(6);
  setText(doc, C.ink);
  doc.text(
    `VAAHANSAFE / ${truncateMiddle(
      cleanText(data.visibleCode, "SAFETY IDENTITY"),
      30
    )}`,
    left,
    y + 7
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  setText(doc, C.muted);
  const lines = doc.splitTextToSize(PLACARD_COPY.disclaimer, 125);
  doc.text(lines, left, y + 13, {
    lineHeightFactor: 1.35,
  });

  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);
  doc.text(PLACARD_COPY.websiteDomain, right, y + 7, { align: "right" });
  doc.text(PLACARD_COPY.currentInfoNotice, right, y + 14, {
    align: "right",
  });
}
