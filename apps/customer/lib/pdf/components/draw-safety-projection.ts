import type { jsPDF } from "jspdf";
import type { QrDigitalPassData } from "@/lib/qr-types";
import { C, setDraw, setText } from "../placard-theme";
import { PAGE } from "../placard-layout";
import { cleanText, safeCount, PLACARD_COPY } from "../placard-copy";

/* -------------------------------------------------------------------------- */
/*                            SAFETY PROJECTION                               */
/* -------------------------------------------------------------------------- */

export function drawSafetyProjection(
  doc: jsPDF,
  data: QrDigitalPassData
): void {
  const left = PAGE.marginX;
  const right = PAGE.width - PAGE.marginX;
  const y = 174;

  doc.setFont("courier", "bold");
  doc.setFontSize(6);
  setText(doc, C.coralDark);
  doc.text(PLACARD_COPY.safetyTag, left, y);

  setDraw(doc, C.line);
  doc.line(left, y + 4, right, y + 4);

  const contacts = safeCount(data.safetySummary.emergencyContactsCount);

  const rows: Array<[string, string]> = [
    [
      "Emergency contacts",
      contacts === 1 ? "1 available" : `${contacts} available`,
    ],
    [
      "Blood group",
      data.safetySummary.bloodGroup
        ? cleanText(data.safetySummary.bloodGroup)
        : "Not shared",
    ],
    ["Public safety view", "Owner controlled"],
  ];

  let rowY = y + 14;

  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setText(doc, C.body);
    doc.text(label, left, rowY);

    doc.setFont("helvetica", "bold");
    setText(doc, C.ink);
    doc.text(value, right, rowY, {
      align: "right",
    });

    setDraw(doc, C.line);
    doc.setLineWidth(0.2);
    doc.line(left, rowY + 4, right, rowY + 4);

    rowY += 11;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setText(doc, C.muted);

  const privacy = doc.splitTextToSize(
    PLACARD_COPY.privacyStatement,
    right - left
  );

  doc.text(privacy, left, rowY + 2, {
    lineHeightFactor: 1.35,
  });
}
