export type ScannerState =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "SCANNING"
  | "DETECTED"
  | "VALIDATING"
  | "RESOLVING"
  | "PERMISSION_DENIED"
  | "NO_CAMERA"
  | "UNSUPPORTED"
  | "INVALID_QR"
  | "ERROR";

export type CameraFacingMode = "environment" | "user";

export interface ScannerFeedback {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
}
