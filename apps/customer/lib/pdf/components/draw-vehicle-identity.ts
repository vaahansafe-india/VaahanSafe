import type { jsPDF } from "jspdf";
import type { QrDigitalPassData } from "@/lib/qr-types";
import { C, setDraw, setText } from "../placard-theme";
import { PAGE } from "../placard-layout";
import { cleanText, PLACARD_COPY } from "../placard-copy";

/* -------------------------------------------------------------------------- */
/*                            VEHICLE IDENTITY                                */
/* -------------------------------------------------------------------------- */

export function drawVehicleIdentity(
  doc: jsPDF,
  data: QrDigitalPassData
): void {
  const left = PAGE.marginX;
  const right = PAGE.width - PAGE.marginX;
  const y = 137;

  doc.setFont("courier", "bold");
  doc.setFontSize(6);
  setText(doc, C.coralDark);
  doc.text(PLACARD_COPY.vehicleTag, left, y);

  setDraw(doc, C.line);
  doc.line(left, y + 4, right, y + 4);

  const vehicleName = `${cleanText(data.vehicle.make, "")} ${cleanText(
    data.vehicle.model,
    ""
  )}`.trim();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setText(doc, C.ink);

  const safeVehicleName = vehicleName || "Vehicle";
  const vehicleLines = doc.splitTextToSize(safeVehicleName.toUpperCase(), 100);

  doc.text(vehicleLines.slice(0, 2), left, y + 14, {
    lineHeightFactor: 1.15,
  });

  // Neutral, clean registration plate presentation (zero HSRP imitation)
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text(
    cleanText(data.vehicle.plate, "REGISTRATION NOT PROVIDED"),
    right,
    y + 14,
    { align: "right" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setText(doc, C.muted);
  doc.text(PLACARD_COPY.vehicleFootnote, left, y + 25);
}
