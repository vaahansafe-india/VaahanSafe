"use client";

import * as React from "react";
import { arc } from "d3-shape";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PublicSystemStatusDto } from "@vaahansafe/status-core";

type Sample = NonNullable<PublicSystemStatusDto["databaseHeartbeat"]>["samples"][number];
const INTERVAL_MS = 10 * 60 * 1000;
const SLOT_COUNT = 144;

interface Slot {
  timestamp: number;
  label: string;
  latencyMs: number | null;
  status: Sample["status"] | null;
}

const timeLabel = (timestamp: number) => new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
}).format(timestamp);

export function buildHeartbeatSlots(samples: Sample[], generatedAt: string): Slot[] {
  const now = Date.parse(generatedAt);
  if (!Number.isFinite(now)) return [];
  const firstSlot = Math.floor(now / INTERVAL_MS) * INTERVAL_MS - SLOT_COUNT * INTERVAL_MS;
  const latestBySlot = new Map<number, Sample>();

  for (const sample of samples) {
    const checkedAt = Date.parse(sample.checkedAt);
    if (!Number.isFinite(checkedAt) || !Number.isFinite(sample.latencyMs) || sample.latencyMs < 0) continue;
    const slot = Math.floor(checkedAt / INTERVAL_MS) * INTERVAL_MS;
    if (slot < firstSlot || slot >= firstSlot + SLOT_COUNT * INTERVAL_MS) continue;
    const previous = latestBySlot.get(slot);
    if (!previous || Date.parse(previous.checkedAt) < checkedAt) latestBySlot.set(slot, sample);
  }

  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const timestamp = firstSlot + index * INTERVAL_MS;
    const sample = latestBySlot.get(timestamp);
    return {
      timestamp,
      label: timeLabel(timestamp),
      latencyMs: sample?.latencyMs ?? null,
      status: sample?.status ?? null,
    };
  });
}

function LatencyTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Slot }> }) {
  const slot = payload?.[0]?.payload;
  if (!active || !slot) return null;
  return (
    <div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] px-3 py-2 text-xs text-[#282720] dark:border-[#4b463d] dark:bg-[#292620] dark:text-[#f6f1e9]">
      <div className="font-mono text-[10px] text-[#8c4e39]">{slot.label} IST</div>
      <div className="mt-1 font-semibold">{slot.latencyMs === null ? "No recorded run" : `${slot.latencyMs} ms · ${slot.status?.toLowerCase()}`}</div>
    </div>
  );
}

function CadenceWheel({ slots, observedCount, dataReadable }: { slots: Slot[]; observedCount: number; dataReadable: boolean }) {
  const tau = 2 * Math.PI;
  const hourGroups = Array.from({ length: 24 }, (_, hour) => {
    const group = slots.slice(hour * 6, hour * 6 + 6);
    return { hour, label: group[0]?.label ?? "", count: group.filter((slot) => slot.status !== null).length };
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg viewBox="0 0 224 224" className="h-[220px] w-[220px] max-w-full" role="img" aria-label={dataReadable ? `${observedCount} of 144 scheduled ten-minute checks were recorded in the last 24 hours` : "Scheduled check history could not be read"}>
        <g transform="translate(112,112)">
          {hourGroups.map((group) => {
            const startAngle = group.hour * tau / 24 + 0.022;
            const endAngle = (group.hour + 1) * tau / 24 - 0.022;
            const background = arc()({ innerRadius: 62, outerRadius: 94, startAngle, endAngle });
            const observed = group.count > 0
              ? arc()({ innerRadius: 62, outerRadius: 62 + 32 * group.count / 6, startAngle, endAngle })
              : null;
            return (
              <g key={group.hour}>
                <title>{dataReadable ? `${group.label} IST · ${group.count} of 6 checks recorded` : "Recorded checks unavailable"}</title>
                <path d={background ?? ""} fill="#e8e0d4" className="dark:fill-[#38352f]" />
                {observed && <path d={observed} fill={group.count === 6 ? "#3f7462" : "#b2674a"} />}
              </g>
            );
          })}
          <text y="-5" textAnchor="middle" className="fill-[#282720] dark:fill-[#f6f1e9]" style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 40 }}>{dataReadable ? observedCount : "—"}</text>
          <text y="15" textAnchor="middle" className="fill-[#766e62] dark:fill-[#b2aba0]" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, letterSpacing: 1 }}>OF 144 RUNS</text>
        </g>
      </svg>
      <div className="flex flex-wrap justify-center gap-4 font-mono text-[10px] text-[#756e63] dark:text-[#b2aba0]">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[#3f7462]" />Six recorded</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[#b2674a]" />Partial hour</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[#e8e0d4] dark:bg-[#38352f]" />No record</span>
      </div>
    </div>
  );
}

