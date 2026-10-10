import { describe, it, expect } from "vitest";
import { parseOfflineQrCsv } from "../apps/admin/lib/offline-qr-csv";
import { parseVaahanSafeQrPayload } from "../packages/qr/src/resolver/validate-payload";
import { evaluateQrInventoryEligibility } from "../packages/shipping/src/allocation/eligibility-policy";
import { mapInternalToPublicResolverState } from "../packages/qr/src/resolver/states";
import { canTransitionQrStatus } from "../packages/qr/src/lifecycle/transitions";

const header =
  "serial,vehicle_id,qr_url,status,vehicle_number,owner_name,phone,tagged_date";
const row =
  "B001-0001,VS-UC54MSAN,https://www.vaahansafe.com/v/VS-UC54MSAN,unassigned,,,,";
describe("Offline batch boundaries", () => {
  it("maps the CSV identifier to a public locator, without creating a vehicle", () => {
    expect(parseOfflineQrCsv(`${header}\n${row}`)).toEqual({
      reference: "B001",
      rows: [{ serial: "B001-0001", publicId: "UC54MSAN" }],
    });
  });
  it("rejects repeated IDs, owner details and activated input", () => {
    expect(() => parseOfflineQrCsv(`${header}\n${row}\n${row}`)).toThrow();
    expect(() =>
      parseOfflineQrCsv(`${header}\n${row.replace("unassigned", "activated")}`),
    ).toThrow();
    expect(() =>
      parseOfflineQrCsv(`${header}\n${row.slice(0, -1)}2026-10-09`),
    ).toThrow();
  });
  it("accepts the exact legacy printed URL and rejects lookalikes or other routes", () => {
    expect(
      parseVaahanSafeQrPayload("https://www.vaahansafe.com/v/VS-UC54MSAN")
        .publicId,
    ).toBe("UC54MSAN");
    for (const url of [
      "https://www.vaahansafe.com.evil.test/v/VS-UC54MSAN",
      "https://www.vaahansafe.com/VS-UC54MSAN",
      "https://www.vaahansafe.com/v/VS-UC54MSAN?secret=x",
    ])
      expect(parseVaahanSafeQrPayload(url).valid).toBe(false);
  });
  it("keeps offline inventory out of online fulfillment even after printing", () => {
    expect(canTransitionQrStatus("INVENTORY", "ACTIVATED").allowed).toBe(false);
    expect(
      evaluateQrInventoryEligibility({
        id: "qr",
        publicId: "UC54MSAN",
        visibleCode: "VS-UC54MSAN",
        batchId: "batch",
        status: "PRINTED",
        inventoryChannel: "OFFLINE_RETAIL",
        hasActiveAssignment: false,
        hasActiveReservation: false,
      }).isEligible,
    ).toBe(false);
    expect(mapInternalToPublicResolverState("INVENTORY")).toBe(
      "SETUP_REQUIRED",
    );
  });
});
