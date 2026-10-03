import { describe, expect, it } from "vitest";
import { buildHeartbeatSlots } from "../apps/status/components/status/infrastructure/HeartbeatCharts";

describe("recorded heartbeat chart slots", () => {
  it("keeps missing scheduled intervals empty and uses the latest real sample per slot", () => {
    const generatedAt = "2026-10-03T12:55:00.000Z";
    const slots = buildHeartbeatSlots([
      { checkedAt: "2026-10-03T12:41:00.000Z", status: "OPERATIONAL", latencyMs: 68 },
      { checkedAt: "2026-10-03T12:42:00.000Z", status: "OPERATIONAL", latencyMs: 42 },
    ], generatedAt);

    expect(slots).toHaveLength(144);
    expect(slots.filter((slot) => slot.latencyMs !== null)).toHaveLength(1);
    expect(slots.at(-1)?.latencyMs).toBe(42);
    expect(slots.at(-2)?.latencyMs).toBeNull();
  });

  it("does not plot a future or invalid measurement", () => {
    const slots = buildHeartbeatSlots([
      { checkedAt: "2026-10-03T13:00:00.000Z", status: "OPERATIONAL", latencyMs: 20 },
      { checkedAt: "bad-date", status: "OPERATIONAL", latencyMs: 20 },
    ], "2026-10-03T12:55:00.000Z");

    expect(slots.every((slot) => slot.latencyMs === null)).toBe(true);
  });
});