export function HeartbeatCharts({ samples, generatedAt, dataReadable }: { samples: Sample[]; generatedAt: string; dataReadable: boolean }) {
  const slots = React.useMemo(() => buildHeartbeatSlots(samples, generatedAt), [samples, generatedAt]);
  const recorded = slots.filter((slot) => slot.status !== null);
  const observedCount = recorded.length;
  const latencyValues = recorded.map((slot) => slot.latencyMs).filter((value): value is number => value !== null).sort((a, b) => a - b);
  const median = latencyValues.length
    ? Math.round((latencyValues[Math.floor((latencyValues.length - 1) / 2)]! + latencyValues[Math.floor(latencyValues.length / 2)]!) / 2)
    : null;

  return (
    <section aria-labelledby="heartbeat-charts-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#d8d0c5] pb-4 dark:border-[#37342e]">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9583e]">Recorded telemetry / 24 hours</p>
          <h2 id="heartbeat-charts-heading" className="mt-1 font-serif text-2xl text-[#252320] dark:text-[#f6f1e9]">The heartbeat record</h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-[#756e63] dark:text-[#b2aba0]">Only completed Cloudflare checks recorded by Supabase appear here. Blank intervals have no recorded result.</p>
      </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)]">
          <article className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 sm:p-6 dark:border-[#37342e] dark:bg-[#211f1b]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9583e]">01 / Response trace</p><h3 className="mt-1 font-serif text-xl text-[#252320] dark:text-[#f6f1e9]">Database round trips</h3></div>
              <p className="font-mono text-xs text-[#756e63] dark:text-[#b2aba0]">Median <strong className="text-[#252320] dark:text-[#f6f1e9]">{median === null ? "—" : `${median} ms`}</strong></p>
            </div>
            <p className="mt-2 text-xs text-[#756e63] dark:text-[#b2aba0]">Each mark is a completed scheduled database read. Gaps show unrecorded intervals.</p>
            <div className="relative mt-6 h-[230px] w-full" aria-hidden="true">
              {observedCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slots} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e9e2d7" strokeDasharray="2 5" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval={35} fontSize={10} tick={{ fill: "#82786d", fontFamily: "JetBrains Mono, monospace" }} />
                  <YAxis tickLine={false} axisLine={false} width={45} fontSize={10} tick={{ fill: "#82786d", fontFamily: "JetBrains Mono, monospace" }} unit="ms" domain={[0, "auto"]} />
                  <Tooltip content={<LatencyTooltip />} cursor={{ stroke: "#ad674c", strokeDasharray: "2 4" }} />
                  <Line dataKey="latencyMs" type="linear" stroke="#a9583e" strokeWidth={2} dot={{ r: 2, fill: "#a9583e", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#a9583e", stroke: "#fffefa", strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center border-b border-l border-[#d8d0c5] bg-[linear-gradient(to_bottom,transparent_24%,#eee9df_25%,transparent_26%,transparent_49%,#eee9df_50%,transparent_51%,transparent_74%,#eee9df_75%,transparent_76%)] px-8 text-center dark:border-[#4b463d] dark:bg-none">
                  <span className="max-w-xs bg-[#fffefa] px-3 py-2 text-xs leading-relaxed text-[#756e63] dark:bg-[#211f1b] dark:text-[#b2aba0]">{dataReadable ? "No scheduled checks were recorded in this window." : "Recorded latency is unavailable until the database read succeeds."}</span>
                </div>
              )}
            </div>
          </article>

          <article className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 sm:p-6 dark:border-[#37342e] dark:bg-[#211f1b]">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9583e]">02 / Schedule wheel</p>
            <h3 className="mt-1 font-serif text-xl text-[#252320] dark:text-[#f6f1e9]">Run cadence</h3>
            <p className="mt-2 text-xs text-[#756e63] dark:text-[#b2aba0]">Each arc represents one hour. Arc depth shows how many of six checks were recorded.</p>
            <div className="mt-3"><CadenceWheel slots={slots} observedCount={observedCount} dataReadable={dataReadable} /></div>
          </article>
        </div>
      {dataReadable && <p className="sr-only">In the previous 24 completed hours, {observedCount} of 144 scheduled ten-minute checks have a recorded result. {median === null ? "No round trip time was recorded." : `Median recorded database round trip: ${median} milliseconds.`}</p>}
    </section>
  );
}
