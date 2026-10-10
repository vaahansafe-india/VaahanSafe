"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { scaleBand, scaleLinear } from "d3-scale";
import { hierarchy, treemap } from "d3-hierarchy";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CATEGORIES } from "../document-vault/model";
import { bytesLabel } from "./Charts";
import { today } from "./filters";
import type { AnalyticsData, StorageDocument } from "./types";
const colors = [
  "#b15f43",
  "#62785c",
  "#bd985c",
  "#87867c",
  "#6c8795",
  "#99777e",
];
const categoryName = (key: string) =>
  CATEGORIES[key as keyof typeof CATEGORIES] || key;
const short = (label: string, length = 18) =>
  label.length > length ? label.slice(0, length - 1) + "…" : label;
function Detail({ text }: { text: string }) {
  return (
    <output className="analytics-mark-detail" aria-live="polite">
      {text || "Hover, focus or tap a mark to inspect its real storage data."}
    </output>
  );
}
function activate(event: React.KeyboardEvent, fn: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fn();
  }
}

export { StorageConstellation } from "./StorageConstellation";

export function StorageHeatmap({
  cells,
}: {
  cells: AnalyticsData["documents"]["rhythm"];
}) {
  const [tip, setTip] = useState("");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = new Map(
    cells.map((row) => [`${row.day}:${row.hour}`, row.count]),
  );
  const color = scaleLinear<string>()
    .domain([0, Math.max(1, ...cells.map((row) => row.count))])
    .range(["#eeeae0", "#62785c"]);
  const x = scaleBand<number>()
    .domain(Array.from({ length: 24 }, (_, i) => i))
    .range([30, 620])
    .padding(0.12);
  const y = scaleBand<number>()
    .domain([0, 1, 2, 3, 4, 5, 6])
    .range([8, 195])
    .padding(0.14);
  return (
    <div>
      <div className="storage-map-desktop">
        <svg
          viewBox="0 0 620 228"
          width="100%"
          role="group"
          aria-label="Document operations by weekday and hour in India Standard Time"
        >
          {days.map((day, d) => (
            <g key={day}>
              <text
                x={0}
                y={y(d)! + y.bandwidth() / 2 + 3}
                fontSize={10}
                fill="hsl(var(--muted-foreground))"
              >
                {day}
              </text>
              {Array.from({ length: 24 }, (_, h) => {
                const value = values.get(`${d}:${h}`) || 0;
                const text = `${day}, ${String(h).padStart(2, "0")}:00 IST · ${value} document operations`;
                return (
                  <rect
                    key={h}
                    x={x(h)}
                    y={y(d)}
                    width={x.bandwidth()}
                    height={y.bandwidth()}
                    fill={color(value)}
                    rx={1}
                    className="analytics-svg-button"
                    tabIndex={0}
                    role="button"
                    aria-label={text}
                    onMouseEnter={() => setTip(text)}
                    onFocus={() => setTip(text)}
                    onClick={() => setTip(text)}
                    onKeyDown={(event) => activate(event, () => setTip(text))}
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
              y={217}
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
            >
              {String(h).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
      </div>
      <div className="storage-map-mobile">
        {days.map((day, d) => (
          <button
            className="analytics-region"
            key={day}
            onClick={() =>
              setTip(
                `${day}: ${
                  cells
                    .filter((row) => row.day === d)
                    .map((row) => `${row.hour}:00 IST · ${row.count}`)
                    .join("; ") || "No operations recorded"
                }`,
              )
            }
          >
            <span>{day}</span>
            <strong>
              {cells
                .filter((row) => row.day === d)
                .reduce((s, row) => s + row.count, 0)}{" "}
              operations
            </strong>
          </button>
        ))}
      </div>
      <Detail text={tip} />
    </div>
  );
}

export function StorageLayers({
  data,
  onFile,
}: {
  data: AnalyticsData["documents"];
  onFile: (mime: string) => void;
}) {
  const [tip, setTip] = useState("");
  const rows = data.composition.filter(
    (row) => row.label === "PDF" || row.label === "Images",
  );
  const x = scaleLinear()
    .domain([0, Math.max(1, data.bytes)])
    .range([0, 600]);
  return (
    <div>
      <div className="storage-layer-total">
        <span>Total originals</span>
        <strong>{bytesLabel(data.bytes)}</strong>
      </div>
      <svg
        viewBox="0 0 600 18"
        width="100%"
        aria-hidden="true"
        className="storage-total-band"
      >
        <rect width={600} height={18} rx={2} fill="hsl(var(--muted))" />
        {rows.map((row, index) => (
          <rect
            key={row.label}
            x={x(
              rows.slice(0, index).reduce((sum, item) => sum + item.bytes, 0),
            )}
            width={x(row.bytes)}
            height={18}
            fill={colors[index]}
          />
        ))}
      </svg>
      {rows.map((row, index) => {
        const detail = `${row.label}: ${bytesLabel(row.bytes)} · ${row.count} versions · ${data.bytes ? ((row.bytes / data.bytes) * 100).toFixed(1) : "0"}% of originals`;
        return (
          <button
            className="storage-layer-row"
            key={row.label}
            onClick={() => {
              setTip(detail);
              onFile(row.label === "PDF" ? "application/pdf" : "image/*");
            }}
            onMouseEnter={() => setTip(detail)}
            onFocus={() => setTip(detail)}
            aria-label={detail}
          >
            <span>
              <strong>{row.label}</strong>
              <span>
                {bytesLabel(row.bytes)} ·{" "}
                {data.bytes ? ((row.bytes / data.bytes) * 100).toFixed(1) : 0}%
                · {row.count} versions
              </span>
            </span>
            <svg viewBox="0 0 600 18" width="100%" aria-hidden="true">
              <rect width={600} height={18} rx={2} fill="hsl(var(--muted))" />
              <rect
                width={x(row.bytes)}
                height={18}
                rx={2}
                fill={colors[index]}
              />
            </svg>
          </button>
        );
      })}
      <div className="storage-version-summary">
        <span>
          Current originals{" "}
          <strong>{bytesLabel(data.versions.currentBytes)}</strong>
        </span>
        <span>
          {data.versions.previousCount} retained previous versions{" "}
          <strong>{bytesLabel(data.versions.previousBytes)}</strong>
        </span>
      </div>
      <Detail text={tip} />
    </div>
  );
}

export function FileSizeDistribution({
  data,
}: {
  data: AnalyticsData["storage-details"];
}) {
  const [tip, setTip] = useState("");
  const x = scaleBand<string>()
    .domain(data.distribution.map((row) => row.label))
    .range([35, 625])
    .padding(0.3);
  const y = scaleLinear()
    .domain([0, Math.max(1, ...data.distribution.map((row) => row.count))])
    .range([210, 15])
    .nice();
  return (
    <div>
      <div className="storage-distribution-summary">
        <span>
          Median <strong>{bytesLabel(data.median)}</strong>
        </span>
        <span>
          P90 <strong>{bytesLabel(data.p90)}</strong>
        </span>
        <span>
          Largest <strong>{bytesLabel(data.largestBytes)}</strong>
        </span>
      </div>
      <div className="storage-map-desktop">
        <svg
          viewBox="0 0 650 265"
          width="100%"
          role="group"
          aria-label="Histogram of finalized original version file sizes"
        >
          {y
            .ticks(4)
            .filter(Number.isInteger)
            .map((tick) => (
              <g key={tick}>
                <line
                  x1={35}
                  x2={625}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="hsl(var(--border))"
                />
                <text
                  x={25}
                  y={y(tick) + 3}
                  fontSize={10}
                  textAnchor="end"
                  fill="hsl(var(--muted-foreground))"
                >
                  {tick}
                </text>
              </g>
            ))}
          {data.distribution.map((row) => {
            const text = `${row.label} · ${row.count} stored versions · ${bytesLabel(row.bytes)}`;
            return (
              <g
                key={row.label}
                className="analytics-svg-button"
                role="button"
                tabIndex={0}
                aria-label={text}
                onMouseEnter={() => setTip(text)}
                onFocus={() => setTip(text)}
                onClick={() => setTip(text)}
                onKeyDown={(event) => activate(event, () => setTip(text))}
              >
                <title>{text}</title>
                <rect
                  x={x(row.label)}
                  y={y(row.count)}
                  width={x.bandwidth()}
                  height={210 - y(row.count)}
                  fill="#cc785c"
                  rx={2}
                />
                <text
                  x={x(row.label)! + x.bandwidth() / 2}
                  y={y(row.count) - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                >
                  {row.count}
                </text>
                <text
                  x={x(row.label)! + x.bandwidth() / 2}
                  y={238}
                  textAnchor="middle"
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                >
                  {row.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="storage-map-mobile">
        {data.distribution.map((row) => (
          <button
            className="analytics-region"
            key={row.label}
            onClick={() =>
              setTip(
                `${row.label}: ${row.count} stored versions · ${bytesLabel(row.bytes)}`,
              )
            }
          >
            <span>{row.label}</span>
            <strong>{row.count} versions</strong>
          </button>
        ))}
      </div>
      <Detail text={tip} />
    </div>
  );
}

export function ExpiryHorizon({ data }: { data: AnalyticsData["documents"] }) {
  const now = Date.parse(today());
  const rows = data.expiry.slice(0, 8).map((row) => ({
    ...row,
    days: Math.ceil((Date.parse(row.date) - now) / 86400000),
  }));
  const x = scaleLinear().domain([0, 90]).range([120, 600]).clamp(true);
  return (
    <div>
      <div className="storage-expiry-summary">
        {[
          ["Next 7 days", data.expirySummary.week],
          ["Next 30 days", data.expirySummary.month],
          ["Next 90 days", data.expirySummary.quarter],
          ["Expired", data.expirySummary.expired],
        ].map(([label, value]) => (
          <span key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </span>
        ))}
      </div>
      <div className="storage-map-desktop">
        <svg
          viewBox={`0 0 650 ${rows.length * 44 + 50}`}
          width="100%"
          role="group"
          aria-label="Nearest document expiries, with a 90-day horizon and later dates grouped"
        >
          {[0, 7, 30, 90].map((day) => (
            <g key={day}>
              <line
                x1={x(day)}
                x2={x(day)}
                y1={25}
                y2={rows.length * 44 + 25}
                stroke="hsl(var(--border))"
              />
              <text
                x={x(day)}
                y={15}
                fontSize={10}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
              >
                {day === 0
                  ? "Today"
                  : day === 90
                    ? "90 days / later"
                    : `${day} days`}
              </text>
            </g>
          ))}
          {rows.map((row, index) => (
            <a
              href={`/documents/${row.id}`}
              key={row.id}
              aria-label={`${row.title}, ${row.date}`}
            >
              <title>
                {row.title} · {row.date} ·{" "}
                {row.days < 0 ? "Expired" : `${row.days} days`}
              </title>
              <text x={0} y={49 + index * 44} fontSize={11} fill="currentColor">
                {short(row.title, 17)}
              </text>
              <line
                x1={120}
                x2={x(row.days)}
                y1={45 + index * 44}
                y2={45 + index * 44}
                stroke={row.days <= 30 ? "#cc785c" : "#62785c"}
                strokeOpacity={0.35}
                strokeWidth={4}
              />
              <circle
                cx={x(row.days)}
                cy={45 + index * 44}
                r={5}
                fill={row.days <= 30 ? "#b15f43" : "#62785c"}
              />
              <text
                x={x(row.days)}
                y={61 + index * 44}
                textAnchor="middle"
                fontSize={9}
                fill="hsl(var(--muted-foreground))"
              >
                {row.date}
              </text>
            </a>
          ))}
        </svg>
      </div>
      <div className="storage-map-mobile">
        {rows.map((row) => (
          <Link
            key={row.id}
            className="analytics-region"
            href={`/documents/${row.id}`}
          >
            <span>{row.title}</span>
            <small>{row.date}</small>
          </Link>
        ))}
      </div>
      <p className="analytics-chart-note">
        Nearest eight expiry records · Later dates share the 90-day endpoint ·
        Opening a document uses vault authorization.
      </p>
    </div>
  );
}

type AtlasNode = {
  name: string;
  value?: number;
  document?: StorageDocument;
  children?: AtlasNode[];
};
export function DocumentAtlas({ documents }: { documents: StorageDocument[] }) {
  const [tip, setTip] = useState(""),
    [vehicle, setVehicle] = useState<string | null>(null),
    [category, setCategory] = useState<string | null>(null);
  const groups = useMemo(
    () =>
      Array.from(
        new Map(
          documents.map((row) => [row.vehicle || "ACCOUNT", row.vehicleLabel]),
        ).entries(),
      ),
    [documents],
  );
  const shown = useMemo(
    () =>
      documents.filter(
        (row) =>
          (!vehicle ||
            !groups.some(([id]) => id === vehicle) ||
            (row.vehicle || "ACCOUNT") === vehicle) &&
          (!category || row.category === category),
      ),
    [documents, vehicle, category, groups],
  );
  const root = useMemo(() => {
    const vehicleGroups = new Map<string, AtlasNode>();
    for (const row of shown) {
      const key = row.vehicle || "ACCOUNT";
      let group = vehicleGroups.get(key);
      if (!group) {
        group = { name: row.vehicleLabel, children: [] };
        vehicleGroups.set(key, group);
      }
      let category = group.children!.find(
        (child) => child.name === categoryName(row.category),
      );
      if (!category) {
        category = { name: categoryName(row.category), children: [] };
        group.children!.push(category);
      }
      category.children!.push({
        name: row.title,
        value: row.bytes,
        document: row,
      });
    }
    const tree = hierarchy<AtlasNode>({
      name: "All storage",
      children: Array.from(vehicleGroups.values()),
    })
      .sum((node) => node.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    return treemap<AtlasNode>()
      .size([900, 440])
      .paddingOuter(6)
      .paddingInner(3)
      .paddingTop((node) => (node.depth < 3 ? 19 : 2))
      .round(true)(tree);
  }, [shown]);
  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(
        documents
          .filter(
            (row) => !vehicle || (row.vehicle || "ACCOUNT") === vehicle,
          )
          .map((row) => row.category),
      ),
    );
  }, [documents, vehicle]);

  return (
    <div>
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 mb-4">
        {/* Vehicle / Storage Filter */}
        <div className="w-full sm:w-56 shrink-0">
          <Select
            value={vehicle ?? "ALL"}
            onValueChange={(val) => {
              setVehicle(val === "ALL" ? null : val);
              setCategory(null);
              setTip("");
            }}
          >
            <SelectTrigger
              aria-label="Filter vehicle or storage scope"
              className="h-9 w-full text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <VaahanIcon
                  name="vehicle"
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <SelectValue placeholder="All storage" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All storage</SelectItem>
              {groups.map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Category Filter */}
        <div className="w-full sm:w-56 shrink-0">
          <Select
            value={category ?? "ALL"}
            onValueChange={(val) => {
              setCategory(val === "ALL" ? null : val);
              setTip("");
            }}
          >
            <SelectTrigger
              aria-label="Filter document category"
              className="h-9 w-full text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <VaahanIcon
                  name="document"
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
                <SelectValue placeholder="All categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {availableCategories.map((key) => (
                <SelectItem key={key} value={key}>
                  {categoryName(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset / Clear Button */}
        {(vehicle || category) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setVehicle(null);
              setCategory(null);
              setTip("");
            }}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            <VaahanIcon name="close" size={13} className="mr-1" />
            Reset filters
          </Button>
        )}
      </div>
      <div className="storage-map-desktop">
        <svg
          viewBox="0 0 900 440"
          width="100%"
          role="group"
          aria-label="Document Atlas treemap: vehicle, category and document allocations"
        >
          {root
            .descendants()
            .filter(
              (node) =>
                node.depth > 0 &&
                node.children &&
                node.x1 - node.x0 >= 65 &&
                node.y1 - node.y0 >= 20,
            )
            .map((node) => (
              <text
                key={`${node.depth}:${node.x0}:${node.y0}`}
                x={node.x0 + 5}
                y={node.y0 + 13}
                fontSize={11}
                fill="hsl(var(--muted-foreground))"
              >
                {short(
                  node.data.name,
                  Math.max(1, Math.floor((node.x1 - node.x0 - 10) / 7)),
                )}
              </text>
            ))}
          {root
            .leaves()
            .filter((node) => node.data.document)
            .map((node, index) => {
              const row = node.data.document!;
              const text = `${row.title} · ${row.vehicleLabel} · ${categoryName(row.category)} · ${bytesLabel(row.bytes)} · ${row.versions} versions`;
              const content = (
                <>
                  <rect
                    x={node.x0}
                    y={node.y0}
                    width={Math.max(0, node.x1 - node.x0)}
                    height={Math.max(0, node.y1 - node.y0)}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.18}
                    stroke="hsl(var(--border))"
                    rx={2}
                  />
                  {node.x1 - node.x0 > 75 && node.y1 - node.y0 > 30 && (
                    <text
                      x={node.x0 + 7}
                      y={node.y0 + 17}
                      fontSize={11}
                      fill="currentColor"
                    >
                      {short(
                        row.title,
                        Math.floor((node.x1 - node.x0 - 12) / 7),
                      )}
                    </text>
                  )}
                  {node.x1 - node.x0 > 60 && node.y1 - node.y0 > 47 && (
                    <text
                      x={node.x0 + 7}
                      y={node.y0 + 36}
                      fontSize={11}
                      fontWeight={600}
                      fill="currentColor"
                    >
                      {bytesLabel(row.bytes)}
                    </text>
                  )}
                </>
              );
              return row.id ? (
                <a
                  key={row.id}
                  href={`/documents/${row.id}`}
                  aria-label={text}
                  onMouseEnter={() => setTip(text)}
                  onFocus={() => setTip(text)}
                >
                  <title>{text}</title>
                  {content}
                </a>
              ) : (
                <g
                  key={`group:${index}`}
                  role="button"
                  tabIndex={0}
                  aria-label={text}
                  onMouseEnter={() => setTip(text)}
                  onFocus={() => setTip(text)}
                  onClick={() => setTip(text)}
                  onKeyDown={(event) => activate(event, () => setTip(text))}
                >
                  <title>{text}</title>
                  {content}
                </g>
              );
            })}
        </svg>
      </div>
      <div className="storage-map-mobile storage-atlas-list">
        {groups
          .filter(([id]) =>
            shown.some((row) => (row.vehicle || "ACCOUNT") === id),
          )
          .map(([id, label]) => (
            <details key={id}>
              <summary>
                {label}
                <strong>
                  {bytesLabel(
                    shown
                      .filter((row) => (row.vehicle || "ACCOUNT") === id)
                      .reduce((sum, row) => sum + row.bytes, 0),
                  )}
                </strong>
              </summary>
              {shown
                .filter((row) => (row.vehicle || "ACCOUNT") === id)
                .map((row, index) =>
                  row.id ? (
                    <Link
                      key={row.id}
                      href={`/documents/${row.id}`}
                      className="analytics-region"
                    >
                      <span>
                        {row.title}
                        <small className="block text-muted-foreground">
                          {row.vehicleLabel} · {categoryName(row.category)}
                        </small>
                      </span>
                      <strong>{bytesLabel(row.bytes)}</strong>
                    </Link>
                  ) : (
                    <div className="analytics-region" key={`rest:${index}`}>
                      <span>{row.title}</span>
                      <strong>{bytesLabel(row.bytes)}</strong>
                    </div>
                  ),
                )}
            </details>
          ))}
        <p className="analytics-chart-note">
          Use Expand to explore the visual atlas.
        </p>
      </div>
      <p className="analytics-chart-note">
        Up to 100 individual documents; remaining storage is grouped. All areas
        reconcile to the selected original storage.
      </p>
      <Detail text={tip} />
    </div>
  );
}
