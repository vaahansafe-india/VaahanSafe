import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the authoritative database client factory
vi.mock("@vaahansafe/database", () => {
  const mockDb = {
    query: vi.fn(),
    queryFirst: vi.fn(),
    execute: vi.fn(),
    batch: vi.fn(),
  };

  return {
    getAuthoritativeDatabaseClient: () => mockDb,
    __mockDb: mockDb,
  };
});

import {
  getVehicleRegistry,
  getVehicleDossier,
} from "../apps/customer/lib/vehicle-service";
// @ts-expect-error test hook
import { __mockDb } from "@vaahansafe/database";

describe("Vehicle Registry & Dossier Read Model (Cloudflare D1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getVehicleRegistry", () => {
    it("returns truthful empty registry when user has no vehicles", async () => {
      __mockDb.query.mockResolvedValueOnce([]); // vehicles

      const result = await getVehicleRegistry("usr_user1");

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.attentionCount).toBe(0);
    });

    it("accurately derives relationship rail, plate masking, and attention items", async () => {
      // 1. Vehicle query
      __mockDb.query.mockResolvedValueOnce([
        {
          id: "veh_101",
          user_id: "usr_user1",
          registration_number: "AP39AB1234",
          registration_number_normalized: "AP39AB1234",
          vehicle_type: "CAR",
          make: "Honda",
          model: "City",
          variant: "ZX",
          year: 2023,
          color: "Pearl White",
          status: "ACTIVE",
          created_at: "2026-09-01T10:00:00Z",
          updated_at: "2026-09-01T10:00:00Z",
        },
      ]);

      // 2. QR query for veh_101 (unlinked)
      __mockDb.queryFirst.mockResolvedValueOnce(null);

      // 3. Profile query for veh_101 (exists)
      __mockDb.queryFirst.mockResolvedValueOnce({
        id: "ep_201",
        vehicle_id: "veh_101",
        display_name: "Rohan",
        blood_group: "O+",
        medical_notes: null,
        public_vehicle_details: null,
        show_owner_name: 1,
        show_blood_group: 1,
        show_medical_notes: 0,
        show_vehicle_details: 1,
        status: "ACTIVE",
        created_at: "2026-09-01T10:00:00Z",
        updated_at: "2026-09-01T10:00:00Z",
      });

      // 4. Contacts query for ep_201 (empty)
      __mockDb.query.mockResolvedValueOnce([]);

      const result = await getVehicleRegistry("usr_user1");

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);

      const item = result.items[0]!;
      expect(item.id).toBe("veh_101");
      expect(item.make).toBe("Honda");
      expect(item.model).toBe("City");
      expect(item.registrationNumberMasked).toContain("AP");
      expect(item.registrationNumberMasked).toContain("1234");
      expect(item.qr.hasQr).toBe(false);
      expect(item.qr.status).toBe("UNLINKED");
      expect(item.safety.isConfigured).toBe(true);

      // Derived readiness states
      expect(item.readiness.qrNode).toBe("not_configured");
      expect(item.readiness.contactNode).toBe("attention");
      expect(item.readiness.isReady).toBe(false);

      // Deterministic attention items
      expect(item.attention).toHaveLength(2);
      expect(item.attention[0]?.title).toBe("QR Sticker Not Connected");
      expect(item.attention[1]?.title).toBe("Emergency Contact Missing");
    });

    it("filters vehicles accurately by type and search query", async () => {
      __mockDb.query.mockResolvedValueOnce([
        {
          id: "veh_car",
          user_id: "usr_user1",
          registration_number: "MH12AB1234",
          registration_number_normalized: "MH12AB1234",
          vehicle_type: "CAR",
          make: "Tata",
          model: "Nexon",
          variant: null,
          year: 2022,
          color: "Blue",
          status: "ACTIVE",
          created_at: "2026-09-01T10:00:00Z",
          updated_at: "2026-09-01T10:00:00Z",
        },
        {
          id: "veh_bike",
          user_id: "usr_user1",
          registration_number: "KA05CD5678",
          registration_number_normalized: "KA05CD5678",
          vehicle_type: "MOTORCYCLE",
          make: "Royal Enfield",
          model: "Hunter 350",
          variant: null,
          year: 2023,
          color: "Black",
          status: "ACTIVE",
          created_at: "2026-09-02T10:00:00Z",
          updated_at: "2026-09-02T10:00:00Z",
        },
      ]);

      // veh_car queries
      __mockDb.queryFirst.mockResolvedValueOnce(null); // qr
      __mockDb.queryFirst.mockResolvedValueOnce(null); // profile

      // veh_bike queries
      __mockDb.queryFirst.mockResolvedValueOnce(null); // qr
      __mockDb.queryFirst.mockResolvedValueOnce(null); // profile

      // Filter for MOTORCYCLE
      const bikeResult = await getVehicleRegistry("usr_user1", {
        types: ["MOTORCYCLE"],
      });
      expect(bikeResult.items).toHaveLength(1);
      expect(bikeResult.items[0]?.make).toBe("Royal Enfield");

      // Reset mock for query search
      __mockDb.query.mockResolvedValueOnce([
        {
          id: "veh_car",
          user_id: "usr_user1",
          registration_number: "MH12AB1234",
          registration_number_normalized: "MH12AB1234",
          vehicle_type: "CAR",
          make: "Tata",
          model: "Nexon",
          variant: null,
          year: 2022,
          color: "Blue",
          status: "ACTIVE",
          created_at: "2026-09-01T10:00:00Z",
          updated_at: "2026-09-01T10:00:00Z",
        },
      ]);
      __mockDb.queryFirst.mockResolvedValueOnce(null);
      __mockDb.queryFirst.mockResolvedValueOnce(null);

      const searchResult = await getVehicleRegistry("usr_user1", {
        query: "nexon",
      });
      expect(searchResult.items).toHaveLength(1);
      expect(searchResult.items[0]?.model).toBe("Nexon");
    });
  });

  describe("getVehicleDossier", () => {
    it("enforces strict ownership authorization and returns null if not owner", async () => {
      __mockDb.queryFirst.mockResolvedValueOnce(null); // vehicle not found or unauthorized

      const dossier = await getVehicleDossier("usr_otherUser", "veh_secret123");

      expect(dossier).toBeNull();
    });

    it("retrieves full dossier with scan telemetry, contacts, and milestones", async () => {
      // 1. Vehicle ownership authorized
      __mockDb.queryFirst.mockResolvedValueOnce({
        id: "veh_101",
        user_id: "usr_user1",
        registration_number: "DL01AB9999",
        registration_number_normalized: "DL01AB9999",
        vehicle_type: "CAR",
        make: "Hyundai",
        model: "Creta",
        variant: "SX(O)",
        year: 2024,
        color: "Titan Grey",
        status: "ACTIVE",
        created_at: "2026-08-15T10:00:00Z",
        updated_at: "2026-08-15T10:00:00Z",
      });

      // 2. Active QR
      __mockDb.queryFirst.mockResolvedValueOnce({
        id: "qr_stick_01",
        public_id: "VS4821",
        visible_code: "VS-VS4821",
        batch_id: "batch_01",
        status: "ACTIVE",
        activated_at: "2026-08-16T12:00:00Z",
        assigned_at: "2026-08-16T12:00:00Z",
      });

      // 3. Emergency Profile
      __mockDb.queryFirst.mockResolvedValueOnce({
        id: "ep_101",
        vehicle_id: "veh_101",
        display_name: "Amit Patel",
        blood_group: "B+",
        medical_notes: "None",
        public_vehicle_details: null,
        show_owner_name: 1,
        show_blood_group: 1,
        show_medical_notes: 0,
        show_vehicle_details: 1,
        status: "ACTIVE",
        created_at: "2026-08-15T10:05:00Z",
        updated_at: "2026-08-15T10:05:00Z",
      });

      // 4. Emergency Contacts
      __mockDb.query.mockResolvedValueOnce([
        {
          id: "cnt_01",
          emergency_profile_id: "ep_101",
          name: "Neha Patel",
          relationship_label: "Spouse",
          phone: "+919876543210",
          priority: 1,
          is_enabled: 1,
          allow_call: 1,
          allow_message: 1,
          created_at: "2026-08-15T10:10:00Z",
        },
      ]);

      // 5. Recent Scans
      __mockDb.query.mockResolvedValueOnce([
        {
          id: "scan_01",
          scan_type: "PUBLIC_RESOLVE",
          result: "RESOLVED_ACTIVE",
          city: "Bengaluru",
          state: "Karnataka",
          created_at: "2026-09-10T14:30:00Z",
        },
      ]);

      // 6. QR Status History
      __mockDb.query.mockResolvedValueOnce([]);

      const dossier = await getVehicleDossier("usr_user1", "veh_101");

      expect(dossier).not.toBeNull();
      expect(dossier?.id).toBe("veh_101");
      expect(dossier?.make).toBe("Hyundai");
      expect(dossier?.model).toBe("Creta");
      expect(dossier?.qr.status).toBe("ACTIVE");
      expect(dossier?.qr.publicId).toBe("VS4821");
      expect(dossier?.identityId).toBe("VS-VS4821");

      // Contacts
      expect(dossier?.emergencyContacts).toHaveLength(1);
      expect(dossier?.emergencyContacts[0]?.name).toBe("Neha Patel");
      expect(dossier?.emergencyContacts[0]?.phoneMasked).toContain("3210");

      // Recent Scans
      expect(dossier?.recentScans).toHaveLength(1);
      expect(dossier?.recentScans[0]?.city).toBe("Bengaluru");

      // Lifecycle history
      expect(dossier?.lifecycleHistory.length).toBeGreaterThanOrEqual(3);

      // Readiness compass state: All ready!
      expect(dossier?.readiness.isReady).toBe(true);
      expect(dossier?.attention).toHaveLength(0);
    });
  });
});
