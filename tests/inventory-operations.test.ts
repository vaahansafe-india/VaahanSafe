import { describe, it, expect } from "vitest";
import jsQR from "jsqr";
import { readFileSync } from "node:fs";
import {
  parseInventoryFilters,
  serializeInventoryFilters,
  EMPTY_FILTERS,
  normalizeInventorySearch,
  encodeInventoryCursor,
  decodeInventoryCursor,
  appendInventoryRows,
} from "../apps/admin/features/inventory/inventory.filters";
import {
  parseInventorySelection,
  isSelected,
  toggleSelected,
  selectedCount,
} from "../apps/admin/features/inventory/inventory.selection";
import {
  canReadInventory,
  canPrintInventory,
  getPrintEligibility,
} from "../apps/admin/features/inventory/inventory.permissions";
import {
  VEHICLE_STICKER_V1,
  validateStickerTemplate,
} from "../apps/admin/features/inventory/print/sticker-template";
import {
  buildStickerScene,
  renderStickerSvg,
} from "../apps/admin/features/inventory/print/sticker-render-model";
import { renderStickerPdf } from "../apps/admin/features/inventory/print/sticker-pdf";
import { exportRows } from "../apps/admin/lib/exports";
describe("Inventory navigation and query boundaries", () => {
  it("roundtrips combined filters deterministically and ignores unsupported lifecycle", () => {
    const f = parseInventoryFilters(
      new URLSearchParams(
        "status=PRINTED,INVENTORY,PRINTED,QUARANTINED&lifecycle=INVENTORY&channel=OFFLINE_RETAIL&batch=batch_001&activation=inactive&print=unrecorded&custody=retailer&risk=failed&from=2026-10-01&to=2026-10-09&sort=oldest&q=vs-bf42",
      ),
    );
    expect(f.statuses).toEqual(["INVENTORY", "PRINTED"]);
    expect(
      parseInventoryFilters(new URLSearchParams(serializeInventoryFilters(f))),
    ).toEqual(f);
  });
  it("rejects invalid real dates and unrecognized parameters", () => {
    const f = parseInventoryFilters(
      new URLSearchParams(
        "from=2026-02-30&to=bad&channel=fake&sort=sql&batch=x%27%3B",
      ),
    );
    expect(f).toEqual(EMPTY_FILTERS);
  });
  it("normalizes search and removes wildcard / operator input", () => {
    expect(normalizeInventorySearch("  ｖｓ-bf42%_(),  ")).toBe("VS-BF42");
  });
  it("preserves microsecond timestamp and identity tie-breaker through the cursor", () => {
    const c = {
      createdAt: "2026-10-09T16:31:06.936636+00:00",
      id: "qr_abc-123",
    };
    expect(decodeInventoryCursor(encodeInventoryCursor(c))).toEqual(c);
    expect(() => decodeInventoryCursor("not-json")).toThrow();
    expect(() =>
      decodeInventoryCursor(encodeInventoryCursor({ ...c, id: "a'; DROP" })),
    ).toThrow();
  });
  it("appends load-more pages without replacing existing rows or duplicating identities", () => {
    const a = { id: "first", createdAt: "same" },
      b = { id: "second", createdAt: "same" },
      c = { id: "third", createdAt: "same" };
    expect(
      appendInventoryRows([
        [a, b],
        [b, c],
      ]),
    ).toEqual([a, b, c]);
  });
  it("distinguishes individual selection from a server query token and exclusions", () => {
    let s = parseInventorySelection({
      mode: "all",
      token: "7a7a1111-2222-3333-4444-123456789012",
      count: 1000,
      excluded: [],
    });
    expect(selectedCount(s)).toBe(1000);
    expect(isSelected(s, "qr_one")).toBe(true);
    s = toggleSelected(s, "qr_one");
    expect(selectedCount(s)).toBe(999);
    expect(isSelected(s, "qr_one")).toBe(false);
    expect(
      parseInventorySelection({ mode: "ids", ids: ["qr_one", "qr_one"] }),
    ).toEqual({ mode: "ids", ids: ["qr_one"] });
    expect(() =>
      parseInventorySelection({
        mode: "ids",
        ids: Array.from({ length: 101 }, (_, i) => `qr_${i}`),
      }),
    ).toThrow();
  });
});
const eligible = {
  status: "INVENTORY",
  hasSecret: true,
  hasArchive: true,
  consumed: false,
  hasPrintHistory: false,
  hasOpenJob: false,
  contextEligible: true,
};
describe("Physical credential permissions", () => {
  it("allows analyst inspection while denying printing and excludes unrelated roles", () => {
    expect(canReadInventory("READ_ONLY_ANALYST")).toBe(true);
    expect(canPrintInventory("READ_ONLY_ANALYST")).toBe(false);
    expect(canReadInventory("FINANCE_ADMIN")).toBe(false);
    expect(getPrintEligibility("OPS_ADMIN", eligible).print).toBe(true);
  });
  it.each([
    "ACTIVATED",
    "BLOCKED",
    "REPLACED",
    "LOST_DAMAGED",
    "WITH_RETAILER",
    "SOLD",
  ])("denies printing and reprinting %s", (status) => {
    expect(
      getPrintEligibility("SUPER_ADMIN", {
        ...eligible,
        status,
        hasPrintHistory: true,
      }),
    ).toMatchObject({ print: false, reprint: false });
  });
  it("requires recoverable original material, no consumption and no unresolved job", () => {
    for (const patch of [
      { hasArchive: false },
      { hasSecret: false },
      { consumed: true },
      { hasOpenJob: true },
      { contextEligible: false },
    ])
      expect(
        getPrintEligibility("SUPER_ADMIN", { ...eligible, ...patch }).print,
      ).toBe(false);
  });
  it("requires a super admin for any previously-issued credential reprint", () => {
    expect(
      getPrintEligibility("OPS_ADMIN", { ...eligible, hasPrintHistory: true }),
    ).toMatchObject({ print: false, reprint: false });
    expect(
      getPrintEligibility("SUPER_ADMIN", {
        ...eligible,
        hasPrintHistory: true,
      }),
    ).toMatchObject({ print: false, reprint: true });
  });
});
describe("One physical specification and confidential output", () => {
  it("uses configured single-sticker geometry with separate zones and bleed", () => {
    expect(validateStickerTemplate(VEHICLE_STICKER_V1)).toMatchObject({
      widthMm: 80,
      heightMm: 60,
      bleedMm: 2,
      safeMm: 4,
      layout: "SINGLE",
      qr: { x: 6, y: 16, size: 36 },
      scratch: { x: 45, y: 36, width: 29, height: 13 },
    });
    expect(() =>
      validateStickerTemplate({
        ...VEHICLE_STICKER_V1,
        scratch: { x: 20, y: 20, width: 29, height: 13 },
      }),
    ).toThrow("overlap");
  });
  it("safe preview never includes actual activation material and refuses confidential SVG", () => {
    const safe = renderStickerSvg(
      buildStickerScene(VEHICLE_STICKER_V1, "BF42R86V", "VS-BF42R86V"),
    );
    expect(safe).toContain('width="80mm"');
    expect(safe).toContain("SCRATCH TO REVEAL");
    expect(safe).not.toContain("ABCDEFGHJKLMNPQR");
    expect(() =>
      renderStickerSvg(
        buildStickerScene(
          VEHICLE_STICKER_V1,
          "BF42R86V",
          "VS-BF42R86V",
          "ABCDEFGHJKLMNPQR",
        ),
      ),
    ).toThrow("protected");
  });
  it("renders a standards-decodable QR with only the canonical public locator", () => {
    const scene = buildStickerScene(
      VEHICLE_STICKER_V1,
      "BF42R86V",
      "VS-BF42R86V",
    );
    const scale = 8,
      n = Math.round(36 / scene.moduleMm),
      width = n * scale,
      pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    for (const s of scene.shapes)
      if (s.type === "rect" && s.fill === "#000000") {
        const x = Math.round((s.x - 6) / scene.moduleMm) * scale,
          y = Math.round((s.y - 16) / scene.moduleMm) * scale;
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const p = ((y + dy) * width + x + dx) * 4;
            pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
          }
      }
    expect(jsQR(pixels, width, width)?.data).toBe(
      "https://qr.vaahansafe.com/BF42R86V",
    );
  });
  it("creates one vector PDF page per single sticker with the exact bleed dimensions", () => {
    const scene = buildStickerScene(
      VEHICLE_STICKER_V1,
      "BF42R86V",
      "VS-BF42R86V",
    );
    const pdf = new TextDecoder().decode(renderStickerPdf([scene, scene]));
    expect(pdf).toContain("/Count 2");
    const box = pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/)!;
    expect((Number(box[1]) * 25.4) / 72).toBeCloseTo(84, 5);
    expect((Number(box[2]) * 25.4) / 72).toBeCloseTo(64, 5);
  });
  it("normal inventory export projects allowlisted fields only and protects formula cells", () => {
    const [row] = exportRows("inventory", [
      {
        visible_code: "=SUM(1,2)",
        batch_reference: "B001",
        activation_secret_hash: "hidden",
        activationCode: "ABCDEFGHJKLMNPQR",
        secret_hash: "hidden2",
      },
    ]);
    expect(row).toContain("'=SUM(1,2)");
    expect(row).toContain("B001");
    expect(row).not.toMatch(/hidden|ABCDEFGHJKLMNPQR/);
  });
  it("keeps print issuance separate from physical completion in transactional server guards", () => {
    const sql = readFileSync(
      "supabase/migrations/20261009170947_inventory_operations_and_print_jobs.sql",
      "utf8",
    );
    expect(sql).toContain("inventory_admin_actor(p_session,true,true)");
    expect(sql).toContain("PRINT_JOB_CREATED");
    expect(sql).toContain("PRINT_ARTIFACT_");
    expect(sql).toContain("PRODUCTION_PRINT_VERIFIED");
    const issue = sql.slice(
      sql.indexOf("ELSIF p_action='ISSUE'"),
      sql.indexOf("ELSIF p_action='FAIL'"),
    );
    expect(issue).not.toContain("qr_stickers");
    expect(issue).toContain("status='PRINTING'");
  });
});
