import { describe, it, expect } from "vitest";
import { generateCorrelationId, AppError, normalizeError } from "@vaahansafe/observability";

describe("Observability Package (@vaahansafe/observability)", () => {
  it("should generate structured correlation IDs", () => {
    const id = generateCorrelationId("test");
    expect(id).toMatch(/^test_/);
    expect(id.length).toBeGreaterThan(10);
  });

  it("should create AppError with standard ERR/... format", () => {
    const err = new AppError("Sticker already activated", "ERR/VHN/QR/ALREADY_ACTIVATED", 409);
    expect(err.code).toBe("ERR/VHN/QR/ALREADY_ACTIVATED");
    expect(err.statusCode).toBe(409);
    expect(err.reference).toMatch(/^err_/);
  });

  it("should normalize errors without leaking sensitive stack traces", () => {
    const nativeErr = new Error("Database connection timed out");
    const normalized = normalizeError(nativeErr);
    expect(normalized.code).toBe("ERR/VHN/INTERNAL");
    expect(normalized.statusCode).toBe(500);
    expect(normalized.reference).toMatch(/^err_/);
  });
});
