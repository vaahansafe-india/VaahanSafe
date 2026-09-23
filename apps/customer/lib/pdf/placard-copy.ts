/* -------------------------------------------------------------------------- */
/*                               COPY & STRING UTILITIES                       */
/* -------------------------------------------------------------------------- */

export function cleanText(value: unknown, fallback = "Not provided"): string {
  if (typeof value !== "string") return fallback;
  const text = value.trim();
  return text || fallback;
}

export function safeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export function truncateMiddle(value: string, max = 38): string {
  if (value.length <= max) return value;
  const side = Math.floor((max - 3) / 2);
  return `${value.slice(0, side)}...${value.slice(-side)}`;
}

export const PLACARD_COPY = {
  heroTag: "IDENTITY / 01",
  qrTag: "QR / 02",
  vehicleTag: "VEHICLE / 03",
  safetyTag: "SAFETY VIEW / 04",
  instructionTag: "HOW TO USE / 05",
  brandTitle: "VAAHANSAFE",
  brandSubtitle: "/ VEHICLE SAFETY IDENTITY",
  statusActive: "ACTIVE",
  heroHeadlineLines: [
    "THIS VEHICLE",
    "CARRIES A",
    "VAAHANSAFE",
    "SAFETY IDENTITY.",
  ],
  heroBody:
    "Scan the QR to open the vehicle owner's controlled public safety view.",
  qrInstruction: "SCAN TO OPEN SAFETY VIEW",
  railLabels: {
    left: "PHYSICAL VEHICLE",
    center: "IDENTITY",
    right: "QR RESOLVER",
  },
  vehicleFootnote:
    "Vehicle information associated with this VaahanSafe identity.",
  privacyStatement:
    "Only information intentionally included in the public safety view should be shown after scanning.",
  disclaimer:
    "VaahanSafe is a connection tool. It is not an emergency service, government identity document, or medical record.",
  websiteDomain: "vaahansafe.com",
  currentInfoNotice: "SCAN THE QR FOR CURRENT INFORMATION",
} as const;

export const HOW_TO_USE_STEPS = [
  {
    n: "01",
    title: "SCAN",
    body: "Scan the QR using a compatible phone camera.",
  },
  {
    n: "02",
    title: "OPEN",
    body: "Open the VaahanSafe public safety view.",
  },
  {
    n: "03",
    title: "CONNECT",
    body: "Use only the contact options made available in that view.",
  },
] as const;
