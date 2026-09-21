import {
  QrCodeIcon,
  BarCode01Icon,
  BarcodeScanIcon,
  PrinterIcon,
} from "@hugeicons/core-free-icons";

export const qrIcons = {
  qr: QrCodeIcon,
  "qr-code": QrCodeIcon,
  "qr-scan": BarcodeScanIcon,
  barcode: BarCode01Icon,
  scanner: BarcodeScanIcon,
  print: PrinterIcon,
} as const;

export type QrIconName = keyof typeof qrIcons;
