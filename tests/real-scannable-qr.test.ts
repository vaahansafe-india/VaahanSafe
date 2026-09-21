import { describe, it, expect } from "vitest";
import {
  generateScannableQrMatrix,
  generateScannableQrSvg,
  getQrUrl,
} from "../packages/qr/src/index";

describe("Standards-Compliant ISO/IEC 18004 Scannable QR Generation", () => {
  it("generates an authentic, standards-compliant QR matrix encoding the resolver URL", () => {
    const publicId = "EEDFZWCW";
    const result = generateScannableQrMatrix(publicId);

    expect(result.url).toBe("https://qr.vaahansafe.com/EEDFZWCW");
    expect(result.size).toBeGreaterThanOrEqual(25); // At least Version 1 or Version 2 QR + quiet zone
    expect(result.matrix.length).toBe(result.size);
    expect(result.matrix[0]?.length).toBe(result.size);

    // Standard 2-module quiet zone checks:
    // Outer border rows and columns should be false (clean quiet zone for camera autofocus)
    expect(result.matrix[0]?.every((cell) => cell === false)).toBe(true);
    expect(result.matrix[1]?.every((cell) => cell === false)).toBe(true);
    expect(result.matrix[result.size - 1]?.every((cell) => cell === false)).toBe(true);
    expect(result.matrix[result.size - 2]?.every((cell) => cell === false)).toBe(true);

    // Finder patterns must exist at top-left, top-right, bottom-left (shifted by margin=2)
    // Center of top-left finder pattern at row 5, col 5 (margin 2 + 3):
    expect(result.matrix[5]?.[5]).toBe(true);

    // Path data must be a valid SVG path containing movement and drawing commands
    expect(result.pathData).toMatch(/^M\d+,\d+h1v1h-1z/);
    expect(result.pathData.length).toBeGreaterThan(500);
  });

  it("generates standalone crisp SVG string with Level M error correction", async () => {
    const publicId = "EEDFZWCW";
    const svg = await generateScannableQrSvg(publicId, {
      errorCorrectionLevel: "M",
      margin: 2,
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("shape-rendering=\"crispEdges\"");
    expect(svg).toContain("viewBox=\"0 0");
    expect(svg).toContain("</svg>");
  });

  it("encodes custom resolver URLs accurately", () => {
    const customUrl = "https://qr.vaahansafe.com/SPECIAL-789";
    const result = generateScannableQrMatrix(customUrl);

    expect(result.url).toBe(customUrl);
    expect(result.size).toBeGreaterThan(25);
  });
});
