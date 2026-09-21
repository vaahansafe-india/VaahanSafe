import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("VaahanSafe Camera Scanner Architecture & Invariants", () => {
  const qrAppDir = path.resolve(__dirname, "../apps/qr");
  const scannerDir = path.join(qrAppDir, "components/scanner");
  const landingDir = path.join(qrAppDir, "components/landing");
  const resolverPagePath = path.join(qrAppDir, "app/[publicId]/page.tsx");

  // --------------------------------------------------------------------------
  // 1. Strict Bundle & Route Isolation (Rule 01, 66, 68)
  // --------------------------------------------------------------------------
  describe("Route & Bundle Isolation", () => {
    it("CRITICAL: /{publicId} resolver route must never import camera scanner modules or jsqr", () => {
      const resolverContent = fs.readFileSync(resolverPagePath, "utf8");

      expect(resolverContent).not.toContain("components/scanner");
      expect(resolverContent).not.toContain("VaahanScannerModal");
      expect(resolverContent).not.toContain("useCameraScanner");
      expect(resolverContent).not.toContain("CameraViewfinder");
      expect(resolverContent).not.toContain("jsqr");
      expect(resolverContent).not.toContain("BarcodeDetector");
    });

    it("Landing experience dynamically imports the camera scanner modal on demand", () => {
      const landingExperience = fs.readFileSync(
        path.join(landingDir, "LandingExperience.tsx"),
        "utf8"
      );

      expect(landingExperience).toContain("dynamic(");
      expect(landingExperience).toContain('import("../scanner/VaahanScannerModal")');
      expect(landingExperience).toContain("ssr: false");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Deterministic State Machine & Camera Lifecycle (Rule 04, 19, 21, 22)
  // --------------------------------------------------------------------------
  describe("State Machine & Media Track Lifecycle", () => {
    it("defines the canonical 11-state scanner state machine", () => {
      const typesContent = fs.readFileSync(path.join(scannerDir, "types.ts"), "utf8");

      expect(typesContent).toContain('"IDLE"');
      expect(typesContent).toContain('"REQUESTING_PERMISSION"');
      expect(typesContent).toContain('"SCANNING"');
      expect(typesContent).toContain('"DETECTED"');
      expect(typesContent).toContain('"VALIDATING"');
      expect(typesContent).toContain('"RESOLVING"');
      expect(typesContent).toContain('"PERMISSION_DENIED"');
      expect(typesContent).toContain('"NO_CAMERA"');
      expect(typesContent).toContain('"UNSUPPORTED"');
      expect(typesContent).toContain('"INVALID_QR"');
      expect(typesContent).toContain('"ERROR"');
    });

    it("enforces media track cleanup on close, unmount, and page visibility changes", () => {
      const hookContent = fs.readFileSync(
        path.join(scannerDir, "useCameraScanner.ts"),
        "utf8"
      );

      // Track cleanup
      expect(hookContent).toContain("track.stop()");
      // Visibility listener
      expect(hookContent).toContain("visibilitychange");
      expect(hookContent).toContain('document.visibilityState === "hidden"');
      // Single detection lock
      expect(hookContent).toContain("isLocked.current");
    });

    it("feature-detects BarcodeDetector before attempting native detection", () => {
      const hookContent = fs.readFileSync(
        path.join(scannerDir, "useCameraScanner.ts"),
        "utf8"
      );

      expect(hookContent).toContain('"BarcodeDetector" in window');
      expect(hookContent).toContain('import("jsqr")');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Accessibility & Privacy Labels (Rule 32, 63, 64)
  // --------------------------------------------------------------------------
  describe("Accessibility & Reassurance Chrome", () => {
    it("Scanner modal implements proper dialog and aria-modal attributes", () => {
      const modalContent = fs.readFileSync(
        path.join(scannerDir, "VaahanScannerModal.tsx"),
        "utf8"
      );

      expect(modalContent).toContain('role="dialog"');
      expect(modalContent).toContain('aria-modal="true"');
      expect(modalContent).toContain("QR decoding runs on device");
    });

    it("ScannerStateOverlay uses polite aria-live announcements", () => {
      const overlayContent = fs.readFileSync(
        path.join(scannerDir, "ScannerStateOverlay.tsx"),
        "utf8"
      );

      expect(overlayContent).toContain('aria-live="polite"');
      expect(overlayContent).toContain("QR Not Recognized");
      expect(overlayContent).toContain("Camera Access Required");
    });

    it("ManualIdFallback uses zero-trust payload validation before navigating", () => {
      const fallbackContent = fs.readFileSync(
        path.join(scannerDir, "ManualIdFallback.tsx"),
        "utf8"
      );

      expect(fallbackContent).toContain("parseVaahanSafeQrPayload");
      expect(fallbackContent).toContain("result.valid");
      expect(fallbackContent).toContain("router.push");
    });
  });
});
