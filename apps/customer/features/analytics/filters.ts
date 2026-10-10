import type { Filters, Section } from "./types";
import { CATEGORIES } from "../document-vault/model";
import { INDIA_REGIONS } from "./scan-model";
const DAY = 86400000;
export class AnalyticsInputError extends Error {}
export function today(now = new Date()) {
  return new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
}
export function shift(date: string, days: number) {
  return new Date(Date.parse(date + "T00:00:00Z") + days * DAY)
    .toISOString()
    .slice(0, 10);
}
export function defaultFilters(now = new Date()): Filters {
  const end = today(now);
  return {
    from: shift(end, -29),
    to: end,
    vehicle: "",
    qr: "",
    outcome: "",
    category: "",
    event: "",
    device: "",
    region: "",
    grouping: "auto",
    compare: false,
    file: "",
    validity: "",
    protection: "",
    documentActivity: "",
    state: "",
    city: "",
    weekday: "",
    hour: "",
  };
}
export function parseFilters(
  params: URLSearchParams,
  now = new Date(),
): Filters {
  const defaults = defaultFilters(now);
  const read = (key: string, fallback = "") => params.get(key) ?? fallback;
  const from = read("from", defaults.from),
    to = read("to", defaults.to);
  for (const date of [from, to])
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    )
      throw new AnalyticsInputError("Choose valid dates.");
  const days = (Date.parse(to) - Date.parse(from)) / DAY + 1;
  if (days < 1 || days > 366 || to > today(now))
    throw new AnalyticsInputError(
      "Choose a range of up to one year ending today or earlier.",
    );
  const grouping = read("grouping", "auto") as Filters["grouping"];
  if (
    !["auto", "hour", "day", "week", "month"].includes(grouping) ||
    (grouping === "hour" && days > 2)
  )
    throw new AnalyticsInputError(
      "Hourly grouping is available for ranges of up to two days.",
    );
  const outcome = read("outcome"),
    category = read("category"),
    event = read("event"),
    device = read("device");
  if (
    (outcome &&
      ![
        "RESOLVED_ACTIVE",
        "RESOLVED_INACTIVE",
        "RESOLVED_REPLACED",
        "RESOLVED_BLOCKED",
        "NOT_FOUND",
        "NON_ACTIVE",
        "NOT_RESOLVED",
      ].includes(outcome)) ||
    (category && !Object.hasOwn(CATEGORIES, category)) ||
    (event &&
      !["SCAN", "DOCUMENT", "ACCOUNT", "NOTIFICATION", "ACTIVATION"].includes(
        event,
      )) ||
    (device && !["Mobile", "Tablet", "Desktop", "Unknown"].includes(device))
  )
    throw new AnalyticsInputError("Choose supported filters.");
  const vehicle = read("vehicle"),
    qr = read("qr"),
    region = read("region");
  const state = read("state"),
    city = read("city"),
    weekday = read("weekday"),
    hour = read("hour");
  if (
    (state &&
      (!state.startsWith("IN-") || !Object.hasOwn(INDIA_REGIONS, state))) ||
    city.length > 120 ||
    (weekday && !/^[0-6]$/.test(weekday)) ||
    (hour && !/^(?:[0-9]|1[0-9]|2[0-3])$/.test(hour))
  )
    throw new AnalyticsInputError("Choose supported scan filters.");
  const file = read("file"),
    validity = read("validity"),
    protection = read("protection"),
    documentActivity = read("documentActivity");
  if (
    (file &&
      ![
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/*",
      ].includes(file)) ||
    (validity &&
      !["CURRENT", "EXPIRING", "EXPIRED", "NONE"].includes(validity)) ||
    (protection &&
      !["ACCOUNT", "VAULT_PIN", "DOCUMENT_PASSWORD"].includes(protection)) ||
    (documentActivity &&
      !["UPLOAD", "PREVIEW", "DOWNLOAD", "SHARE", "REPLACE", "DELETE"].includes(
        documentActivity,
      ))
  )
    throw new AnalyticsInputError("Choose supported storage filters.");
  if (
    [vehicle, qr].some((v) => v && !/^[A-Za-z0-9_-]{1,100}$/.test(v)) ||
    region.length > 120 ||
    (read("compare") && !["true", "false"].includes(read("compare")))
  )
    throw new AnalyticsInputError("Choose supported filters.");
  return {
    from,
    to,
    grouping,
    outcome,
    category,
    event,
    device,
    vehicle,
    qr,
    region,
    compare: read("compare") === "true",
    file,
    validity,
    protection,
    documentActivity,
    state,
    city,
    weekday,
    hour,
  };
}
export function granularity(f: Filters) {
  const days = (Date.parse(f.to) - Date.parse(f.from)) / DAY + 1;
  return f.grouping !== "auto"
    ? f.grouping
    : days <= 2
      ? "hour"
      : days <= 90
        ? "day"
        : "week";
}
export function canonicalSearch(section: Section, f: Filters) {
  const keys: Array<keyof Filters> =
    section === "context"
      ? []
      : section === "security"
        ? ["from", "to", "grouping", "device"]
        : section === "documents" || section.startsWith("storage-")
          ? [
              "from",
              "to",
              "grouping",
              "vehicle",
              "category",
              "file",
              "validity",
              "protection",
              "documentActivity",
            ]
          : section === "scans" ||
              section === "network" ||
              section.startsWith("scan-")
            ? [
                "from",
                "to",
                "grouping",
                "vehicle",
                "qr",
                "outcome",
                "region",
                "compare",
                "state",
                "city",
                "weekday",
                "hour",
              ]
            : [
                "from",
                "to",
                "grouping",
                "vehicle",
                "qr",
                "outcome",
                "category",
                "event",
                "region",
                "file",
                "validity",
                "protection",
                "documentActivity",
                "state",
                "city",
                "weekday",
                "hour",
              ];
  const params = new URLSearchParams();
  keys.forEach((k) => {
    const value = f[k];
    if (value !== "" && value !== false && value !== undefined)
      params.set(k, String(value));
  });
  params.sort();
  return params.toString();
}
export function scanDelta(current: number, previous: number | null) {
  if (previous === null) return "Comparison off";
  if (!previous)
    return current ? "New activity" : "No activity in either period";
  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta > 0 ? "+" : ""}${delta}% vs previous period`;
}
