"use client";
import { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { CATEGORIES } from "../document-vault/model";
import { bytesLabel, Comparison } from "./Charts";
import {
  categoryPortion,
  constellationGroups,
  constellationLayout,
  STORAGE_COLORS,
} from "./storage-geometry";
import type { AnalyticsData } from "./types";

const categoryName = (key: string) =>
  CATEGORIES[key as keyof typeof CATEGORIES] || key;
const short = (text: string, length: number) =>
  text.length > length ? text.slice(0, length - 1) + "…" : text;
function activate(event: React.KeyboardEvent, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

export function StorageConstellation({
  data,
  onVehicle,
  onCategory,
}: {
  data: AnalyticsData["documents"];
  onVehicle: (id: string) => void;
  onCategory: (key: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState("");
  const { vehicles, categories, allCategories } = constellationGroups(data);
  // Derive selection from current data: a removed group cannot leave stale flows.
  const selection = vehicles.find((row) => row.key === hover);
  const { height, center, vehicleY, categoryY, width, radius, link } =
    constellationLayout(data.bytes, vehicles.length, categories.length);
  const shownKeys = categories
    .filter((row) => !row.other)
    .map((row) => row.key);
  const portion = (row: (typeof categories)[number]) =>
    categoryPortion(
      data,
      selection?.members || null,
      row.key,
      row.other,
      shownKeys,
    );
  const percent = (bytes: number) =>
    data.bytes ? `${((bytes / data.bytes) * 100).toFixed(1)}%` : "0%";
  const clear = () => {
    setHover(null);
    setTip("");
  };
  const inspect = (row: (typeof vehicles)[number]) => {
    setHover(row.key);
    const breakdown = new Map<string, number>();
    for (const item of data.allocation.filter((item) =>
      row.members.includes(item.vehicle),
    ))
      breakdown.set(
        item.category,
        (breakdown.get(item.category) || 0) + item.bytes,
      );
    const largest = [...breakdown].sort((a, b) => b[1] - a[1])[0];
    setTip(
      `${row.name} · ${row.label} · ${bytesLabel(row.bytes)} · ${row.documents} documents · ${percent(row.bytes)} of storage${largest ? ` · Largest category: ${categoryName(largest[0])}, ${bytesLabel(largest[1])}` : ""}`,
    );
  };
  return (
    <div className="storage-constellation">
      <div className="storage-map-desktop" onMouseLeave={clear}>
        <svg
          viewBox={`0 0 800 ${height}`}
          width="100%"
          role="group"
          aria-label="Storage Constellation: vehicle to total storage to document category"
        >
          <text x={18} y={18} className="storage-svg-eyebrow">
            VEHICLES & ACCOUNT
          </text>
          <text x={600} y={18} className="storage-svg-eyebrow">
            DOCUMENT CATEGORIES
          </text>
          {[130, 155].map((r) => (
            <circle
              key={r}
              cx={385}
              cy={center}
              r={r}
              fill="none"
              stroke="hsl(var(--border))"
              strokeOpacity={0.45}
              strokeDasharray={r === 155 ? "2 6" : undefined}
            />
          ))}
          {vehicles.map((row, i) => (
            <path
              key={row.key}
              d={link([245, vehicleY[i]!], [286, center])}
              fill="none"
              stroke={STORAGE_COLORS[i % STORAGE_COLORS.length]}
              strokeWidth={width(row.bytes)}
              strokeOpacity={
                selection && selection.key !== row.key ? 0.06 : 0.32
              }
            />
          ))}
          {categories.map((row, i) => (
            <path
              key={row.key}
              d={link([484, center], [600, categoryY[i]!])}
              fill="none"
              stroke={STORAGE_COLORS[i % STORAGE_COLORS.length]}
              strokeWidth={width(portion(row))}
              strokeOpacity={selection ? 0.6 : 0.32}
            />
          ))}
          <g
            className="analytics-svg-button"
            tabIndex={0}
            role="button"
            aria-label="Clear constellation inspection"
            onClick={clear}
            onKeyDown={(event) => activate(event, clear)}
          >
            <circle
              cx={385}
              cy={center}
              r={99}
              fill="hsl(var(--card))"
              stroke="hsl(var(--border))"
            />
            <circle
              cx={385}
              cy={center}
              r={88}
              fill="none"
              stroke="#bd985c"
              strokeWidth={6}
              strokeOpacity={0.35}
            />
            <circle
              cx={385}
              cy={center}
              r={76}
              fill="none"
              stroke="hsl(var(--border))"
            />
            <foreignObject x={373} y={center - 43} width={24} height={24}>
              <VaahanIcon
                name="database"
                size={24}
                className="text-[#62785c]"
              />
            </foreignObject>
            <text
              x={385}
              y={center + 6}
              textAnchor="middle"
              fontSize={25}
              fontWeight={600}
              fill="currentColor"
            >
              {bytesLabel(data.bytes)}
            </text>
            <text
              x={385}
              y={center + 29}
              textAnchor="middle"
              fontSize={11}
              fill="hsl(var(--muted-foreground))"
            >
              Total private originals
            </text>
            <text
              x={385}
              y={center + 47}
              textAnchor="middle"
              fontSize={10}
              fill="hsl(var(--muted-foreground))"
            >
              {data.total} documents
            </text>
          </g>
          {vehicles.map((row, i) => {
            const y = vehicleY[i]!,
              color = STORAGE_COLORS[i % STORAGE_COLORS.length];
            const action = () => {
              inspect(row);
              if (row.id) onVehicle(row.id);
            };
            return (
              <g
                key={row.key}
                className="analytics-svg-button"
                tabIndex={0}
                role="button"
                aria-label={`${row.name}, ${row.label}, ${bytesLabel(row.bytes)}, ${row.documents} documents${row.id ? ", filter by vehicle" : ""}`}
                onMouseEnter={() => inspect(row)}
                onFocus={() => inspect(row)}
                onClick={action}
                onKeyDown={(event) => activate(event, action)}
                opacity={selection && selection.key !== row.key ? 0.45 : 1}
              >
                <title>
                  {row.name} · {row.label} · {bytesLabel(row.bytes)} ·{" "}
                  {row.documents} documents
                </title>
                <rect
                  x={12}
                  y={y - 36}
                  width={233}
                  height={72}
                  rx={6}
                  fill="hsl(var(--card))"
                  stroke="hsl(var(--border))"
                />
                <circle
                  cx={52}
                  cy={y}
                  r={radius(row.bytes)}
                  fill={color}
                  fillOpacity={0.12}
                  stroke={color}
                  strokeOpacity={0.35}
                />
                <foreignObject x={40} y={y - 12} width={24} height={24}>
                  <VaahanIcon
                    name={row.id ? "vehicle" : "file"}
                    size={24}
                    style={{ color }}
                  />
                </foreignObject>
                <text
                  x={95}
                  y={y - 13}
                  fontSize={11}
                  fontWeight={500}
                  fill="currentColor"
                >
                  {short(row.name, 21)}
                </text>
                <text
                  x={95}
                  y={y + 7}
                  fontSize={16}
                  fontWeight={600}
                  fill="currentColor"
                >
                  {bytesLabel(row.bytes)}
                </text>
                <text
                  x={95}
                  y={y + 24}
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                >
                  {row.documents} documents · {percent(row.bytes)}
                </text>
              </g>
            );
          })}
          {categories.map((row, i) => {
            const y = categoryY[i]!,
              name = row.other ? row.label : categoryName(row.key);
            const text = `${name} · ${bytesLabel(row.bytes)} · ${percent(row.bytes)} · ${row.count} stored versions${selection ? ` · ${bytesLabel(portion(row))} in ${selection.name}` : ""}`;
            const action = () => {
              setTip(text);
              if (!row.other) onCategory(row.key);
            };
            return (
              <g
                key={row.key}
                className="analytics-svg-button"
                tabIndex={0}
                role="button"
                aria-label={text}
                onMouseEnter={() => setTip(text)}
                onFocus={() => setTip(text)}
                onClick={action}
                onKeyDown={(event) => activate(event, action)}
              >
                <title>{text}</title>
                <circle
                  cx={610}
                  cy={y}
                  r={16}
                  fill={STORAGE_COLORS[i % STORAGE_COLORS.length]}
                  fillOpacity={0.15}
                  stroke={STORAGE_COLORS[i % STORAGE_COLORS.length]}
                />
                <foreignObject x={601} y={y - 9} width={18} height={18}>
                  <VaahanIcon name="file" size={18} />
                </foreignObject>
                <text x={638} y={y - 12} fontSize={11} fill="currentColor">
                  {short(name, 23)}
                </text>
                <text
                  x={638}
                  y={y + 9}
                  fontSize={16}
                  fontWeight={600}
                  fill="currentColor"
                >
                  {bytesLabel(row.bytes)}
                </text>
                <text
                  x={638}
                  y={y + 26}
                  fontSize={10}
                  fill="hsl(var(--muted-foreground))"
                >
                  {percent(row.bytes)}
                  {selection
                    ? ` · selected ${bytesLabel(portion(row))}`
                    : ` · ${row.count} versions`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="storage-map-mobile">
        <p className="storage-flow-total">
          <strong>{bytesLabel(data.bytes)}</strong>
          <span>{data.total} documents · Total private originals</span>
        </p>
        <p className="analytics-eyebrow">By vehicle</p>
        <Comparison
          data={data.byVehicle.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.bytes,
          }))}
          bytes
          onSelect={onVehicle}
        />
        <p className="analytics-eyebrow mt-5">By category</p>
        <Comparison
          data={allCategories.map((row) => ({
            id: row.key,
            label: categoryName(row.key),
            value: row.bytes,
          }))}
          bytes
          onSelect={onCategory}
        />
        <p className="analytics-chart-note">
          Use Expand to explore the full storage constellation.
        </p>
      </div>
      <output className="analytics-mark-detail" aria-live="polite">
        {tip ||
          "Flow width represents bytes. Focus or tap a node to inspect; select a vehicle or category to filter."}
      </output>
    </div>
  );
}
