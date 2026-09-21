import { describe, it, expect } from "vitest";
import { createVehicle } from "../packages/vehicles/src/domain/vehicle";
import {
  createEmergencyProfile,
  DEFAULT_PRIVACY_SETTINGS,
} from "../packages/vehicles/src/emergency/emergency-profile";
import {
  createEmergencyContact,
  getPrioritizedContacts,
} from "../packages/vehicles/src/emergency/emergency-contact";
import {
  sanitizeMedicalNotes,
  MEDICAL_DISCLAIMER,
} from "../packages/vehicles/src/emergency/medical-information";
import {
  buildPublicEmergencyProfile,
  assertSafePublicProjection,
  BuildPublicProjectionInput,
} from "../packages/vehicles/src/privacy/public-projection";
import {
  NEVER_PUBLIC_FIELDS,
} from "../packages/vehicles/src/privacy/public-fields";
import {
  isEmergencyProfileReady,
} from "../packages/vehicles/src/emergency/readiness";
import {
  ForbiddenFieldLeakageError,
} from "../packages/vehicles/src/errors/vehicle-errors";

describe("Phase 09 — Emergency Profile & Public Safety Projection Boundary", () => {
  const sampleVehicle = createVehicle({
    userId: "usr_alice",
    registrationNumber: "AP 39 AB 1234",
    make: "Hyundai",
    model: "Creta",
    variant: "SX(O)",
    color: "Polar White",
    year: 2024,
    vehicleType: "CAR",
    photoAssetId: "ast_private_media_001",
  });

  const sampleContacts = [
    createEmergencyContact({
      emergencyProfileId: "emg_test01",
      name: "Ramesh Sharma",
      relationshipLabel: "Spouse",
      phone: "+91 98765 43210",
      priority: 1,
      isEnabled: true,
      allowCall: true,
      allowMessage: true,
    }),
    createEmergencyContact({
      emergencyProfileId: "emg_test01",
      name: "Dr. Arvind Mehta",
      relationshipLabel: "Family Physician",
      phone: "+91 98220 12345",
      priority: 2,
      isEnabled: true,
      allowCall: true,
      allowMessage: false,
    }),
    createEmergencyContact({
      emergencyProfileId: "emg_test01",
      name: "Ex-Emergency Contact",
      relationshipLabel: "Acquaintance",
      phone: "+91 98000 00000",
      priority: 3,
      isEnabled: false, // DISABLED
      allowCall: false,
      allowMessage: false,
    }),
  ];

  describe("Privacy-by-Default Guarantees (Sections 26, 27, 28, 29)", () => {
    it("new emergency profile has strict privacy defaults", () => {
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        displayName: "Alice Sharma",
        bloodGroup: "O+",
        medicalNotes: "Severe penicillin allergy",
      });

      expect(profile.privacy.showOwnerName).toBe(false);
      expect(profile.privacy.showBloodGroup).toBe(false);
      expect(profile.privacy.showMedicalNotes).toBe(false);
      expect(profile.privacy.showVehicleDetails).toBe(true);
      expect(profile.privacy.maskRegistration).toBe(true);
      expect(DEFAULT_PRIVACY_SETTINGS.showOwnerName).toBe(false);
    });

    it("public projection built from default profile hides owner name, blood group, and medical notes", () => {
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        displayName: "Alice Sharma",
        bloodGroup: "O+",
        medicalNotes: "Severe penicillin allergy",
      });

      const publicDto = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: profile,
        contacts: sampleContacts,
        rawOwnerDisplayName: "Alice Legal Full Name",
      });

      // Default assertions
      expect(publicDto.ownerDisplayName).toBeUndefined();
      expect(publicDto.approvedOwnerDisplayName).toBeUndefined();
      expect(publicDto.emergency.bloodGroup).toBeUndefined();
      expect(publicDto.bloodGroup).toBeUndefined();
      expect(publicDto.emergency.medicalNotes).toBeUndefined();
      expect(publicDto.approvedSafetyNotes).toBeUndefined();

      // Registration is masked by default
      expect(publicDto.vehicle.displayIdentifier).toBe("AP •• •• 1234");
      expect(publicDto.vehicle.photoAssetId).toBeUndefined(); // Photo private by default
    });
  });

  describe("Hard Denylist & Zero Leakage of Forbidden Fields (Sections 25, 31, 32)", () => {
    it("CRITICAL: never serializes forbidden account, billing, auth, or tracking fields", () => {
      // Create a heavily polluted raw record simulating dangerous account details
      const rawPollutedAccountRecord = {
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: createEmergencyProfile({
          vehicleId: sampleVehicle.id,
        }),
        contacts: sampleContacts,
        // DANGEROUS FORBIDDEN DATA:
        email: "alice.super.secret@example.com",
        phone: "+91 9999999999",
        address: "Flat 402, Private Towers, Mumbai",
        billingAddress: { street: "101 Secret Lane", city: "Mumbai" },
        shippingAddress: { street: "101 Secret Lane", pincode: "400001" },
        authIdentity: { googleSub: "google_oauth_secret_sub_123" },
        googleIdentity: "google_account_id_999",
        session: { token: "secret_jwt_bearer_token_xyz" },
        otp: "123456",
        accountSettings: { autoRenew: true },
        orders: [{ id: "ord_1001", amount: 149900 }],
        payments: [{ id: "pay_2002", razorpayId: "pay_secret_razorpay" }],
        refunds: [],
        supportTickets: [{ id: "tkt_3003", privateNotes: "Sensitive ticket" }],
        adminNotes: "Customer marked for high-risk monitoring",
        privateR2Key: "vehicles/private/raw_chassis_doc.pdf",
        userId: "usr_alice",
        customerId: "cust_alice",
        chassisNumber: "MA3EYD21S00123456",
        engineNumber: "G4FL123456",
        insurancePolicyNumber: "INS-SECRET-POLICY-99999",
        insuranceExpiryDate: "2027-12-31",
      };

      const publicDto = buildPublicEmergencyProfile(rawPollutedAccountRecord as unknown as BuildPublicProjectionInput);
      const jsonPayload = JSON.stringify(publicDto);

      // Verify that NO key from NEVER_PUBLIC_FIELDS is present at root of publicDto
      for (const field of NEVER_PUBLIC_FIELDS) {
        expect(field in publicDto).toBe(false);
        // Contact objects have emergency contact phone; all other forbidden field keys must never appear in jsonPayload
        if (field !== "phone") {
          expect(jsonPayload).not.toContain(`"${field}"`);
        }
      }

      // Assert private account phone, emails, and tokens never leak into stringified payload
      expect(jsonPayload).not.toContain("+91 9999999999"); // Account phone NEVER leaks

      // Assert private strings are completely absent from payload
      expect(jsonPayload).not.toContain("alice.super.secret@example.com");
      expect(jsonPayload).not.toContain("Private Towers");
      expect(jsonPayload).not.toContain("secret_jwt_bearer_token_xyz");
      expect(jsonPayload).not.toContain("google_oauth_secret_sub_123");
      expect(jsonPayload).not.toContain("INS-SECRET-POLICY-99999");
      expect(jsonPayload).not.toContain("MA3EYD21S00123456");
      expect(jsonPayload).not.toContain("Customer marked for high-risk monitoring");
    });

    it("FUTURE PRIVATE FIELD TEST: newly introduced internal fields cannot leak via projection", () => {
      const pollutedWithFutureField = {
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: createEmergencyProfile({
          vehicleId: sampleVehicle.id,
        }),
        contacts: sampleContacts,
        // Hypothetical future internal field added in Phase 12
        newFutureUnreleasedInternalSecret: "internal_ai_model_telemetry_vector_007",
      };

      const publicDto = buildPublicEmergencyProfile(pollutedWithFutureField as unknown as BuildPublicProjectionInput);
      const jsonPayload = JSON.stringify(publicDto);

      expect("newFutureUnreleasedInternalSecret" in publicDto).toBe(false);
      expect(jsonPayload).not.toContain("internal_ai_model_telemetry_vector_007");
    });

    it("assertSafePublicProjection detects and throws if a forbidden key is injected", () => {
      const leakyObject = {
        qrPublicId: "7F3K9021",
        status: "ACTIVE",
        email: "leaked_address@example.com",
      };

      expect(() =>
        assertSafePublicProjection(leakyObject as Record<string, unknown>)
      ).toThrow(ForbiddenFieldLeakageError);
    });
  });

  describe("Sensitive Opt-In / Opt-Out Lifecycles (Sections 27, 28, 29)", () => {
    it("blood group: hidden by default -> opt-in shows it -> opt-out immediately removes it", () => {
      // 1. Default (Hidden)
      const profileHidden = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        bloodGroup: "B+",
        privacy: { showBloodGroup: false },
      });
      const dto1 = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: profileHidden,
        contacts: sampleContacts,
      });
      expect(dto1.emergency.bloodGroup).toBeUndefined();

      // 2. Opt-In Enabled
      const profileEnabled = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        bloodGroup: "B+",
        privacy: { showBloodGroup: true },
      });
      const dto2 = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: profileEnabled,
        contacts: sampleContacts,
      });
      expect(dto2.emergency.bloodGroup).toBe("B+");
      expect(dto2.bloodGroup).toBe("B+");

      // 3. Opt-Out Disabled again
      const profileDisabledAgain = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        bloodGroup: "B+",
        privacy: { showBloodGroup: false },
      });
      const dto3 = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: profileDisabledAgain,
        contacts: sampleContacts,
      });
      expect(dto3.emergency.bloodGroup).toBeUndefined();
    });

    it("medical notes: sanitized, opt-in controlled, and never executes scripts (XSS Defense)", () => {
      const rawMaliciousNotes = "<script>alert('pwned')</script>Asthmatic patient. <b>Inhaler</b> in glovebox.";
      const sanitized = sanitizeMedicalNotes(rawMaliciousNotes);

      // Verify HTML tags stripped
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("<b>");
      expect(sanitized).toContain("Asthmatic patient. Inhaler in glovebox.");

      // Test Opt-In Projection
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        medicalNotes: rawMaliciousNotes,
        privacy: { showMedicalNotes: true },
      });

      const dto = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: profile,
        contacts: sampleContacts,
      });

      expect(dto.emergency.medicalNotes).toBe("alert('pwned')Asthmatic patient. Inhaler in glovebox.");
      expect(dto.safety.disclaimer).toBe(MEDICAL_DISCLAIMER);
    });

    it("owner name: opt-in controlled", () => {
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
        displayName: "Alice S.",
        privacy: { showOwnerName: true },
      });

      const dto = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        emergencyProfile: profile,
        contacts: sampleContacts,
      });

      expect(dto.ownerDisplayName).toBe("Alice S.");
    });
  });

  describe("Controlled Emergency Contact Projection (Sections 19, 20, 23)", () => {
    it("projects only enabled contacts, sorted by priority (1 before 2), excluding disabled", () => {
      const dto = buildPublicEmergencyProfile({
        qrPublicId: "7F3K9021",
        vehicle: sampleVehicle,
        contacts: sampleContacts,
      });

      expect(dto.emergency.contacts).toHaveLength(2); // Contact 3 was disabled
      expect(dto.emergency.contacts[0].name).toBe("Ramesh Sharma");
      expect(dto.emergency.contacts[0].relationship).toBe("Spouse");
      expect(dto.emergency.contacts[0].isPriority).toBe(true);
      expect(dto.emergency.contacts[0].allowCall).toBe(true);

      expect(dto.emergency.contacts[1].name).toBe("Dr. Arvind Mehta");
      expect(dto.emergency.contacts[1].isPriority).toBe(false);

      // Verify disabled contact is completely absent
      expect(dto.emergency.contacts.some((c) => c.name === "Ex-Emergency Contact")).toBe(false);
    });

    it("caps public contact actions at maximum 3 for low bandwidth & rapid emergency response", () => {
      const manyContacts = [
        ...sampleContacts,
        createEmergencyContact({
          emergencyProfileId: "emg_test01",
          name: "Contact 4",
          relationshipLabel: "Sibling",
          phone: "+91 91111 22222",
          priority: 4,
          isEnabled: true,
        }),
        createEmergencyContact({
          emergencyProfileId: "emg_test01",
          name: "Contact 5",
          relationshipLabel: "Neighbor",
          phone: "+91 93333 44444",
          priority: 5,
          isEnabled: true,
        }),
      ];

      const prioritized = getPrioritizedContacts(manyContacts, 3);
      expect(prioritized).toHaveLength(3);
      expect(prioritized.map((c) => c.priority)).toEqual([1, 2, 4]); // 3 was disabled
    });
  });

  describe("Emergency Profile Readiness Policy (Sections 75 & 76)", () => {
    it("evaluates readiness: active vehicle + active profile + enabled contact => READY", () => {
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
      });

      const readiness = isEmergencyProfileReady({
        vehicle: sampleVehicle,
        emergencyProfile: profile,
        contacts: sampleContacts,
      });

      expect(readiness.ready).toBe(true);
      expect(readiness.reasons).toHaveLength(0);
    });

    it("evaluates readiness: missing contacts => NOT READY with specific reason", () => {
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
      });

      const readiness = isEmergencyProfileReady({
        vehicle: sampleVehicle,
        emergencyProfile: profile,
        contacts: [], // No contacts
      });

      expect(readiness.ready).toBe(false);
      expect(readiness.reasons).toContain("At least one enabled emergency contact is required");
    });

    it("evaluates readiness: archived vehicle => NOT READY", () => {
      const archivedVehicle = {
        ...sampleVehicle,
        status: "ARCHIVED" as const,
      };
      const profile = createEmergencyProfile({
        vehicleId: sampleVehicle.id,
      });

      const readiness = isEmergencyProfileReady({
        vehicle: archivedVehicle,
        emergencyProfile: profile,
        contacts: sampleContacts,
      });

      expect(readiness.ready).toBe(false);
      expect(readiness.reasons[0]).toContain("Vehicle is not active");
    });
  });
});
