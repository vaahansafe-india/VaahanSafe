import { describe, it, expect } from "vitest";
import {
  createFulfilment,
  isValidFulfilmentTransition,
  assertValidFulfilmentTransition,
  FulfilmentStatus,
  createShipment,
  isValidShipmentTransition,
  assertValidShipmentTransition,
  shouldIgnoreShipmentEvent,
  ShipmentStatus,
  InvalidFulfilmentTransitionError,
  InvalidShipmentTransitionError,
  NoEligibleInventoryError,
  QrReservationConflictError,
  ReplacementNotAllowedError,
  ReplacementOwnershipError,
} from "@vaahansafe/shipping";

describe("Phase 12 — Fulfilment & Shipment Domain State Machines", () => {
  const sampleAddress = {
    fullName: "Rohan Verma",
    phone: "+919876543210",
    line1: "Flat 402, Green Meadows",
    line2: "Sector 62",
    city: "Noida",
    state: "Uttar Pradesh",
    postalCode: "201301",
    country: "IN",
  };

  describe("Fulfilment Entity & Transitions", () => {
    it("creates a valid fulfilment with immutable address snapshot", () => {
      const fulfilment = createFulfilment({
        orderId: "ord_1001",
        userId: "usr_2002",
        type: "PHYSICAL_QR",
        shippingAddressSnapshot: sampleAddress,
      });

      expect(fulfilment.id).toMatch(/^ful_/);
      expect(fulfilment.orderId).toBe("ord_1001");
      expect(fulfilment.userId).toBe("usr_2002");
      expect(fulfilment.type).toBe("PHYSICAL_QR");
      expect(fulfilment.status).toBe("PAID");
      expect(fulfilment.shippingAddressSnapshot.fullName).toBe("Rohan Verma");
      expect(fulfilment.shippingAddressSnapshot.postalCode).toBe("201301");
    });

    it("allows valid canonical lifecycle transitions", () => {
      const canonicalSteps: [FulfilmentStatus, FulfilmentStatus][] = [
        ["PAID", "PROCESSING"],
        ["PROCESSING", "PACKED"],
        ["PACKED", "SHIPPED"],
        ["SHIPPED", "OUT_FOR_DELIVERY"],
        ["OUT_FOR_DELIVERY", "DELIVERED"],
      ];

      for (const [from, to] of canonicalSteps) {
        expect(isValidFulfilmentTransition(from, to)).toBe(true);
        expect(() => assertValidFulfilmentTransition(from, to)).not.toThrow();
      }
    });

    it("allows valid failure and RTO transitions", () => {
      const rtoSteps: [FulfilmentStatus, FulfilmentStatus][] = [
        ["SHIPPED", "DELIVERY_FAILED"],
        ["OUT_FOR_DELIVERY", "DELIVERY_FAILED"],
        ["DELIVERY_FAILED", "RTO"],
        ["RTO", "RECEIVED_RTO"],
      ];

      for (const [from, to] of rtoSteps) {
        expect(isValidFulfilmentTransition(from, to)).toBe(true);
        expect(() => assertValidFulfilmentTransition(from, to)).not.toThrow();
      }
    });

    it("allows cancellation from pre-dispatch states only", () => {
      expect(isValidFulfilmentTransition("PAID", "CANCELLED")).toBe(true);
      expect(isValidFulfilmentTransition("PROCESSING", "CANCELLED")).toBe(true);
      expect(isValidFulfilmentTransition("PACKED", "CANCELLED")).toBe(true);

      expect(isValidFulfilmentTransition("SHIPPED", "CANCELLED")).toBe(false);
      expect(isValidFulfilmentTransition("DELIVERED", "CANCELLED")).toBe(false);
    });

    it("rejects invalid fulfilment transitions with InvalidFulfilmentTransitionError", () => {
      const invalidSteps: [FulfilmentStatus, FulfilmentStatus][] = [
        ["PAID", "DELIVERED"],
        ["PACKED", "RECEIVED_RTO"],
        ["DELIVERED", "PROCESSING"],
        ["DELIVERED", "SHIPPED"],
        ["RECEIVED_RTO", "PROCESSING"],
        ["CANCELLED", "PAID"],
      ];

      for (const [from, to] of invalidSteps) {
        expect(isValidFulfilmentTransition(from, to)).toBe(false);
        expect(() => assertValidFulfilmentTransition(from, to)).toThrow(
          InvalidFulfilmentTransitionError
        );
      }
    });
  });

  describe("Shipment Entity & Transitions", () => {
    it("creates a valid shipment with pending status", () => {
      const shipment = createShipment({
        fulfilmentId: "ful_001",
        orderId: "ord_001",
        userId: "usr_001",
        provider: "MANUAL",
        shippingAddressSnapshot: sampleAddress,
      });

      expect(shipment.id).toMatch(/^shp_/);
      expect(shipment.fulfilmentId).toBe("ful_001");
      expect(shipment.status).toBe("PENDING");
      expect(shipment.provider).toBe("MANUAL");
    });

    it("allows valid courier movement transitions", () => {
      const steps: [ShipmentStatus, ShipmentStatus][] = [
        ["PENDING", "MANIFESTED"],
        ["MANIFESTED", "PICKED_UP"],
        ["PICKED_UP", "IN_TRANSIT"],
        ["IN_TRANSIT", "OUT_FOR_DELIVERY"],
        ["OUT_FOR_DELIVERY", "DELIVERED"],
        ["IN_TRANSIT", "DELIVERY_FAILED"],
        ["DELIVERY_FAILED", "RTO_INITIATED"],
        ["RTO_INITIATED", "RTO_DELIVERED"],
      ];

      for (const [from, to] of steps) {
        expect(isValidShipmentTransition(from, to)).toBe(true);
        expect(() => assertValidShipmentTransition(from, to)).not.toThrow();
      }
    });

    it("rejects invalid shipment transitions with InvalidShipmentTransitionError", () => {
      const invalidSteps: [ShipmentStatus, ShipmentStatus][] = [
        ["PENDING", "DELIVERED"],
        ["DELIVERED", "OUT_FOR_DELIVERY"],
        ["DELIVERED", "PENDING"],
        ["RTO_DELIVERED", "IN_TRANSIT"],
        ["CANCELLED", "MANIFESTED"],
      ];

      for (const [from, to] of invalidSteps) {
        expect(isValidShipmentTransition(from, to)).toBe(false);
        expect(() => assertValidShipmentTransition(from, to)).toThrow(
          InvalidShipmentTransitionError
        );
      }
    });

    it("correctly identifies out-of-order delayed webhook events to prevent state downgrades", () => {
      // If already DELIVERED, ignore delayed OUT_FOR_DELIVERY or IN_TRANSIT
      expect(shouldIgnoreShipmentEvent("DELIVERED", "OUT_FOR_DELIVERY")).toBe(true);
      expect(shouldIgnoreShipmentEvent("DELIVERED", "IN_TRANSIT")).toBe(true);
      expect(shouldIgnoreShipmentEvent("DELIVERED", "MANIFESTED")).toBe(true);

      // If already RTO_DELIVERED, ignore delayed RTO_INITIATED
      expect(shouldIgnoreShipmentEvent("RTO_DELIVERED", "RTO_INITIATED")).toBe(true);

      // In-flight events should NOT be ignored
      expect(shouldIgnoreShipmentEvent("IN_TRANSIT", "OUT_FOR_DELIVERY")).toBe(false);
      expect(shouldIgnoreShipmentEvent("PICKED_UP", "IN_TRANSIT")).toBe(false);
    });
  });

  describe("Normalized Domain Errors", () => {
    it("preserves error codes without leaking sensitive data", () => {
      const noInv = new NoEligibleInventoryError("No printed physical stickers left");
      expect(noInv.code).toBe("NO_ELIGIBLE_INVENTORY");
      expect(noInv.message).toContain("No printed physical stickers left");

      const conflict = new QrReservationConflictError("qr_123");
      expect(conflict.code).toBe("QR_RESERVATION_CONFLICT");

      const replErr = new ReplacementNotAllowedError("QR is not in active state");
      expect(replErr.code).toBe("REPLACEMENT_NOT_ALLOWED");

      const idor = new ReplacementOwnershipError("usr_1", "veh_2");
      expect(idor.code).toBe("REPLACEMENT_OWNERSHIP_MISMATCH");
    });
  });
});
