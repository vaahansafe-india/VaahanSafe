import { describe, expect, it } from "vitest";
import {
  categoryPortion,
  constellationGroups,
  constellationLayout,
} from "../apps/customer/features/analytics/storage-geometry";
import type { AnalyticsData } from "../apps/customer/features/analytics/types";

// Geometry fixtures stay in tests; the page receives only server projections.
function fixture(
  vehicles: number,
  categories: number,
  documents = 1,
): AnalyticsData["documents"] {
  const allocation = Array.from({ length: vehicles * categories }, (_, i) => ({
    vehicle: i % vehicles === 0 ? null : `vehicle_${i % vehicles}`,
    category: `CATEGORY_${Math.floor(i / vehicles)}`,
    bytes: (i + 1) * 1024,
    documents,
  }));
  const byVehicle = Array.from({ length: vehicles }, (_, i) => {
    const id = i === 0 ? null : `vehicle_${i}`;
    return {
      id,
      label: `Vehicle ${i}`,
      name: `Vehicle ${i}`,
      bytes: allocation
        .filter((row) => row.vehicle === id)
        .reduce((sum, row) => sum + row.bytes, 0),
      documents: documents * categories,
    };
  });
  const composition = Array.from({ length: categories }, (_, i) => ({
    label: `CATEGORY ${i}`,
    bytes: allocation
      .filter((row) => row.category === `CATEGORY_${i}`)
      .reduce((sum, row) => sum + row.bytes, 0),
    count: documents * vehicles,
  }));
  const bytes = byVehicle.reduce((sum, row) => sum + row.bytes, 0);
  return {
    total: vehicles * categories * documents,
    bytes,
    byVehicle,
    composition: [
      { label: "PDF", bytes, count: vehicles * categories * documents },
      ...composition,
    ],
    allocation,
    quotaBytes: 0,
    reservedBytes: bytes,
    expiry: [],
    activity: [],
    series: [],
    rhythm: [],
    statuses: [],
    versions: { currentBytes: bytes, previousBytes: 0, previousCount: 0 },
    expirySummary: { week: 0, month: 0, quarter: 0, expired: 0 },
  };
}

describe("Storage constellation accounting and geometry", () => {
  it.each([
    [0, 0],
    [1, 1],
    [10, 15],
    [10, 10],
  ])(
    "preserves totals across %i vehicles and %i categories",
    (vehicles, categories) => {
      const data = fixture(vehicles, categories, 10);
      const grouped = constellationGroups(data);
      expect(grouped.vehicles.reduce((sum, row) => sum + row.bytes, 0)).toBe(
        data.bytes,
      );
      expect(grouped.categories.reduce((sum, row) => sum + row.bytes, 0)).toBe(
        data.bytes,
      );
      expect(
        grouped.vehicles.reduce((sum, row) => sum + row.documents, 0),
      ).toBe(data.total);
      expect(grouped.vehicles.length).toBeLessThanOrEqual(6);
      expect(grouped.categories.length).toBeLessThanOrEqual(6);
    },
  );
  it("keeps the other-vehicles highlight and other-categories flow accurate", () => {
    const data = fixture(10, 15);
    data.byVehicle.push(data.byVehicle.shift()!);
    const grouped = constellationGroups(data);
    const other = grouped.vehicles.find((row) => row.other)!;
    const shownKeys = grouped.categories
      .filter((row) => !row.other)
      .map((row) => row.key);
    const amounts = grouped.categories.map((row) =>
      categoryPortion(data, other.members, row.key, row.other, shownKeys),
    );
    expect(amounts.reduce((sum, bytes) => sum + bytes, 0)).toBe(other.bytes);
    expect(other.members).toContain(null);
  });
  it("shows no flow for a category absent from the selected vehicle", () => {
    const data = fixture(2, 2);
    data.allocation = data.allocation.filter(
      (row) => !(row.vehicle === "vehicle_1" && row.category === "CATEGORY_0"),
    );
    const amount = categoryPortion(data, ["vehicle_1"], "CATEGORY_0", false, [
      "CATEGORY_0",
    ]);
    expect(amount).toBe(0);
    expect(constellationLayout(data.bytes, 2, 2).width(amount)).toBe(0);
  });
  it.each([0, 1, 2, 3, 4, 5, 6])(
    "places %i nodes without collisions or invalid paths",
    (count) => {
      const layout = constellationLayout(0, count, count);
      expect(layout).toMatchObject({
        height: constellationLayout(0, count, count).height,
      });
      for (const [index, y] of layout.vehicleY.entries()) {
        expect(y - 36).toBeGreaterThanOrEqual(20);
        expect(y + 36).toBeLessThanOrEqual(layout.height);
        if (index)
          expect(y - layout.vehicleY[index - 1]!).toBeGreaterThanOrEqual(72);
        expect(layout.link([245, y], [286, layout.center])).not.toMatch(
          /NaN|Infinity/,
        );
      }
    },
  );
  it("uses proportional flow widths across KB, MB, and GB", () => {
    for (const total of [1024, 1048576, 1073741824]) {
      const { width } = constellationLayout(total, 1, 1);
      expect(width(total / 2)).toBe(width(total) / 2);
      expect(width(0)).toBe(0);
    }
  });
});
