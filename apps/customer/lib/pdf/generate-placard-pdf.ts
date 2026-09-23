import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { QrDigitalPassData } from "@/lib/qr-types";

import { C, setFill } from "./placard-theme";
import { PAGE } from "./placard-layout";
import { cleanText } from "./placard-copy";
import { validatePlacardData } from "./placard-validation";

import { drawRegistrationGrid } from "./components/draw-registration-grid";
import { drawBrandHeader } from "./components/draw-brand-header";
import { drawQrIdentity } from "./components/draw-qr-identity";
import { drawVehicleIdentity } from "./components/draw-vehicle-identity";
import { drawSafetyProjection } from "./components/draw-safety-projection";
import { drawInstructions } from "./components/draw-instructions";
import { drawLegalFooter } from "./components/draw-legal-footer";

/* -------------------------------------------------------------------------- */
/*                             MAIN GENERATOR                                 */
/* -------------------------------------------------------------------------- */

/**
 * Generates an authoritative, publication-grade VaahanSafe Vehicle Safety Identity Placard.
 * Entire A4 sheet is designed as an integrated physical artifact with high-density vector typography,
 * precise registration marks, owner-controlled safety details, and quiet-zone-compliant QR matrix.
 */
export async function generatePlacardPdf(
  data: QrDigitalPassData
): Promise<jsPDF> {
  // 1. Authoritative validation
  validatePlacardData(data);

  // 2. High-density scannable QR code matrix with generous 4-module quiet zone
  const qrDataUrl = await QRCode.toDataURL(data.resolverUrl, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: 1200,
    color: {
      dark: "#141413",
      light: "#FFFFFF",
    },
  });

  // 3. Initialize jsPDF in A4 Portrait mode
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
  });

  doc.setProperties({
    title: `VaahanSafe Vehicle Safety Identity - ${cleanText(
      data.vehicle.plate,
      "Vehicle"
    )}`,
    subject: "VaahanSafe Vehicle Safety Identity Placard",
    author: "VaahanSafe",
    creator: "VaahanSafe",
    keywords: "VaahanSafe, vehicle safety identity, QR",
  });

  // 4. Subtle, warm paper background across entire A4 sheet
  setFill(doc, C.paper);
  doc.rect(0, 0, PAGE.width, PAGE.height, "F");

  // 5. Draw modular components
  drawRegistrationGrid(doc);
  drawBrandHeader(doc);
  drawQrIdentity(doc, qrDataUrl, data);
  drawVehicleIdentity(doc, data);
  drawSafetyProjection(doc, data);
  drawInstructions(doc);
  drawLegalFooter(doc, data);

  return doc;
}

/**
 * Client-safe trigger to download the generated PDF placard.
 */
export async function downloadPlacardPdf(
  data: QrDigitalPassData
): Promise<void> {
  const doc = await generatePlacardPdf(data);

  const cleanPlate = cleanText(data.vehicle.plate, "Vehicle").replace(
    /[^a-zA-Z0-9]/g,
    ""
  );

  doc.save(`VaahanSafe-Vehicle-Safety-Identity-${cleanPlate}.pdf`);
}
