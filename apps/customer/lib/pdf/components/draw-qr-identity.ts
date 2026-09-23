import type { jsPDF } from "jspdf";
import type { QrDigitalPassData } from "@/lib/qr-types";
import { C, setDraw, setFill, setText } from "../placard-theme";
import { PAGE } from "../placard-layout";
import { cleanText, PLACARD_COPY } from "../placard-copy";

/* -------------------------------------------------------------------------- */
/*                               HERO + QR                                    */
/* -------------------------------------------------------------------------- */

export function drawQrIdentity(
  doc: jsPDF,
  qrDataUrl: string,
  data: QrDigitalPassData
): void {
  const left = PAGE.marginX;
  const right = PAGE.width - PAGE.marginX;

  // Section numbering tags
  doc.setFont("courier", "bold");
  doc.setFontSize(6);
  setText(doc, C.coralDark);
  doc.text(PLACARD_COPY.heroTag, left, 42);
  doc.text(PLACARD_COPY.qrTag, 137, 42);

  // Serif statement headline
  doc.setFont("times", "bold");
  doc.setFontSize(25);
  setText(doc, C.ink);
  doc.text(PLACARD_COPY.heroHeadlineLines[0], left, 54);
  doc.text(PLACARD_COPY.heroHeadlineLines[1], left, 64);
  doc.text(PLACARD_COPY.heroHeadlineLines[2], left, 74);
  doc.text(PLACARD_COPY.heroHeadlineLines[3], left, 84);

  // Subtitle / context
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setText(doc, C.body);
  const body = doc.splitTextToSize(PLACARD_COPY.heroBody, 82);
  doc.text(body, left, 94, {
    lineHeightFactor: 1.45,
  });

  /* ------------------------------------------------------------------------ */
  /* QR CODE ZONE                                                             */
  /* ------------------------------------------------------------------------ */
  const qrX = 136;
  const qrY = 49;
  const qrOuter = 56;
  const qrSize = 46;

  setFill(doc, C.white);
  setDraw(doc, C.line);
  doc.setLineWidth(0.35);
  doc.rect(qrX, qrY, qrOuter, qrOuter, "FD");

  // Precision corner crosshair brackets
  setDraw(doc, C.ink);
  doc.setLineWidth(0.65);
  const k = 4;

  // Top-left
  doc.line(qrX - 2, qrY + k, qrX - 2, qrY - 2);
  doc.line(qrX - 2, qrY - 2, qrX + k, qrY - 2);

  // Top-right
  doc.line(qrX + qrOuter - k, qrY - 2, qrX + qrOuter + 2, qrY - 2);
  doc.line(qrX + qrOuter + 2, qrY - 2, qrX + qrOuter + 2, qrY + k);

  // Bottom-left
  doc.line(qrX - 2, qrY + qrOuter - k, qrX - 2, qrY + qrOuter + 2);
  doc.line(qrX - 2, qrY + qrOuter + 2, qrX + k, qrY + qrOuter + 2);

  // Bottom-right
  doc.line(qrX + qrOuter - k, qrY + qrOuter + 2, qrX + qrOuter + 2, qrY + qrOuter + 2);
  doc.line(qrX + qrOuter + 2, qrY + qrOuter - k, qrX + qrOuter + 2, qrY + qrOuter + 2);

  // High-resolution QR Code Raster
  doc.addImage(qrDataUrl, "PNG", qrX + 5, qrY + 5, qrSize, qrSize);

  // Visible identity code
  doc.setFont("courier", "bold");
  doc.setFontSize(7.2);
  setText(doc, C.ink);
  doc.text(
    cleanText(data.visibleCode, "VAAHANSAFE ID"),
    qrX + qrOuter / 2,
    qrY + qrOuter + 7,
    { align: "center" }
  );

  // Scanner hint
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  setText(doc, C.muted);
  doc.text(PLACARD_COPY.qrInstruction, qrX + qrOuter / 2, qrY + qrOuter + 11, {
    align: "center",
  });

  /* ------------------------------------------------------------------------ */
  /* CONNECTION RAIL                                                          */
  /* ------------------------------------------------------------------------ */
  const railY = 119;
  setDraw(doc, C.line);
  doc.setLineWidth(0.45);
  doc.line(left, railY, right, railY);

  setFill(doc, C.ink);
  doc.circle(left, railY, 1.5, "F");

  setFill(doc, C.coral);
  doc.circle(105, railY, 1.5, "F");

  setFill(doc, C.ink);
  doc.circle(right, railY, 1.5, "F");

  doc.setFont("courier", "normal");
  doc.setFontSize(5.5);
  setText(doc, C.muted);
  doc.text(PLACARD_COPY.railLabels.left, left, railY + 5);
  doc.text(PLACARD_COPY.railLabels.center, 105, railY + 5, {
    align: "center",
  });
  doc.text(PLACARD_COPY.railLabels.right, right, railY + 5, {
    align: "right",
  });
}
