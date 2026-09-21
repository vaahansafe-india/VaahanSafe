import { describe, it, expect } from "vitest";
import {
  generateVehicleId,
  isValidVehicleId,
  createVehicle,
  Vehicle,
} from "../packages/vehicles/src/domain/vehicle";
import {
  normalizeRegistrationNumber,
  formatRegistrationDisplay,
  isValidRegistrationFormat,
} from "../packages/vehicles/src/domain/registration";
import {
  maskVehicleRegistration,
} from "../packages/vehicles/src/privacy/registration-mask";
import {
  normalizeVehicleType,
  getVehicleTypeLabel,
  isVehicleType,
} from "../packages/vehicles/src/domain/vehicle-type";
import {
  canTransitionVehicleStatus,
  isVehicleActive,
  toDbVehicleStatus,
} from "../packages/vehicles/src/domain/vehicle-status";
import {
  assertVehicleOwnership,
  isVehicleOwner,
} from "../packages/vehicles/src/domain/ownership";
import {
  UnauthorizedVehicleAccessError,
  InvalidRegistrationError,
} from "../packages/vehicles/src/errors/vehicle-errors";

describe("Phase 09 — Vehicle Domain Architecture (@vaahansafe/vehicles)", () => {
  describe("Opaque Vehicle Identifier (Section 06)", () => {
    it("generates opaque vehicle IDs with veh_ prefix and high entropy", () => {
      const id1 = generateVehicleId();
      const id2 = generateVehicleId();

      expect(id1).toMatch(/^veh_[a-zA-Z0-9]{16}$/);
      expect(id2).toMatch(/^veh_[a-zA-Z0-9]{16}$/);
      expect(id1).not.toBe(id2);
    });

    it("validates valid and invalid vehicle IDs", () => {
      expect(isValidVehicleId("veh_abc1234567890123")).toBe(true);
      expect(isValidVehicleId("veh_7F3K9021_alpha")).toBe(true);
      expect(isValidVehicleId("MH12AB1234")).toBe(false); // Registration is NOT technical ID
      expect(isValidVehicleId("user_12345")).toBe(false);
      expect(isValidVehicleId("")).toBe(false);
    });
  });

  describe("Registration Normalization & Display (Sections 07 & 08)", () => {
    it("centralized normalization strips whitespace, hyphens, and converts to uppercase", () => {
      expect(normalizeRegistrationNumber("ap 39 ab 1234")).toBe("AP39AB1234");
      expect(normalizeRegistrationNumber("dl-01-ca-1234")).toBe("DL01CA1234");
      expect(normalizeRegistrationNumber("mh.12.ab.1234")).toBe("MH12AB1234");
      expect(normalizeRegistrationNumber("22 bh 1234 aa")).toBe("22BH1234AA");
      expect(normalizeRegistrationNumber("  ka 05 mj 9999  ")).toBe("KA05MJ9999");
    });

    it("formats normalized registrations into clean human-readable display spacing", () => {
      expect(formatRegistrationDisplay("AP39AB1234")).toBe("AP 39 AB 1234");
      expect(formatRegistrationDisplay("DL01CA1234")).toBe("DL 01 CA 1234");
      expect(formatRegistrationDisplay("22BH1234AA")).toBe("22 BH 1234 AA");
      expect(formatRegistrationDisplay("MH121234")).toBe("MH 12 1234");
    });

    it("validates standard Indian state plate and Bharat (BH) formats", () => {
      expect(isValidRegistrationFormat("AP 39 AB 1234")).toBe(true);
      expect(isValidRegistrationFormat("DL-1-C-1234")).toBe(true);
      expect(isValidRegistrationFormat("22 BH 1234 AA")).toBe(true);
      expect(isValidRegistrationFormat("INVALID_PLATE")).toBe(false);
      expect(isValidRegistrationFormat("12345")).toBe(false);
    });
  });

  describe("Configurable Registration Masking Policy (Section 09)", () => {
    it("defaults to PARTIAL masking: AP •• •• 1234", () => {
      const masked = maskVehicleRegistration("AP39AB1234");
      expect(masked).toBe("AP •• •• 1234");
    });

    it("masks Bharat series registrations accurately: 22 BH •• AA", () => {
      const masked = maskVehicleRegistration("22BH1234AA");
      expect(masked).toBe("22 BH •• AA");
    });

    it("supports FULL_MASK policy when strict anonymity is required", () => {
      const fullMask = maskVehicleRegistration("AP39AB1234", { mode: "FULL_MASK" });
      expect(fullMask).toBe("••••••••••");
    });

    it("supports UNMASKED policy only when explicitly permitted", () => {
      const unmasked = maskVehicleRegistration("AP39AB1234", { mode: "UNMASKED" });
      expect(unmasked).toBe("AP 39 AB 1234");
    });

    it("supports HIDDEN policy returning generic safe text", () => {
      const hidden = maskVehicleRegistration("AP39AB1234", { mode: "HIDDEN" });
      expect(hidden).toBe("Registered Vehicle");
    });
  });

  describe("Vehicle Types & Status Lifecycle (Sections 05 & 10)", () => {
    it("normalizes and validates vehicle types", () => {
      expect(isVehicleType("CAR")).toBe(true);
      expect(isVehicleType("MOTORCYCLE")).toBe(true);
      expect(isVehicleType("SCOOTER")).toBe(true);
      expect(isVehicleType("AUTO")).toBe(true);
      expect(normalizeVehicleType("auto_rickshaw")).toBe("AUTO");
      expect(normalizeVehicleType("TRUCK")).toBe("COMMERCIAL");
      expect(normalizeVehicleType("UNKNOWN_CART")).toBe("OTHER");
      expect(getVehicleTypeLabel("CAR")).toBe("Car / SUV");
    });

    it("enforces valid vehicle lifecycle transitions", () => {
      expect(canTransitionVehicleStatus("ACTIVE", "ARCHIVED")).toBe(true);
      expect(canTransitionVehicleStatus("ACTIVE", "TRANSFER_PENDING")).toBe(true);
      expect(canTransitionVehicleStatus("ACTIVE", "INACTIVE")).toBe(true);
      expect(canTransitionVehicleStatus("TRANSFER_PENDING", "ACTIVE")).toBe(true);
      expect(canTransitionVehicleStatus("TRANSFER_PENDING", "TRANSFERRED")).toBe(true);
      expect(canTransitionVehicleStatus("ARCHIVED", "ACTIVE")).toBe(true);
      // Illegal transitions
      expect(canTransitionVehicleStatus("TRANSFERRED", "ACTIVE")).toBe(false);
      expect(canTransitionVehicleStatus("DELETED", "ACTIVE")).toBe(false);
    });

    it("accurately evaluates active status and maps to D1 database types", () => {
      expect(isVehicleActive("ACTIVE")).toBe(true);
      expect(isVehicleActive("ARCHIVED")).toBe(false);
      expect(isVehicleActive("INACTIVE")).toBe(false);
      expect(toDbVehicleStatus("ACTIVE")).toBe("ACTIVE");
      expect(toDbVehicleStatus("ARCHIVED")).toBe("INACTIVE");
      expect(toDbVehicleStatus("TRANSFERRED")).toBe("TRANSFERRED");
    });
  });

  describe("Vehicle Domain Entity Factory & Server-Side Ownership (Sections 11 & 12)", () => {
    const validVehicleParams = {
      userId: "usr_alice123",
      registrationNumber: "mh 12 ab 1234",
      make: "Tata",
      model: "Nexon EV",
      color: "Daytona Grey",
      year: 2024,
      vehicleType: "CAR",
    };

    it("creates a canonical vehicle preserving normalized and display registrations", () => {
      const vehicle = createVehicle(validVehicleParams);

      expect(vehicle.id).toMatch(/^veh_/);
      expect(vehicle.userId).toBe("usr_alice123");
      expect(vehicle.registrationNumberNormalized).toBe("MH12AB1234");
      expect(vehicle.registrationNumberDisplay).toBe("MH 12 AB 1234");
      expect(vehicle.make).toBe("Tata");
      expect(vehicle.model).toBe("Nexon EV");
      expect(vehicle.status).toBe("ACTIVE");
    });

    it("rejects invalid registration formats at domain boundary", () => {
      expect(() =>
        createVehicle({
          ...validVehicleParams,
          registrationNumber: "NOT_A_VALID_PLATE",
        })
      ).toThrow(InvalidRegistrationError);
    });

    it("authoritative ownership check succeeds for rightful owner", () => {
      const vehicle = createVehicle(validVehicleParams);

      expect(isVehicleOwner(vehicle, "usr_alice123")).toBe(true);
      expect(() => assertVehicleOwnership(vehicle, "usr_alice123")).not.toThrow();
    });

    it("authoritative ownership check strictly REJECTS IDOR attacks", () => {
      const vehicle = createVehicle(validVehicleParams);

      expect(isVehicleOwner(vehicle, "usr_attacker999")).toBe(false);
      expect(() => assertVehicleOwnership(vehicle, "usr_attacker999")).toThrow(
        UnauthorizedVehicleAccessError
      );
      expect(() => assertVehicleOwnership(vehicle, "")).toThrow(
        UnauthorizedVehicleAccessError
      );
    });
  });
});
