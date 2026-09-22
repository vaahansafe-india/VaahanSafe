import {
  QrCodeIcon,
  QrCodeScanIcon,
  BarCode01Icon,
  BarcodeScanIcon,
  PrinterIcon,
  Camera01Icon,
} from "@hugeicons/core-free-icons";

export const qrIcons = {
  qr: QrCodeIcon,
  "qr-code": QrCodeIcon,
  "qr-scan": QrCodeScanIcon,
  scan: QrCodeScanIcon,
  scanner: QrCodeScanIcon,
  camera: Camera01Icon,
  barcode: BarCode01Icon,
  "barcode-scan": BarcodeScanIcon,
  print: PrinterIcon,
} as const;

export type QrIconName = keyof typeof qrIcons;
