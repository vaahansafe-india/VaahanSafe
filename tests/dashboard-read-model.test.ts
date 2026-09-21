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

import { getDashboardOverview } from "../apps/customer/lib/dashboard-service";
// @ts-expect-error test hook
import { __mockDb } from "@vaahansafe/database";

describe("Dashboard Service Read Model (authoritative D1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns truthful empty onboarding overview when customer has no vehicles", async () => {
    __mockDb.query.mockResolvedValueOnce([]); // No vehicles

    const overview = await getDashboardOverview({ id: "usr_test123", name: "Rohan Sharma" });

    expect(overview.vehicles).toEqual([]);
    expect(overview.activeVehicle).toBeNull();
    expect(overview.qrSticker).toBeNull();
    expect(overview.scanSummary.totalScans).toBe(0);
    expect(overview.scanSummary.points).toEqual([]);
    expect(overview.attentionItems).toHaveLength(1);
    expect(overview.attentionItems[0]?.id).toBe("no-vehicle");
    expect(overview.attentionItems[0]?.actionTarget).toBe("vehicle");
  });

  it("accurately maps active vehicle, QR sticker, and computes real attention items", async () => {
    // 1. vehicles query
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "veh_101",
        registration_number: "DL01AB1234",
        make: "Tata",
        model: "Nexon EV",
        vehicle_type: "CAR",
        status: "ACTIVE",
        created_at: "2026-09-01T10:00:00Z",
      },
    ]);

    // 2. Parallel queries:
    // qrRow
    __mockDb.queryFirst.mockResolvedValueOnce({
      id: "qr_201",
      public_id: "VS9999",
      visible_code: "VS-9999",
      batch_id: "BATCH-2026-01",
      status: "ACTIVE",
      activated_at: "2026-09-02T12:00:00Z",
      assigned_at: "2026-09-02T12:00:00Z",
    });
    // profileRow
    __mockDb.queryFirst.mockResolvedValueOnce({
      id: "ep_301",
      vehicle_id: "veh_101",
      display_name: "Rohan",
      blood_group: "O+",
      medical_notes: "None",
      show_owner_name: 1,
      show_blood_group: 1,
      show_medical_notes: 0,
      show_vehicle_details: 1,
      status: "ACTIVE",
      updated_at: "2026-09-05T14:00:00Z",
    });
    // subRow
    __mockDb.queryFirst.mockResolvedValueOnce({
      id: "sub_401",
      status: "ACTIVE",
      current_period_end: "2027-09-01T00:00:00Z",
      auto_renew: 1,
      plan_name: "Annual Safety Shield",
    });
    // orderRows
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "ord_501",
        order_number: "ORD-2026-001",
        status: "FULFILLED",
        total_minor: 49900,
        created_at: "2026-09-02T11:00:00Z",
      },
    ]);
    // notifRows
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "notif_601",
        category: "SAFETY",
        priority: "HIGH",
        title: "QR Activated",
        body_safe: "Your sticker VS-9999 is now protecting Tata Nexon EV",
        read_at: "2026-09-02T12:05:00Z",
        created_at: "2026-09-02T12:00:00Z",
      },
    ]);
    // unreadNotifRow
    __mockDb.queryFirst.mockResolvedValueOnce({ count: 0 });

    // 3. Contacts query (profile has contacts)
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "ct_701",
        name: "Pooja Sharma",
        relationship: "Spouse",
        phone: "+919876543210",
        priority: 1,
        is_enabled: 1,
        allow_call: 1,
        allow_message: 1,
      },
    ]);

    // 4. Scan rows & QR history
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "scan_801",
        scan_type: "PUBLIC_RESOLVE",
        result: "RESOLVED_ACTIVE",
        city: "New Delhi",
        state: "Delhi",
        created_at: "2026-09-10T09:30:00Z",
      },
      {
        id: "scan_802",
        scan_type: "EMERGENCY_TRIGGER",
        result: "RESOLVED_ACTIVE",
        city: "Gurugram",
        state: "Haryana",
        created_at: "2026-09-10T11:45:00Z",
      },
    ]);
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "hist_901",
        from_status: "PRINTED",
        to_status: "ACTIVE",
        reason_code: "CUSTOMER_ACTIVATION",
        actor_type: "USER",
        created_at: "2026-09-02T12:00:00Z",
      },
    ]);

    const overview = await getDashboardOverview(
      { id: "usr_test123", name: "Rohan Sharma" },
      "veh_101",
      { range: "30d" }
    );

    expect(overview.activeVehicle?.registrationNumber).toBe("DL01AB1234");
    expect(overview.qrSticker?.visibleCode).toBe("VS-9999");
    expect(overview.qrSticker?.status).toBe("ACTIVE");

    // Scan Summary
    expect(overview.scanSummary.totalScans).toBe(2);
    expect(overview.scanSummary.emergencyScans).toBe(1);
    expect(overview.scanSummary.peakCount).toBe(2);
    expect(overview.scanSummary.points).toHaveLength(1); // Same day (2026-09-10)
    expect(overview.scanSummary.points[0]?.count).toBe(2);
    expect(overview.scanSummary.points[0]?.emergencyCount).toBe(1);

    // Safety Projection
    expect(overview.safetyProfile.showOwnerName).toBe(true);
    expect(overview.safetyProfile.showBloodGroup).toBe(true);
    expect(overview.safetyProfile.showMedicalNotes).toBe(false);
    expect(overview.safetyProfile.contacts).toHaveLength(1);

    // Lifeline & Constellation
    expect(overview.qrLifeline.length).toBeGreaterThanOrEqual(2);
    expect(overview.constellationEvents.length).toBeGreaterThanOrEqual(4);

    // No missing contact attention item because contact exists
    expect(overview.attentionItems.find((a) => a.id === "no-emergency-contact")).toBeUndefined();
  });

  it("flags missing emergency contact and unlinked QR in attention engine", async () => {
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "veh_102",
        registration_number: "KA05XY5678",
        make: "Mahindra",
        model: "XUV700",
        vehicle_type: "CAR",
        status: "ACTIVE",
        created_at: "2026-09-01T10:00:00Z",
      },
    ]);

    // qrRow: null (no QR sticker)
    __mockDb.queryFirst.mockResolvedValueOnce(null);
    // profileRow: null (no profile)
    __mockDb.queryFirst.mockResolvedValueOnce(null);
    // subRow: null
    __mockDb.queryFirst.mockResolvedValueOnce(null);
    // orderRows: []
    __mockDb.query.mockResolvedValueOnce([]);
    // notifRows: []
    __mockDb.query.mockResolvedValueOnce([]);
    // unread count
    __mockDb.queryFirst.mockResolvedValueOnce({ count: 0 });

    const overview = await getDashboardOverview({ id: "usr_test123" });

    const attentionIds = overview.attentionItems.map((a) => a.id);
    expect(attentionIds).toContain("no-emergency-contact");
    expect(attentionIds).toContain("no-qr-sticker");
    expect(attentionIds).toContain("missing-blood-group");
  });
});
