import { describe, it, expect } from "vitest";
import {
  parseUtcDate,
  formatTimelineTimestamp,
  formatFullIstTimestamp,
  formatDateIst,
  IST_TIMEZONE,
} from "../apps/customer/lib/datetime";

describe("Authoritative Indian Standard Time (IST) Datetime Engine", () => {
  it("exports IST timezone identifier as Asia/Kolkata", () => {
    expect(IST_TIMEZONE).toBe("Asia/Kolkata");
  });

  it("safely parses UTC ISO timestamps and SQLite space-delimited timestamps without delay", () => {
    const isoUtc = "2026-09-23T06:38:00.000Z";
    const sqliteUtc = "2026-09-23 06:38:00";

    const parsedIso = parseUtcDate(isoUtc);
    const parsedSqlite = parseUtcDate(sqliteUtc);

    expect(parsedIso).not.toBeNull();
    expect(parsedSqlite).not.toBeNull();
    expect(parsedIso?.getTime()).toBe(parsedSqlite?.getTime());
  });

  it("converts UTC 06:38 to Indian Standard Time 12:08 (5h 30m ahead) without lag", () => {
    // 06:38 UTC is 12:08 IST (+05:30)
    const timestamp = "2026-09-23T06:38:00.000Z";
    const formatted = formatTimelineTimestamp(timestamp);

    expect(formatted).toBe("09-23 12:08");
  });

  it("converts morning manufacturing/activation timestamps (05:38 UTC -> 11:08 IST)", () => {
    const timestamp = "2026-09-23T05:38:00.000Z";
    const formatted = formatTimelineTimestamp(timestamp);

    expect(formatted).toBe("09-23 11:08");
  });

  it("formats full IST timestamps with official timezone indication", () => {
    const timestamp = "2026-09-23T06:38:00.000Z";
    const fullFormatted = formatFullIstTimestamp(timestamp);

    expect(fullFormatted).toContain("2026");
    expect(fullFormatted).toContain("12:08");
    expect(fullFormatted).toContain("IST");
  });

  it("formats compact full IST timestamps for lifeline nodes", () => {
    const timestamp = "2026-09-23T05:38:00.000Z";
    const compactFormatted = formatFullIstTimestamp(timestamp, { compact: true });

    expect(compactFormatted).toContain("11:08");
    expect(compactFormatted).not.toContain("IST");
  });

  it("formats date-only in IST", () => {
    const timestamp = "2026-09-23T20:30:00.000Z"; // 20:30 UTC on 23rd is 02:00 IST on 24th
    const formatted = formatDateIst(timestamp);

    expect(formatted).toContain("24");
    expect(formatted).toContain("Sep");
  });

  it("handles null or undefined gracefully", () => {
    expect(formatTimelineTimestamp(null)).toBe("");
    expect(formatTimelineTimestamp(undefined)).toBe("");
    expect(formatFullIstTimestamp(null)).toBe("Recorded");
    expect(formatDateIst(null)).toBe("");
  });
});
