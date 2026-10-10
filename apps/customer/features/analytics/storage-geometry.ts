import { scaleLinear, scaleSqrt } from "d3-scale";
import { linkHorizontal } from "d3-shape";
import type { AnalyticsData } from "./types";

type Documents = AnalyticsData["documents"];
export const STORAGE_COLORS = [
  "#b15f43",
  "#62785c",
  "#bd985c",
  "#6c8795",
  "#99777e",
  "#87867c",
];

/** Group only the already aggregated safe projection, preserving every byte. */
export function constellationGroups(data: Documents) {
  const vehicles = data.byVehicle.slice(0, 5).map((row) => ({
    ...row,
    key: row.id || "ACCOUNT",
    members: [row.id],
    other: false,
  }));
  const remaining = data.byVehicle.slice(5);
  if (remaining.length)
    vehicles.push({
      id: null,
      key: "OTHER_VEHICLES",
      members: remaining.map((row) => row.id),
      other: true,
      label: `${remaining.length} remaining groups`,
      name: "Other vehicles",
      bytes: remaining.reduce((sum, row) => sum + row.bytes, 0),
      documents: remaining.reduce((sum, row) => sum + row.documents, 0),
    });
  const categories = data.composition
    .filter((row) => row.label !== "PDF" && row.label !== "Images")
    .map((row) => ({
      ...row,
      key: row.label.replaceAll(" ", "_"),
      other: false,
    }))
    .sort((a, b) => b.bytes - a.bytes || a.key.localeCompare(b.key));
  const shown = categories.slice(0, 5);
  if (categories.length > 5)
    shown.push({
      key: "OTHER_CATEGORIES",
      label: "Other categories",
      other: true,
      bytes: categories.slice(5).reduce((sum, row) => sum + row.bytes, 0),
      count: categories.slice(5).reduce((sum, row) => sum + row.count, 0),
    });
  return { vehicles, categories: shown, allCategories: categories };
}

export function constellationLayout(
  total: number,
  vehicleCount: number,
  categoryCount: number,
) {
  const height = Math.max(460, Math.max(vehicleCount, categoryCount) * 82 + 40);
  const place = (count: number) =>
    Array.from({ length: count }, (_, index) =>
      count === 1
        ? height / 2
        : 60 + (index * (height - 120)) / Math.max(1, count - 1),
    );
  const width = scaleLinear()
    .domain([0, Math.max(1, total)])
    .range([0, 38])
    .clamp(true);
  const radius = scaleSqrt()
    .domain([0, Math.max(1, total)])
    .range([22, 32])
    .clamp(true);
  const path = linkHorizontal<unknown, [number, number]>()
    .x((p) => p[0])
    .y((p) => p[1]);
  return {
    height,
    center: height / 2,
    vehicleY: place(vehicleCount),
    categoryY: place(categoryCount),
    width,
    radius,
    link: (source: [number, number], target: [number, number]) =>
      path({ source, target }) || "",
  };
}

export function categoryPortion(
  data: Documents,
  members: Array<string | null> | null,
  key: string,
  other: boolean,
  shownKeys: string[],
) {
  return data.allocation
    .filter(
      (row) =>
        (!members || members.includes(row.vehicle)) &&
        (other ? !shownKeys.includes(row.category) : row.category === key),
    )
    .reduce((sum, row) => sum + row.bytes, 0);
}
