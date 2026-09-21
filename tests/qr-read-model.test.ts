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
  getQrOverview,
  getQrCodesRegistry,
  getBuyQrData,
  getDigitalQrData,
  getReplaceQrData,
} from "../apps/customer/lib/qr-service";
// @ts-expect-error test hook
import { __mockDb } from "@vaahansafe/database";

describe("QR Service Read Models (Authoritative Cloudflare D1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns truthful empty state when user has no vehicles or stickers", async () => {
    __mockDb.query
      .mockResolvedValueOnce([]) // vehicles
      .mockResolvedValueOnce([]); // stickers

    const overview = await getQrOverview("usr_empty");

    expect(overview.vehicles).toEqual([]);
    expect(overview.primaryVehicle).toBeUndefined();
    expect(overview.primarySticker).toBeUndefined();
    expect(overview.railStates.vehicleNode).toBe("not_configured");
    expect(overview.railStates.qrNode).toBe("not_configured");
    expect(overview.recommendedAction).toBe("BUY");
    expect(overview.stickersCount).toBe(0);
  });

  it("computes active signal rail, primary sticker, and permanent resolver URL", async () => {
    // 1. vehicles query
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "veh_1",
        user_id: "usr_active",
        registration_number: "KA01MJ4821",
        vehicle_type: "CAR",
        make: "Honda",
        model: "City",
        status: "ACTIVE",
        created_at: "2026-09-01T10:00:00Z",
        updated_at: "2026-09-01T10:00:00Z",
      },
    ]);

    // 2. stickers query
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "qr_1",
        public_id: "7F3K9021",
        visible_code: "VS-7F3K-9021",
        batch_id: "batch_1",
        status: "ACTIVATED",
        activated_at: "2026-09-02T10:00:00Z",
        created_at: "2026-09-01T10:00:00Z",
        updated_at: "2026-09-02T10:00:00Z",
        vehicle_id: "veh_1",
        assigned_at: "2026-09-02T10:00:00Z",
      },
    ]);

    // 3. profiles query
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "prof_1",
        vehicle_id: "veh_1",
        display_name: "Rahul Verma",
        blood_group: "O+",
        medical_notes: null,
      },
    ]);

    // 4. contacts query
    __mockDb.query.mockResolvedValueOnce([
      {
        id: "cont_1",
        vehicle_id: "veh_1",
        priority: 1,
      },
    ]);

    const overview = await getQrOverview("usr_active");

    expect(overview.vehicles).toHaveLength(1);
    expect(overview.primaryVehicle?.maskedPlate).toBe("KA •• •• 4821");
    expect(overview.primarySticker?.publicId).toBe("7F3K9021");
    expect(overview.primarySticker?.resolverUrl).toBe("https://qr.vaahansafe.com/7F3K9021");
    expect(overview.railStates.vehicleNode).toBe("active");
    expect(overview.railStates.qrNode).toBe("active");
    expect(overview.railStates.contactNode).toBe("active");
    expect(overview.railStates.safetyNode).toBe("active");
    expect(overview.recommendedAction).toBe("DIGITAL");
  });

  it("filters QR registry items and handles search queries truthfully", async () => {
    __mockDb.query
      .mockResolvedValueOnce([
        {
          id: "qr_1",
          public_id: "7F3K9021",
          visible_code: "VS-7F3K-9021",
          batch_id: "batch_1",
          status: "ACTIVATED",
          activated_at: "2026-09-02T10:00:00Z",
          created_at: "2026-09-01T10:00:00Z",
          updated_at: "2026-09-02T10:00:00Z",
          vehicle_id: "veh_1",
          assigned_at: "2026-09-02T10:00:00Z",
        },
        {
          id: "qr_2",
          public_id: "8M2P1144",
          visible_code: "VS-8M2P-1144",
          batch_id: "batch_1",
          status: "PRINTED",
          activated_at: null,
          created_at: "2026-09-01T10:00:00Z",
          updated_at: "2026-09-01T10:00:00Z",
          vehicle_id: null,
          assigned_at: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "veh_1",
          user_id: "usr_active",
          registration_number: "KA01MJ4821",
          vehicle_type: "CAR",
          make: "Honda",
          model: "City",
          status: "ACTIVE",
          created_at: "2026-09-01T10:00:00Z",
          updated_at: "2026-09-01T10:00:00Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getQrCodesRegistry("usr_active", { search: "honda" });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.publicId).toBe("7F3K9021");
    expect(result.items[0]?.vehicle?.make).toBe("Honda");
  });
});
