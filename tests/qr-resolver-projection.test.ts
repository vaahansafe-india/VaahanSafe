import { describe, it, expect } from "vitest";
import {
  mapInternalToPublicResolverState,
  getPublicResolverMeta,
  createPublicEmergencyProfile,
  assertSafePublicProjection,
  FORBIDDEN_PUBLIC_FIELDS,
  InternalEmergencyRecord,
} from "@vaahansafe/qr-core";

describe("QR Resolver State Mapping & Public Emergency Projection (@vaahansafe/qr-core)", () => {
  describe("Internal Lifecycle -> Public Resolver State Transformation", () => {
    it("should map ACTIVATED to ACTIVE", () => {
      expect(mapInternalToPublicResolverState("ACTIVATED")).toBe("ACTIVE");
      expect(mapInternalToPublicResolverState("ACTIVE")).toBe("ACTIVE");
    });

    it("should map all pre-activation operational states to safe ACTIVATION_AVAILABLE", () => {
      expect(mapInternalToPublicResolverState("PRINTED")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("IN_TRANSIT_DISTRIBUTOR")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("WITH_DISTRIBUTOR")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("WITH_RETAILER")).toBe("ACTIVATION_AVAILABLE");
      expect(mapInternalToPublicResolverState("SOLD")).toBe("ACTIVATION_AVAILABLE");
    });

    it("should map REPLACED to REPLACED", () => {
      expect(mapInternalToPublicResolverState("REPLACED")).toBe("REPLACED");
    });

    it("should map LOST_DAMAGED and EXPIRED_UNSOLD to LOST_DAMAGED", () => {
      expect(mapInternalToPublicResolverState("LOST_DAMAGED")).toBe("LOST_DAMAGED");
      expect(mapInternalToPublicResolverState("EXPIRED_UNSOLD")).toBe("LOST_DAMAGED");
    });

    it("should map security BLOCKED/SUSPENDED states to generic BLOCKED without leaking reason", () => {
      expect(mapInternalToPublicResolverState("BLOCKED")).toBe("BLOCKED");
      expect(mapInternalToPublicResolverState("SUSPENDED")).toBe("BLOCKED");
      expect(mapInternalToPublicResolverState("DISABLED")).toBe("BLOCKED");
    });

    it("should map unknown, empty, or unlisted states to UNKNOWN", () => {
      expect(mapInternalToPublicResolverState("UNKNOWN")).toBe("UNKNOWN");
      expect(mapInternalToPublicResolverState(null)).toBe("UNKNOWN");
      expect(mapInternalToPublicResolverState(undefined)).toBe("UNKNOWN");
      expect(mapInternalToPublicResolverState("RANDOM_CORRUPT_STATE")).toBe("UNKNOWN");
    });

    it("guarantees every public resolver state has a safe next action (INVARIANT 11)", () => {
      const states = [
        "ACTIVE",
        "ACTIVATION_AVAILABLE",
        "REPLACED",
        "LOST_DAMAGED",
        "BLOCKED",
        "UNKNOWN",
      ] as const;

      for (const state of states) {
        const meta = getPublicResolverMeta(state, {
          publicId: "7F3K9021",
          activateUrl: "https://activate.vaahansafe.com/7F3K9021",
          helpUrl: "https://vaahansafe.com/help",
        });

        expect(meta.title).toBeTruthy();
        expect(meta.badgeLabel).toBeTruthy();
        expect(meta.safeNextAction.label).toBeTruthy();
        expect(meta.safeNextAction.actionType).toBeTruthy();
      }
    });
  });

  describe("PublicEmergencyProfile Server-Side Projection Boundary (INVARIANT 04 & 05)", () => {
    const rawSensitiveRecord: InternalEmergencyRecord = {
      publicId: "7F3K9021",
      vehicle: {
        id: "veh_12345",
        customerId: "cust_99999",
        registrationNumber: "MH12AB1234",
        make: "Hyundai",
        model: "Creta SX",
        year: 2024,
        type: "CAR",
        primaryColor: "Polar White",
        insurancePolicyNumber: "PRIVATE_INSURANCE_SECRET_9876",
        insuranceExpiryDate: "2027-12-31",
        emergencyMessage: "Diabetic patient. Carry insulin in emergency.",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
      },
      customerProfile: {
        id: "prof_123",
        userId: "usr_999",
        displayName: "Rahul Sharma",
        alternatePhone: "+91 9111111111",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-06-01T00:00:00Z",
      },
      medicalProfile: {
        id: "med_123",
        vehicleId: "veh_12345",
        bloodGroup: "O+",
        allergies: ["Penicillin"],
        medicalConditions: ["Type 2 Diabetes"],
        organDonor: true,
        additionalNotes: "Emergency contact 1 is spouse.",
        updatedAt: "2025-06-01T00:00:00Z",
      },
      emergencyContacts: [
        {
          id: "ec_01",
          customerId: "cust_99999",
          name: "Pooja Sharma",
          relationship: "Spouse",
          phone: "+91 9876543210",
          alternatePhone: "+91 9876543211",
          isPriority: true,
          notifyOnScan: true,
          createdAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "ec_02",
          customerId: "cust_99999",
          name: "Dr. Arvind Mehta",
          relationship: "Physician",
          phone: "+91 9822012345",
          isPriority: false,
          notifyOnScan: true,
          createdAt: "2025-01-01T00:00:00Z",
        },
      ],
      // Dangerous private account fields that must NEVER reach the public resolver
      email: "rahul.private.secret@example.com",
      phone: "+91 9999999999",
      billingAddress: { street: "123 Private Road", city: "Pune" },
      orders: [{ orderId: "ord_1", amount: 149900 }],
      payments: [{ paymentId: "pay_1", status: "SUCCESS" }],
      session: { token: "secret_session_bearer_token_xyz" },
      authIdentity: { provider: "google", sub: "google_oauth_id_12345" },
      adminNotes: "Customer flagged for priority delivery. VIP support note.",
      insurancePolicyNumber: "PRIVATE_POLICY_NUMBER_9999",
      chassisNumber: "MA3EYD21S00123456",
      engineNumber: "G4FL123456",
    };

    it("should accurately project only authorized emergency safety fields", () => {
      const publicProfile = createPublicEmergencyProfile(rawSensitiveRecord);

      expect(publicProfile.qrPublicId).toBe("7F3K9021");
      expect(publicProfile.status).toBe("ACTIVE");
      expect(publicProfile.vehicleDisplay).toBe("Hyundai Creta SX • Polar White");
      expect(publicProfile.vehicleType).toBe("CAR");
      expect(publicProfile.approvedOwnerDisplayName).toBe("Rahul Sharma");
      expect(publicProfile.bloodGroup).toBe("O+");
      expect(publicProfile.approvedSafetyNotes).toBe(
        "Diabetic patient. Carry insulin in emergency."
      );
      expect(publicProfile.approvedEmergencyContacts).toHaveLength(2);
      expect(publicProfile.approvedEmergencyContacts[0].name).toBe("Pooja Sharma");
      expect(publicProfile.approvedEmergencyContacts[0].phone).toBe("+91 9876543210");
    });

    it("CRITICAL: must NEVER serialize forbidden account and security fields", () => {
      const publicProfile = createPublicEmergencyProfile(rawSensitiveRecord);
      const serialized = JSON.stringify(publicProfile);

      // Verify assertSafePublicProjection passes
      expect(() =>
        assertSafePublicProjection(publicProfile as unknown as Record<string, unknown>)
      ).not.toThrow();

      // Assert each forbidden field is completely absent from object keys
      for (const field of FORBIDDEN_PUBLIC_FIELDS) {
        expect(field in publicProfile).toBe(false);
        expect(serialized).not.toContain(`"${field}"`);
      }

      // Assert private email and tokens never leak into stringified payload
      expect(serialized).not.toContain("rahul.private.secret@example.com");
      expect(serialized).not.toContain("secret_session_bearer_token_xyz");
      expect(serialized).not.toContain("PRIVATE_INSURANCE_SECRET_9876");
      expect(serialized).not.toContain("MA3EYD21S00123456");
      expect(serialized).not.toContain("VIP support note");
    });

    it("should respect privacy preferences if owner opts out of displaying blood group or name", () => {
      const privateOptsRecord: InternalEmergencyRecord = {
        ...rawSensitiveRecord,
        privacyPreferences: {
          showBloodGroup: false,
          showOwnerName: false,
          showSafetyNotes: true,
        },
      };

      const publicProfile = createPublicEmergencyProfile(privateOptsRecord);

      expect(publicProfile.approvedOwnerDisplayName).toBeUndefined();
      expect(publicProfile.bloodGroup).toBeUndefined();
      expect(publicProfile.approvedSafetyNotes).toBe(
        "Diabetic patient. Carry insulin in emergency."
      );
    });

    it("assertSafePublicProjection throws error if a forbidden key is injected", () => {
      const leakyObject = {
        qrPublicId: "7F3K9021",
        status: "ACTIVE",
        email: "leaked.email@example.com",
      };

      expect(() => assertSafePublicProjection(leakyObject)).toThrow(
        /Forbidden field "email"/
      );
    });
  });
});
