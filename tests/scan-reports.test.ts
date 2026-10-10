import { describe, it, expect, vi, afterEach } from "vitest";
import {
  validateScanReport,
  submitScanReport,
  sharedLocationText,
  type ScanReportInput,
} from "../packages/qr/src/reports/scan-report";
import type { DatabaseClient } from "../packages/database/src/client/d1";
import type { ObjectStore } from "../packages/storage/src/ports/object-store";
import { getTemplateDefinition } from "../packages/notifications/src/templates/registry";
import { Msg91WhatsAppAdapter } from "../packages/notifications/src/whatsapp";
import {
  resolvePublicQr,
  type HotPathQueryResultRow,
} from "../packages/qr/src/resolver/resolve-public-qr";
afterEach(() => vi.unstubAllGlobals());

const id = "report_4e70346f-266f-4d49-8a6a-fc91db9a785c";
function input(): ScanReportInput {
  return {
    publicId: "VS-ABCD1234567890",
    requestId: crypto.randomUUID(),
    reason: "PARKING",
    note: "",
    consent: true,
    photos: [
      { data: new Uint8Array([255, 216, 255, 0]), mimeType: "image/jpeg" },
    ],
  };
}
function deps(results: unknown[]) {
  const db = {
    queryFirst: vi.fn(),
    execute: vi.fn().mockResolvedValue({ success: true, rowsAffected: 1 }),
  } as unknown as DatabaseClient;
  for (const value of results)
    (db.queryFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(value);
  const store = {
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(true),
  } as unknown as ObjectStore;
  return { db, store, ipHash: "a".repeat(64) };
}
describe("finder report boundaries", () => {
  it("retains WhatsApp-only contacts and removes contacts with neither permission", async () => {
    const publicId = "VS-ABCD1234567890";
    const result = await resolvePublicQr(publicId, {
      repository: {
        findQr: async () =>
          ({
            qr_id: "qr_unit",
            public_id: publicId,
            qr_status: "ACTIVATED",
            vehicle_id: "vehicle_unit",
            owner_user_id: "owner_unit",
            emergency_profile_id: "profile_unit",
            profile_status: "ACTIVE",
          }) as HotPathQueryResultRow,
        findEntitlements: async () => [
          {
            id: "ent_unit",
            capability: "SAFETY_VIEW_ACTIVE",
            status: "ENABLED",
            user_id: "owner_unit",
            vehicle_id: "vehicle_unit",
            expires_at: null,
          },
        ],
        findContacts: async () => [
          {
            id: "message_only",
            name: "Approved contact",
            phone: "+919876543210",
            relationship_label: "Friend",
            priority: 1,
            allow_call: 0,
            allow_message: 1,
          },
          {
            id: "neither",
            name: "Disabled contact",
            phone: "+919876543211",
            relationship_label: "Friend",
            priority: 2,
            allow_call: 0,
            allow_message: 0,
          },
        ],
      },
    });
    expect(result.profile?.approvedEmergencyContacts).toHaveLength(1);
    expect(result.profile?.approvedEmergencyContacts[0]).toMatchObject({
      id: "message_only",
      allowCall: false,
      allowMessage: true,
    });
  });
  it("requires boolean consent, valid fresh GPS, bounded count and genuine image bytes", () => {
    const report = input();
    expect(() => validateScanReport(report)).not.toThrow();
    for (const change of [
      { consent: false },
      { consent: "yes" },
      {
        photos: [
          { data: new Uint8Array([60, 115, 118, 103]), mimeType: "image/png" },
        ],
      },
      { photos: Array(4).fill(report.photos[0]) },
      {
        location: {
          latitude: 91,
          longitude: 1,
          accuracy: 5,
          capturedAt: new Date().toISOString(),
        },
      },
      {
        location: {
          latitude: 1,
          longitude: 1,
          accuracy: 5,
          capturedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        },
      },
    ]) {
      expect(() =>
        validateScanReport({ ...report, ...change } as ScanReportInput),
      ).toThrow("INVALID_REPORT");
    }
  });
  it("never uploads when server entitlement or cooldown denies the report", async () => {
    for (const result of [
      { result: { error: "UNAVAILABLE" } },
      { result: { error: "COOLDOWN" } },
    ]) {
      const d = deps([result]);
      await expect(submitScanReport(input(), d)).rejects.toThrow();
      expect(d.store.put).not.toHaveBeenCalled();
    }
  });
  it("an idempotent ready result never reuploads or requeues", async () => {
    const d = deps([{ result: { id, status: "READY" } }]);
    expect(await submitScanReport(input(), d)).toMatchObject({
      recorded: true,
      id,
    });
    expect(d.store.put).not.toHaveBeenCalled();
    expect(d.db.queryFirst).toHaveBeenCalledTimes(1);
  });
  it("permits a fresh client request only after a confirmed failed reservation", async () => {
    const d = deps([{ result: { id, status: "FAILED" } }]);
    await expect(submitScanReport(input(), d)).rejects.toThrow("REPORT_RETRY");
    expect(d.store.put).not.toHaveBeenCalled();
  });
  it("only acknowledges after a completed atomic database write", async () => {
    const d = deps([{ result: { id, status: "NEW" } }, { result: true }]);
    expect(await submitScanReport(input(), d)).toMatchObject({
      recorded: true,
      notificationQueued: true,
    });
    expect(d.store.put).toHaveBeenCalledWith(
      `scan-reports/${id}/0.jpg`,
      expect.any(Uint8Array),
      { contentType: "image/jpeg" },
    );
  });
  it("cleans orphan objects after a confirmed incomplete report", async () => {
    const d = deps([
      { result: { id, status: "NEW" } },
      { result: false },
      { status: "UPLOADING" },
    ]);
    await expect(submitScanReport(input(), d)).rejects.toThrow("REPORT_RETRY");
    expect(d.store.delete).toHaveBeenCalled();
    expect(d.db.execute).toHaveBeenCalled();
  });
  it("preserves committed photos after an ambiguous response", async () => {
    const d = deps([{ result: { id, status: "NEW" } }]);
    (d.db.queryFirst as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce({ status: "READY" });
    expect(await submitScanReport(input(), d)).toMatchObject({
      recorded: true,
    });
    expect(d.store.delete).not.toHaveBeenCalled();
  });
  it("keeps bytes and the request identity when commit status cannot be read", async () => {
    const d = deps([{ result: { id, status: "NEW" } }]);
    (d.db.queryFirst as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockRejectedValueOnce(new Error("database unavailable"));
    await expect(submitScanReport(input(), d)).rejects.toThrow("REPORT_FAILED");
    expect(d.store.delete).not.toHaveBeenCalled();
    expect(d.db.execute).not.toHaveBeenCalled();
  });
  it("never deletes photos when completion wins the cancellation race", async () => {
    const d = deps([
      { result: { id, status: "NEW" } },
      { result: false },
      { status: "UPLOADING" },
      { status: "READY" },
    ]);
    (d.db.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      rowsAffected: 0,
    });
    expect(await submitScanReport(input(), d)).toMatchObject({
      recorded: true,
    });
    expect(d.store.delete).not.toHaveBeenCalled();
  });
  it("never treats missing or coarse location as exact vehicle GPS", () => {
    expect(sharedLocationText()).toBe("Location was not shared");
    expect(
      sharedLocationText({
        latitude: 12,
        longitude: 77,
        accuracy: 18,
        capturedAt: new Date().toISOString(),
      }),
    ).toContain("Finder-shared GPS (accuracy ±18 m)");
  });
  it("renders an authenticated photo report link and a truthful emergency template", () => {
    const tpl = getTemplateDefinition("VEHICLE_SCAN_REPORT_V1"),
      variables = {
        vehicleMaskedReg: "MH••••1234",
        scannedAtFormatted: "10 Oct 2026",
        reportId: id,
        reason: "PARKING",
        locationText: "Location was not shared",
        photoCount: 2,
      };
    expect(tpl.renderWhatsApp(variables)).toMatchObject({
      templateName: "vhn_vehicle_report_v1",
      parameters: {
        4: "Location was not shared",
        5: `https://app.vaahansafe.com/scan-history?period=90D&report=${id}`,
      },
    });
    expect(
      tpl.renderWhatsApp({ ...variables, reason: "EMERGENCY" }).templateName,
    ).toBe("vhn_vehicle_emergency_report_v1");
    expect(tpl.renderInApp(variables).body).toContain("2 photo(s)");
  });
});

describe("MSG91 report approval contract", () => {
  const adapter = new Msg91WhatsAppAdapter(
    "unit-key",
    "919876543210",
    "unit-namespace",
  );
  const name = "vhn_vehicle_report_v1" as const;
  function provider(overrides: Record<string, unknown> = {}) {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              status: "success",
              data: [
                {
                  name,
                  namespace: "unit-namespace",
                  languages: [
                    {
                      language: "en",
                      status: "approved",
                      is_disabled: 0,
                      variables: [
                        "body_1",
                        "body_2",
                        "body_3",
                        "body_4",
                        "body_5",
                      ],
                      ...overrides,
                    },
                  ],
                },
              ],
            }),
          ),
        ),
    );
  }
  it("accepts the approved exact five-variable language contract", async () => {
    provider();
    expect(await adapter.getTemplateApproval(name)).toBe("APPROVED");
  });
  it("blocks changed parameters and missing status", async () => {
    for (const change of [{ variables: ["body_1"] }, { status: null }]) {
      provider(change);
      expect(await adapter.getTemplateApproval(name)).toBe("PENDING");
    }
  });
  it("blocks disabled approved templates", async () => {
    provider({ is_disabled: 1 });
    expect(await adapter.getTemplateApproval(name)).toBe("DISABLED");
  });
  it("does not accept an approval from a different namespace", async () => {
    provider();
    expect(
      await new Msg91WhatsAppAdapter(
        "unit-key",
        "919876543210",
        "different-namespace",
      ).getTemplateApproval(name),
    ).toBe("PENDING");
  });
});
