"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { scaleLinear, scalePoint, scaleBand, scaleTime } from "d3-scale";
import type { AnalyticsData, VehicleUsage } from "./types";
import { timeLabel } from "./Charts";
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
function PointDetail({ text }: { text: string }) {
  return (
    <output className="analytics-mark-detail" aria-live="polite">
      {text || "Hover, focus or tap a mark to inspect its recorded activity."}
    </output>
  );
}
export function Rhythm({ cells }: { cells: AnalyticsData["scans"]["rhythm"] }) {
  const { ref, width } = useWidth(),
    [tip, setTip] = useState("");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = useMemo(
    () => new Map(cells.map((c) => [`${c.day}:${c.hour}`, c.count])),
    [cells],
  );
  const max = Math.max(1, ...cells.map((c) => c.count));
  const color = useMemo(
    () => scaleLinear<string>().domain([0, max]).range(["#f0ebe1", "#b15f43"]),
    [max],
  );
  const x = useMemo(
    () =>
      scaleBand<number>()
        .domain(Array.from({ length: 24 }, (_, i) => i))
        .range([42, Math.max(43, width - 8)])
        .padding(0.16),
    [width],
  );
  return (
    <div ref={ref}>
      <div className="analytics-desktop-geometry">
        <svg
          width="100%"
          height={290}
          role="group"
          aria-label="Scan counts by weekday and hour in India time"
        >
          {days.map((day, d) => (
            <g key={day}>
              <text x={0} y={42 + d * 33} fontSize={11} fill="currentColor">
                {day}
              </text>
              {Array.from({ length: 24 }, (_, h) => {
                const n = map.get(`${d}:${h}`) || 0,
                  text = `${day}, ${String(h).padStart(2, "0")}:00–${String((h + 1) % 24).padStart(2, "0")}:00 IST · ${n} scans`;
                return (
                  <rect
                    className="analytics-svg-button"
                    key={h}
                    x={x(h)}
                    y={22 + d * 33}
                    width={x.bandwidth()}
                    height={28}
                    rx={2}
                    fill={color(n)}
                    stroke="hsl(var(--border))"
                    tabIndex={0}
                    role="button"
                    aria-label={text}
                    onMouseEnter={() => setTip(text)}
                    onFocus={() => setTip(text)}
                    onClick={() => setTip(text)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setTip(text);
                    }}
                  >
                    <title>{text}</title>
                  </rect>
                );
              })}
            </g>
          ))}
          {[0, 4, 8, 12, 16, 20].map((h) => (
            <text key={h} x={x(h)} y={272} fontSize={10} fill="currentColor">
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
      </div>
      <div className="analytics-mobile-geometry">
        {days.map((day, d) => {
          const total = cells
            .filter((c) => c.day === d)
            .reduce((s, c) => s + c.count, 0);
          return (
            <button
              key={day}
              className="analytics-rhythm-day"
              onClick={() =>
                setTip(
                  `${day}: ${total} scans. ` +
                    cells
                      .filter((c) => c.day === d)
                      .map((c) => `${c.hour}:00 · ${c.count}`)
                      .join("; "),
                )
              }
            >
              <span>{day}</span>
              <span className="h-3 flex-1 rounded-sm bg-muted">
                <span
                  className="block h-3 rounded-sm bg-[#cc785c]"
                  style={{
                    width: `${(total / Math.max(1, ...days.map((_, i) => cells.filter((c) => c.day === i).reduce((s, c) => s + c.count, 0)))) * 100}%`,
                  }}
                />
              </span>
              <strong>{total}</strong>
            </button>
          );
        })}
      </div>
      <PointDetail text={tip} />
    </div>
  );
}
export function Ribbon({
  vehicles,
  events,
  from,
  to,
}: {
  vehicles: VehicleUsage[];
  events: AnalyticsData["vehicles"]["ribbon"];
  from: string;
  to: string;
}) {
  const { ref, width } = useWidth(),
    [tip, setTip] = useState("");
  const shown = vehicles.slice(0, 12),
    height = Math.max(160, shown.length * 48 + 55);
  const x = useMemo(
    () =>
      scaleTime()
        .domain([
          new Date(from + "T00:00:00+05:30"),
          new Date(to + "T23:59:59+05:30"),
        ])
        .range([110, Math.max(112, width - 15)])
        .clamp(true),
    [from, to, width],
  );
  const y = useMemo(
    () =>
      scalePoint<string>()
        .domain(shown.map((v) => v.id))
        .range([28, height - 45]),
    [shown, height],
  );
  return (
    <div ref={ref}>
      <div className="analytics-desktop-geometry">
        <svg
          height={height}
          width="100%"
          role="group"
          aria-label="Time lanes of scan, document and activation activity"
        >
          {shown.map((v) => (
            <g key={v.id}>
              <text x={0} y={y(v.id)! + 4} fontSize={11} fill="currentColor">
                {v.label}
              </text>
              <line
                x1={110}
                x2={width - 15}
                y1={y(v.id)}
                y2={y(v.id)}
                stroke="hsl(var(--border))"
              />
            </g>
          ))}
          {events
            .filter((e) => y(e.vehicle) !== undefined)
            .map((e) => {
              const cx = x(new Date(e.timestamp)),
                cy = y(e.vehicle)!,
                text = `${vehicles.find((v) => v.id === e.vehicle)?.label} · ${timeLabel(e.timestamp)} · ${e.scans} scans · ${e.documents} document events · ${e.activations} activations`;
              return (
                <g
                  key={e.vehicle + e.timestamp}
                  tabIndex={0}
                  role="button"
                  aria-label={text}
                  className="analytics-svg-button"
                  onFocus={() => setTip(text)}
                  onMouseEnter={() => setTip(text)}
                  onClick={() => setTip(text)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") setTip(text);
                  }}
                >
                  <title>{text}</title>
                  <rect
                    x={cx - 11}
                    y={cy - 18}
                    width={22}
                    height={36}
                    fill="transparent"
                  />
                  {e.scans > 0 && (
                    <circle
                      cx={cx}
                      cy={cy - 6}
                      r={Math.min(9, 3 + Math.sqrt(e.scans))}
                      fill="#cc785c"
                    />
                  )}
                  {e.documents > 0 && (
                    <rect
                      x={cx - 4}
                      y={cy + 5}
                      width={8}
                      height={8}
                      fill="#62785c"
                    />
                  )}
                  {e.activations > 0 && (
                    <path
                      d={`M${cx} ${cy - 18}l5 5 -5 5 -5 -5z`}
                      fill="currentColor"
                    />
                  )}
                </g>
              );
            })}
          <text x={110} y={height - 10} fontSize={10} fill="currentColor">
            {from}
          </text>
          <text
            x={width - 15}
            y={height - 10}
            textAnchor="end"
            fontSize={10}
            fill="currentColor"
          >
            {to}
          </text>
        </svg>
      </div>
      <div className="analytics-mobile-geometry space-y-3">
        {shown.map((v) => (
          <div className="analytics-vehicle-node" key={v.id}>
            <strong>{v.label}</strong>
            {events
              .filter((e) => e.vehicle === v.id)
              .slice(-8)
              .map((e) => (
                <button
                  className="min-h-11 text-left text-xs"
                  key={e.timestamp}
                  onClick={() =>
                    setTip(
                      `${timeLabel(e.timestamp)} · ${e.scans} scans · ${e.documents} document events`,
                    )
                  }
                >
                  {timeLabel(e.timestamp)} · ● {e.scans} · ■ {e.documents}
                </button>
              ))}
          </div>
        ))}
      </div>
      <p className="analytics-legend">
        ● Scans · ■ Document events · ◆ QR activation · Latest 400 time buckets
      </p>
      <PointDetail text={tip} />
    </div>
  );
}
export function Expiry({
  documents,
}: {
  documents: AnalyticsData["documents"]["expiry"];
}) {
  const { ref, width } = useWidth();
  const now = new Date();
  const max = Math.max(
    30,
    ...documents.map(
      (d) =>
        (Date.parse(d.date + "T00:00:00+05:30") - now.getTime()) / 86400000,
    ),
  );
  const scale = useMemo(
    () =>
      scaleLinear()
        .domain([0, max])
        .range([0, Math.max(0, width - 30)])
        .clamp(true),
    [max, width],
  );
  return (
    <div ref={ref} className="space-y-4">
      {documents.map((d) => {
        const days = Math.ceil(
          (Date.parse(d.date + "T00:00:00+05:30") - now.getTime()) / 86400000,
        );
        return (
          <Link
            className="block min-h-11 text-sm"
            key={d.id}
            href={`/documents/${d.id}`}
          >
            <span className="flex flex-wrap justify-between gap-2">
              <strong>{d.title}</strong>
              <span
                className={
                  days < 0
                    ? "text-destructive"
                    : days <= 30
                      ? "text-[#b15f43]"
                      : "text-muted-foreground"
                }
              >
                {days < 0 ? `Expired · ${d.date}` : `${d.date} · ${days} days`}
              </span>
            </span>
            <svg width="100%" height={24} aria-hidden="true">
              <line
                x1={0}
                x2={scale(Math.max(0, days))}
                y1={12}
                y2={12}
                stroke="hsl(var(--border))"
              />
              <circle
                cx={scale(Math.max(0, days)) + 6}
                cy={12}
                r={5}
                fill={days <= 30 ? "#cc785c" : "#62785c"}
              />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
