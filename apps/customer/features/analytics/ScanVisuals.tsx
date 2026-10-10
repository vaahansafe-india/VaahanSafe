"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { scaleLinear, scaleSqrt, scaleBand, scaleRadial } from "d3-scale";
import { arc, linkHorizontal } from "d3-shape";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@/components/ui/button";
import type { AnalyticsData, ScanFlowRow } from "./types";
import { scanColors, outcomeLabel, INDIA_REGIONS } from "./scan-model";
import { INDIA_GEO_ASSET } from "./geo-asset";
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const o = new ResizeObserver(([e]) => {
      if (e) setWidth(e.contentRect.width);
    });
    o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, width };
}
function Detail({
  text,
  onClear,
}: {
  text: string;
  onClear?: () => void;
}) {
  return (
    <div className="analytics-mark-detail-wrap mt-3 pt-2.5 border-t border-border/40">
      <div className="analytics-mark-detail-card flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/25 border border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <VaahanIcon
            name="info"
            size={14}
            className="shrink-0 text-muted-foreground/70"
          />
          <output
            className="analytics-mark-detail-text truncate sm:whitespace-normal font-medium text-foreground/90"
            aria-live="polite"
            title={
              text ||
              "Hover or tap any mark to inspect scan details and filter activity."
            }
          >
            {text ||
              "Hover or tap any mark to inspect scan details and filter activity."}
          </output>
        </div>
        {text && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] shrink-0 text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
function keyClick(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}
export function ScanFlowJourney({
  data,
  select,
}: {
  data: AnalyticsData["scan-flow"];
  select: (kind: "vehicle" | "qr" | "outcome", value: string) => void;
}) {
  const { ref, width } = useWidth();
  const [tip, setTip] = useState("");
  const [highlight, setHighlight] = useState<{
    kind: "vehicle" | "qr" | "outcome";
    value: string;
  } | null>(null);
  const activeHighlight =
    highlight &&
    data.rows.some((row) => row[highlight.kind] === highlight.value)
      ? highlight
      : null;
  const matches = (row: ScanFlowRow) =>
    !activeHighlight || row[activeHighlight.kind] === activeHighlight.value;
  const inspectNode = (
    kind: "vehicle" | "qr" | "outcome",
    value: string,
    text: string,
  ) => {
    setHighlight({ kind, value });
    setTip(text);
  };
  const layout = useMemo(() => {
    const vehicles = Array.from(
      new Map(
        data.rows.map((r) => [
          r.vehicle,
          {
            id: r.vehicle,
            label: r.name,
            detail: r.vehicleLabel,
            count: data.rows
              .filter((x) => x.vehicle === r.vehicle)
              .reduce((s, x) => s + x.count, 0),
          },
        ]),
      ).values(),
    );
    const qrs = Array.from(
      new Map(
        data.rows.map((r) => [
          r.qr,
          {
            id: r.qr,
            label: r.qrLabel,
            detail: "QR identity",
            count: data.rows
              .filter((x) => x.qr === r.qr)
              .reduce((s, x) => s + x.count, 0),
          },
        ]),
      ).values(),
    );
    const outcomes = ["RESOLVED_ACTIVE", "RESOLVED_INACTIVE", "OTHER"].map(
      (id) => ({
        id,
        label: outcomeLabel(id),
        detail: "Resolver outcome",
        count: data.rows
          .filter((x) => x.outcome === id)
          .reduce((s, x) => s + x.count, 0),
      }),
    );
    const height = Math.max(
      320,
      Math.max(vehicles.length, qrs.length) * 72 + 40,
    );
    const positions = (nodes: typeof vehicles) =>
      nodes.map((n, i) => ({
        ...n,
        y:
          nodes.length === 1
            ? height / 2
            : 60 + i * ((height - 100) / (nodes.length - 1)),
      }));
    return {
      height,
      vehicles: positions(vehicles),
      qrs: positions(qrs),
      outcomes: positions(outcomes),
    };
  }, [data.rows]);
  const w = Math.max(width, 610),
    nodeW = Math.min(174, w * 0.27),
    middle = w * 0.42,
    right = w - nodeW,
    band = scaleLinear()
      .domain([0, Math.max(1, data.total)])
      .range([0, 44]);
  const link = linkHorizontal<
    { source: [number, number]; target: [number, number] },
    [number, number]
  >()
    .x((d) => d[0])
    .y((d) => d[1]);
  const inspect = (r: ScanFlowRow) =>
    `${r.name} (${r.vehicleLabel}) → ${r.qrLabel} → ${outcomeLabel(r.outcome)} · ${r.count} scans · ${data.total ? ((100 * r.count) / data.total).toFixed(1) : 0}% of selected scans`;
  return (
    <div
      ref={ref}
      onMouseLeave={() => setHighlight(null)}
      onBlur={() => setHighlight(null)}
    >
      <div className="scan-flow-desktop">
        <svg
          width="100%"
          height={layout.height}
          viewBox={`0 0 ${w} ${layout.height}`}
          role="group"
          aria-label="Recorded flow from vehicle through QR identity to resolver outcome"
        >
          <text x={0} y={15} className="scan-flow-heading">
            VEHICLE
          </text>
          <text x={middle} y={15} className="scan-flow-heading">
            QR IDENTITY
          </text>
          <text x={right} y={15} className="scan-flow-heading">
            RESOLVER OUTCOME
          </text>
          {layout.qrs.map((q) => {
            const row = data.rows.find((r) => r.qr === q.id)!;
            const vehicle = layout.vehicles.find((v) => v.id === row.vehicle)!;
            return (
              <path
                key={q.id}
                d={
                  link({ source: [nodeW, vehicle.y], target: [middle, q.y] }) ||
                  ""
                }
                fill="none"
                stroke={scanColors[layout.vehicles.indexOf(vehicle) % 4]}
                strokeWidth={band(q.count)}
                opacity={
                  data.rows.some((r) => r.qr === q.id && matches(r))
                    ? 0.32
                    : 0.04
                }
              >
                <title>
                  {vehicle.label} → {q.label} · {q.count} scans
                </title>
              </path>
            );
          })}
          {data.rows.map((r, i) => {
            const b = layout.qrs.find((n) => n.id === r.qr)!,
              c = layout.outcomes.find((n) => n.id === r.outcome)!;
            const color =
              scanColors[
                r.outcome === "RESOLVED_ACTIVE"
                  ? 0
                  : r.outcome === "RESOLVED_INACTIVE"
                    ? 1
                    : 2
              ];
            return (
              <g key={i} onMouseEnter={() => setTip(inspect(r))}>
                <path
                  d={
                    link({
                      source: [middle + 34, b.y],
                      target: [right, c.y],
                    }) || ""
                  }
                  fill="none"
                  stroke={color}
                  strokeWidth={band(r.count)}
                  opacity={matches(r) ? 0.38 : 0.04}
                >
                  <title>{inspect(r)}</title>
                </path>
              </g>
            );
          })}
          {layout.vehicles.map((n, i) => (
            <g
              key={n.id}
              className="analytics-svg-button"
              tabIndex={0}
              role="button"
              aria-label={`${n.label}, ${n.detail}, ${n.count} scans. Filter vehicle`}
              onFocus={() =>
                inspectNode(
                  "vehicle",
                  n.id,
                  `${n.label} · ${n.detail} · ${n.count} scans`,
                )
              }
              onMouseEnter={() =>
                inspectNode(
                  "vehicle",
                  n.id,
                  `${n.label} · ${n.detail} · ${n.count} scans`,
                )
              }
              opacity={
                data.rows.some((r) => r.vehicle === n.id && matches(r))
                  ? 1
                  : 0.35
              }
              onClick={() => n.id && select("vehicle", n.id)}
              onKeyDown={(e) =>
                keyClick(e, () => n.id && select("vehicle", n.id))
              }
            >
              <rect
                x={0}
                y={n.y - 27}
                width={nodeW}
                height={54}
                rx={4}
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
              />
              <rect
                y={n.y - 27}
                width={5}
                height={54}
                rx={2}
                fill={scanColors[i % 4]}
              />
              <foreignObject x={12} y={n.y - 14} width={28} height={28}>
                <VaahanIcon name="car" size={23} />
              </foreignObject>
              <text x={48} y={n.y - 9} fontSize={11}>
                {n.label.slice(0, 21)}
              </text>
              <text
                x={48}
                y={n.y + 7}
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
              >
                {n.detail}
              </text>
              <text x={48} y={n.y + 21} fontSize={10}>
                {n.count} scans
              </text>
            </g>
          ))}
          {layout.qrs.map((n) => (
            <g
              key={n.id}
              className="analytics-svg-button"
              tabIndex={0}
              role="button"
              aria-label={`${n.label}, ${n.count} scans. Filter QR identity`}
              onFocus={() =>
                inspectNode("qr", n.id, `${n.label} · ${n.count} scans`)
              }
              onMouseEnter={() =>
                inspectNode("qr", n.id, `${n.label} · ${n.count} scans`)
              }
              opacity={
                data.rows.some((r) => r.qr === n.id && matches(r)) ? 1 : 0.35
              }
              onClick={() => n.id && select("qr", n.id)}
              onKeyDown={(e) => keyClick(e, () => n.id && select("qr", n.id))}
            >
              <circle cx={middle + 17} cy={n.y} r={20} fill="#ede9df" />
              <foreignObject x={middle + 5} y={n.y - 12} width={24} height={24}>
                <VaahanIcon name="qr-code" size={22} />
              </foreignObject>
              <text x={middle + 44} y={n.y - 2} fontSize={10}>
                {n.label.slice(0, 17)}
              </text>
              <text
                x={middle + 44}
                y={n.y + 14}
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
              >
                {n.count} scans
              </text>
            </g>
          ))}
          {layout.outcomes.map((n, i) => (
            <g
              key={n.id}
              className="analytics-svg-button"
              role="button"
              tabIndex={0}
              aria-label={`${n.label}, ${n.count} scans. Filter outcome`}
              onFocus={() =>
                inspectNode("outcome", n.id, `${n.label} · ${n.count} scans`)
              }
              onMouseEnter={() =>
                inspectNode("outcome", n.id, `${n.label} · ${n.count} scans`)
              }
              opacity={
                data.rows.some((r) => r.outcome === n.id && matches(r))
                  ? 1
                  : 0.35
              }
              onClick={() => select("outcome", n.id)}
              onKeyDown={(e) => keyClick(e, () => select("outcome", n.id))}
            >
              <rect
                x={right}
                y={n.y - 29}
                width={nodeW}
                height={58}
                rx={4}
                fill={scanColors[i]}
                fillOpacity={0.09}
              />
              <foreignObject x={right + 12} y={n.y - 12} width={25} height={25}>
                <VaahanIcon
                  name={
                    i === 0 ? "shield-check" : i === 1 ? "lock" : "shield-alert"
                  }
                  size={22}
                />
              </foreignObject>
              <text x={right + 44} y={n.y - 9} fontSize={10}>
                {n.label}
              </text>
              <text x={right + 44} y={n.y + 15} fontSize={20}>
                {n.count}
              </text>
              <text x={w - 8} y={n.y + 15} textAnchor="end" fontSize={10}>
                {data.total ? Math.round((n.count / data.total) * 100) : 0}%
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="scan-flow-mobile">
        {layout.qrs.map((q) => (
          <div key={q.id} className="scan-mobile-journey">
            <button onClick={() => q.id && select("qr", q.id)}>
              <VaahanIcon name="qr-code" size={22} />
              <span>
                {data.rows.find((r) => r.qr === q.id)?.name}
                <small>
                  {q.label} · {q.count} scans
                </small>
              </span>
            </button>
            {data.rows
              .filter((r) => r.qr === q.id)
              .map((r) => (
                <button
                  key={r.outcome}
                  onClick={() => select("outcome", r.outcome)}
                >
                  {outcomeLabel(r.outcome)}
                  <strong>{r.count}</strong>
                </button>
              ))}
          </div>
        ))}
      </div>
      <Detail text={tip} />
    </div>
  );
}
export function IndiaScanMap({
  data,
  select,
}: {
  data: AnalyticsData["scan-geography"];
  select: (state: string) => void;
}) {
  const { ref, width } = useWidth();
  const [geo, setGeo] = useState<FeatureCollection<
      Geometry,
      { code: string; name: string }
    > | null>(null),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0),
    [tip, setTip] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setError(false);
    fetch(INDIA_GEO_ASSET, { signal: c.signal, cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (d.type !== "FeatureCollection" || d.features?.length !== 36)
          throw Error();
        setGeo(d);
      })
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      });
    return () => c.abort();
  }, [attempt]);
  const size = Math.max(180, width * 0.49),
    height = 310;
  const projection = useMemo(
    () =>
      geo
        ? geoMercator().fitExtent(
            [
              [8, 8],
              [size - 8, height - 8],
            ],
            geo,
          )
        : null,
    [geo, size],
  );
  const path = useMemo(
    () => (projection ? geoPath(projection) : null),
    [projection],
  );
  const counts = new Map(data.states.map((s) => [s.code, s]));
  const max = Math.max(1, ...data.states.map((s) => s.count));
  const color = scaleLinear<string>()
    .domain([0, max])
    .range(["#eeeee8", "#ba6148"]);
  const radius = scaleSqrt().domain([0, max]).range([0, 13]);
  const inspect = (code: string) => {
    const r = counts.get(code);
    return `${INDIA_REGIONS[code] || code} · ${r?.count || 0} scans · ${data.total ? (((r?.count || 0) / data.total) * 100).toFixed(1) : 0}% · ${r?.successful || 0} active safety views${r?.topCity ? " · Top recorded city: " + r.topCity : ""}`;
  };
  return (
    <div ref={ref}>
      <div className="scan-map-layout">
        <div className="scan-map-drawing">
          {error ? (
            <div role="alert" className="analytics-empty">
              The map could not be loaded.
              <Button
                variant="outline"
                onClick={() => setAttempt((v) => v + 1)}
              >
                Retry map
              </Button>
            </div>
          ) : !geo ? (
            <div className="scan-map-skeleton" aria-label="Loading India map" />
          ) : (
            path && (
              <svg
                width="100%"
                height={height}
                viewBox={`0 0 ${size} ${height}`}
                role="group"
                aria-label="State aggregates on a simplified historical India boundary map"
              >
                {geo.features.map((f, i) => {
                  const code = f.properties.code;
                  const unsupported = code === "IN-JK";
                  const r = counts.get(code);
                  const centroid = path.centroid(f);
                  const text = unsupported
                    ? "Historical Jammu & Kashmir boundary. Current JK and Ladakh counts appear in the ranking."
                    : inspect(code);
                  return (
                    <g key={i}>
                      <path
                        d={path(f) || ""}
                        fill={unsupported ? "#eeeee8" : color(r?.count || 0)}
                        fillOpacity={0.55}
                        stroke="#bdbfb5"
                        strokeWidth={0.5}
                        role="button"
                        tabIndex={0}
                        className="analytics-svg-button"
                        aria-label={text}
                        onMouseEnter={() => setTip(text)}
                        onFocus={() => setTip(text)}
                        onClick={() => !unsupported && select(code)}
                        onKeyDown={(e) =>
                          keyClick(e, () => !unsupported && select(code))
                        }
                      >
                        <title>{text}</title>
                      </path>
                      {!unsupported &&
                        !!r?.count &&
                        Number.isFinite(centroid[0]) &&
                        geo.features.findIndex(
                          (x) => x.properties.code === code,
                        ) === i && (
                          <circle
                            cx={centroid[0]}
                            cy={centroid[1]}
                            r={radius(r.count)}
                            fill="#b76047"
                            fillOpacity={0.7}
                            stroke="#fffaf1"
                            strokeWidth={2}
                            pointerEvents="none"
                          />
                        )}
                    </g>
                  );
                })}
              </svg>
            )
          )}
        </div>
        <div className="scan-region-ranking">
          {data.states.slice(0, 6).map((r, i) => (
            <button
              key={r.code}
              onClick={() => r.code !== "UNKNOWN" && select(r.code)}
              onMouseEnter={() => setTip(inspect(r.code))}
              onFocus={() => setTip(inspect(r.code))}
            >
              <span>{INDIA_REGIONS[r.code] || r.label}</span>
              <span className="scan-ranking-track">
                <i
                  style={{
                    width: `${(r.count / max) * 100}%`,
                    background: scanColors[i % 4],
                  }}
                />
              </span>
              <strong>{r.count}</strong>
              <small>
                {data.total ? Math.round((r.count / data.total) * 100) : 0}%
              </small>
            </button>
          ))}
          <p>
            {data.located} of {data.total} scans matched to a state.
          </p>
          <div className="scan-map-scale">
            <span>Low scans</span>
            <i />
            <span>High scans</span>
          </div>
        </div>
      </div>
      <Detail text={tip} />
      <p className="scan-map-attribution">
        <a
          href="https://projects.datameet.org/maps/states/"
          target="_blank"
          rel="noreferrer"
        >
          DataMeet Community Maps
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/2.5/in/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 2.5 India
        </a>{" "}
        · Simplified historical boundaries. Current JK/Ladakh counts use the
        ranking. Locations are coarse scan estimates, not car GPS.
      </p>
    </div>
  );
}
export function ScanTimeHeatmap({
  cells,
  select,
}: {
  cells: AnalyticsData["scan-heatmap"]["cells"];
  select: (day: number, hour: number) => void;
}) {
  const { ref, width } = useWidth();
  const [tip, setTip] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const days = useMemo(
    () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    []
  );
  const map = useMemo(
    () => new Map(cells.map((c) => [`${c.day}:${c.hour}`, c])),
    [cells]
  );
  const max = Math.max(1, ...cells.map((c) => c.count));
  const drawingWidth = Math.max(620, width);
  const x = scaleBand<number>()
    .domain(Array.from({ length: 24 }, (_, i) => i))
    .range([32, drawingWidth - 8])
    .padding(0.12);
  const color = scaleLinear<string>()
    .domain([0, max])
    .range(["#edf0e7", "#66876c"]);

  const dayStats = useMemo(() => {
    return days.map((day, d) => {
      const dayCells = cells.filter((c) => c.day === d);
      const total = dayCells.reduce((s, c) => s + c.count, 0);
      const successful = dayCells.reduce((s, c) => s + c.successful, 0);

      let peakHour = 0;
      let peakCount = 0;
      for (let h = 0; h < 24; h++) {
        const cnt = map.get(`${d}:${h}`)?.count || 0;
        if (cnt > peakCount) {
          peakCount = cnt;
          peakHour = h;
        }
      }
      return {
        day,
        d,
        total,
        successful,
        peakHour,
        peakCount,
      };
    });
  }, [cells, days, map]);

  const maxDayTotal = useMemo(() => {
    return Math.max(1, ...dayStats.map((s) => s.total));
  }, [dayStats]);

  return (
    <div ref={ref} className="scan-heatmap-container">
      {/* Top Controls: View Switcher & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3 border-b border-border/40 text-xs">
        <div className="inline-flex rounded-lg p-0.5 bg-muted/60 border border-border/50">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={viewMode === "grid"}
          >
            <VaahanIcon name="grid" size={13} />
            <span>Heatmap Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === "list"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={viewMode === "list"}
          >
            <VaahanIcon name="list" size={13} />
            <span>By Weekday</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>0</span>
          <div
            className="h-2 w-12 rounded-full border border-border/40 shadow-xs"
            style={{
              background: "linear-gradient(to right, #edf0e7, #66876c)",
            }}
            aria-hidden="true"
          />
          <span>{max} scans</span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="scan-heatmap-scroll overflow-x-auto -webkit-overflow-scrolling-touch pb-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 px-1">
            <span className="flex items-center gap-1.5">
              <VaahanIcon name="chevron-left" size={12} className="shrink-0" />
              <span>Scroll horizontally for 24 hours</span>
              <VaahanIcon name="chevron-right" size={12} className="shrink-0" />
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/70">
              IST (UTC+5:30)
            </span>
          </div>
          <svg
            width="100%"
            height={198}
            viewBox={`0 0 ${drawingWidth} 198`}
            style={{ minWidth: "600px" }}
            role="group"
            aria-label="Scan volume by weekday and hour in India time"
          >
            {days.map((day, d) => (
              <g key={day}>
                <text
                  x={2}
                  y={22 + d * 23}
                  fontSize={10}
                  fontWeight={500}
                  fill="currentColor"
                >
                  {day}
                </text>
                {Array.from({ length: 24 }, (_, h) => {
                  const c = map.get(`${d}:${h}`);
                  const cnt = c?.count || 0;
                  const succ = c?.successful || 0;
                  const text = `${day} ${h}:00–${h + 1}:00 IST · ${cnt} scans · ${succ} active safety views`;
                  return (
                    <rect
                      key={h}
                      x={x(h)}
                      y={9 + d * 23}
                      width={x.bandwidth()}
                      height={20}
                      rx={2}
                      fill={color(cnt)}
                      tabIndex={0}
                      role="button"
                      aria-label={text}
                      className="analytics-svg-button"
                      onMouseEnter={() => setTip(text)}
                      onFocus={() => setTip(text)}
                      onClick={() => {
                        setTip(text);
                        select(d, h);
                      }}
                      onKeyDown={(e) =>
                        keyClick(e, () => {
                          setTip(text);
                          select(d, h);
                        })
                      }
                    >
                      <title>{text}</title>
                    </rect>
                  );
                })}
              </g>
            ))}
            {[0, 4, 8, 12, 16, 20].map((h) => (
              <text
                key={h}
                x={x(h)}
                y={187}
                fontSize={8}
                fill="currentColor"
                opacity={0.8}
              >
                {h === 0
                  ? "12 AM"
                  : h === 12
                    ? "12 PM"
                    : h < 12
                      ? `${h} AM`
                      : `${h - 12} PM`}
              </text>
            ))}
          </svg>
        </div>
      )}

      {/* Weekday List View */}
      {viewMode === "list" && (
        <div className="scan-heatmap-mobile space-y-2">
          {dayStats.map((stat) => (
            <details
              key={stat.day}
              className="group border border-border/70 rounded-lg overflow-hidden bg-card/60 transition-colors shadow-xs"
            >
              <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between p-3 cursor-pointer select-none hover:bg-muted/30 active:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-xs tracking-wider text-foreground w-8">
                    {stat.day}
                  </span>
                  <div
                    className="w-16 sm:w-28 h-1.5 rounded-full bg-muted/80 overflow-hidden"
                    title={`${stat.total} scans`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(stat.total / maxDayTotal) * 100}%`,
                        background: stat.total > 0 ? "#66876c" : "transparent",
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {stat.total > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                      {stat.total} {stat.total === 1 ? "scan" : "scans"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/75 px-2 py-0.5 rounded-full bg-muted/60 font-medium">
                      0 scans
                    </span>
                  )}
                  <VaahanIcon
                    name="chevron-down"
                    size={14}
                    className="text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                  />
                </div>
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-border/40 bg-muted/15">
                {stat.total === 0 ? (
                  <div className="text-xs text-muted-foreground py-2 text-center italic">
                    No scan activity recorded on {stat.day}.
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs py-1.5 px-0.5 mb-2.5 text-muted-foreground border-b border-border/30">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Peak:{" "}
                      <strong className="text-foreground">
                        {stat.peakHour.toString().padStart(2, "0")}:00 IST ({stat.peakCount}{" "}
                        {stat.peakCount === 1 ? "scan" : "scans"})
                      </strong>
                    </span>
                    <span className="text-[11px]">
                      {stat.successful} active views
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {Array.from({ length: 24 }, (_, h) => {
                    const c = map.get(`${stat.d}:${h}`);
                    const cnt = c?.count || 0;
                    const act = c?.successful || 0;
                    const hasScans = cnt > 0;
                    const text = `${stat.day} ${h}:00–${h + 1}:00 IST · ${cnt} scans · ${act} active safety views`;
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setTip(text);
                          select(stat.d, h);
                        }}
                        onMouseEnter={() => setTip(text)}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs transition-all border outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          hasScans
                            ? "border-emerald-500/40 bg-emerald-500/15 text-foreground font-semibold shadow-xs hover:border-emerald-500"
                            : "border-border/40 bg-background/60 text-muted-foreground/75 hover:bg-muted/40"
                        }`}
                        aria-label={text}
                      >
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {h.toString().padStart(2, "0")}:00
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            hasScans
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-muted-foreground/45"
                          }`}
                        >
                          {cnt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Inspect Detail */}
      <Detail text={tip} onClear={() => setTip("")} />
    </div>
  );
}
export function ScanRhythm({
  hours,
  select,
}: {
  hours: AnalyticsData["scan-rhythm"]["hours"];
  select: (hour: number) => void;
}) {
  const [tip, setTip] = useState("");
  const max = Math.max(1, ...hours.map((h) => h.count));
  const radius = scaleRadial().domain([0, max]).range([12, 92]);
  const angle = scaleBand<number>()
    .domain(Array.from({ length: 24 }, (_, i) => i))
    .range([0, Math.PI * 2])
    .padding(0.07);
  const shape = arc();
  const total = hours.reduce((s, h) => s + h.count, 0);
  return (
    <>
      <div className="scan-rhythm-layout">
        <svg
          viewBox="0 0 240 240"
          width="100%"
          role="group"
          aria-label="24-hour radial histogram of recorded scan counts"
        >
          <g transform="translate(120 120)">
            {[30, 60, 92].map((r) => (
              <circle
                key={r}
                r={r}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={0.6}
              />
            ))}
            {hours.map((h) => {
              const text = `${h.hour}:00–${h.hour + 1}:00 IST · ${h.count} scans`;
              return (
                <path
                  key={h.hour}
                  d={
                    shape({
                      innerRadius: 12,
                      outerRadius: radius(h.count),
                      startAngle: angle(h.hour)!,
                      endAngle: angle(h.hour)! + angle.bandwidth(),
                    }) || ""
                  }
                  fill={scanColors[Math.floor(((h.hour + 18) % 24) / 6)]}
                  stroke="#fffaf2"
                  strokeWidth={1}
                  className="analytics-svg-button"
                  role="button"
                  tabIndex={0}
                  aria-label={text}
                  onMouseEnter={() => setTip(text)}
                  onFocus={() => setTip(text)}
                  onClick={() => select(h.hour)}
                  onKeyDown={(e) => keyClick(e, () => select(h.hour))}
                >
                  <title>{text}</title>
                </path>
              );
            })}
          </g>
          <text
            x={120}
            y={12}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
          >
            12 AM
          </text>
          <text
            x={232}
            y={124}
            textAnchor="end"
            fontSize={10}
            fill="currentColor"
          >
            6 AM
          </text>
          <text
            x={120}
            y={235}
            textAnchor="middle"
            fontSize={10}
            fill="currentColor"
          >
            12 PM
          </text>
          <text x={5} y={124} fontSize={10} fill="currentColor">
            6 PM
          </text>
        </svg>
        <div className="scan-rhythm-legend">
          {["12 AM – 6 AM", "6 AM – 12 PM", "12 PM – 6 PM", "6 PM – 12 AM"].map(
            (label, i) => {
              const n = hours
                .filter((h) => Math.floor(h.hour / 6) === i)
                .reduce((s, h) => s + h.count, 0);
              return (
                <div key={label}>
                  <i style={{ background: scanColors[(i + 3) % 4] }} />
                  <span>{label}</span>
                  <strong>{total ? Math.round((n / total) * 100) : 0}%</strong>
                </div>
              );
            },
          )}
        </div>
      </div>
      <Detail text={tip} />
    </>
  );
}
export function ScanCalendar({
  days,
  select,
}: {
  days: AnalyticsData["scan-calendar"]["days"];
  select: (date: string) => void;
}) {
  const [tip, setTip] = useState("");
  const max = Math.max(1, ...days.map((d) => d.count));
  const color = scaleLinear<string>()
    .domain([0, max])
    .range(["#edf0e7", "#66876c"]);
  const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
  return (
    <>
      <div className="scan-calendar-months">
        {months.map((month) => {
          const rows = days.filter((d) => d.date.startsWith(month));
          const first = Number(rows[0]!.date.slice(8)) - 1;
          const dow = (new Date(month + "-01T00:00:00Z").getUTCDay() + 6) % 7;
          return (
            <div key={month}>
              <p>
                {new Intl.DateTimeFormat("en-IN", {
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(month + "-01"))}
              </p>
              <div className="scan-calendar-dots">
                {rows.map((d, i) => {
                  const cell = first + i + dow;
                  const text = `${d.date} · ${d.count} scans · ${d.successful} active safety views`;
                  return (
                    <button
                      key={d.date}
                      style={{
                        gridColumn: Math.floor(cell / 7) + 1,
                        gridRow: (cell % 7) + 1,
                        background: color(d.count),
                      }}
                      aria-label={text}
                      title={text}
                      onMouseEnter={() => setTip(text)}
                      onFocus={() => setTip(text)}
                      onClick={() => select(d.date)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="scan-calendar-scale">
        <span>Less scans</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <i key={v} style={{ background: color(max * v) }} />
        ))}
        <span>More scans</span>
      </div>
      <Detail text={tip} />
    </>
  );
}
