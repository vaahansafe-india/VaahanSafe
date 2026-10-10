"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { ChartFrame, type DataRow } from "./ChartFrame";
import type { AnalyticsData, Section } from "./types";
const Constellation = dynamic(
  () => import("./StorageVisuals").then((m) => m.StorageConstellation),
  { ssr: false },
);
const Heatmap = dynamic(
  () => import("./StorageVisuals").then((m) => m.StorageHeatmap),
  { ssr: false },
);
const Layers = dynamic(
  () => import("./StorageVisuals").then((m) => m.StorageLayers),
  { ssr: false },
);
const Histogram = dynamic(
  () => import("./StorageVisuals").then((m) => m.FileSizeDistribution),
  { ssr: false },
);
const Horizon = dynamic(
  () => import("./StorageVisuals").then((m) => m.ExpiryHorizon),
  { ssr: false },
);
const Atlas = dynamic(
  () => import("./StorageVisuals").then((m) => m.DocumentAtlas),
  { ssr: false },
);
const Growth = dynamic(() => import("./Charts").then((m) => m.StorageGrowth), {
  ssr: false,
});
const Access = dynamic(() => import("./Charts").then((m) => m.StorageAccess), {
  ssr: false,
});
const Comparison = dynamic(() => import("./Charts").then((m) => m.Comparison), {
  ssr: false,
});
const Status = dynamic(() => import("./Charts").then((m) => m.ExpiryStatus), {
  ssr: false,
});
const Usage = dynamic(() => import("./Charts").then((m) => m.StorageUsage), {
  ssr: false,
});
const bytes = (v: number) =>
  v === 0
    ? "0 B"
    : v < 1048576
      ? `${(v / 1024).toFixed(1)} KB`
      : v < 1073741824
        ? `${(v / 1048576).toFixed(1)} MB`
        : `${(v / 1073741824).toFixed(2)} GB`;
export interface StorageQueryState<S extends Section> {
  data?: AnalyticsData[S];
  loading: boolean;
  error: boolean;
  retry: () => void;
}
const originals =
  "Current non-deleted documents and finalized READY originals, including retained versions. Pending/failed uploads and deleted documents are excluded. File filters apply to original version types. Storage is a current snapshot, independent of activity dates.";
const eventsSource =
  "Real owner-scoped vault events in the selected period, bucketed in India time. Previews/downloads are authorized access requests, not confirmed completed reads. Thumbnails are excluded; deleted-document events remain in history.";
type Panel = {
  area: string;
  title: string;
  description: string;
  source: string;
  query: StorageQueryState<Section>;
  rows?: DataRow[];
  empty?: string;
  children: ReactNode;
};

export function StorageDashboard({
  summary,
  history,
  details,
  access,
  onVehicle,
  onCategory,
  onFile,
  activity,
}: {
  summary: StorageQueryState<"documents">;
  history: StorageQueryState<"storage-history">;
  details: StorageQueryState<"storage-details">;
  access: StorageQueryState<"storage-access">;
  onVehicle: (id: string) => void;
  onCategory: (category: string) => void;
  onFile: (mime: string) => void;
  activity: ReactNode;
}) {
  const d = summary.data,
    h = history.data,
    f = details.data,
    a = access.data;
  const countEvents = (labels: string[]) =>
    d?.activity
      .filter((r) => labels.includes(r.label.toLowerCase()))
      .reduce((sum, r) => sum + r.count, 0);
  const statuses = ["Current", "Expiring soon", "Expired"].map((label) => ({
    label,
    value: d?.statuses.find((r) => r.label === label)?.count || 0,
  }));
  const metrics: Array<{
    label: string;
    value?: string | number;
    note: string;
    icon: VaahanIconName;
  }> = [
    {
      label: "Total Documents",
      value: d?.total,
      note: "Current finalized documents",
      icon: "file",
    },
    {
      label: "Total Storage Used",
      value: d ? bytes(d.bytes) : undefined,
      note: "Originals & retained versions",
      icon: "database",
    },
    {
      label: "Uploads",
      value: countEvents(["uploaded", "replaced"]),
      note: "Uploads & replacements in the period",
      icon: "add",
    },
    {
      label: "Views & Downloads",
      value: countEvents(["previewed", "downloaded", "shared document opened"]),
      note: "Authorized document access requests",
      icon: "eye",
    },
  ];
  const panels: Panel[] = [
    {
      area: "storage-allocation",
      title: "Storage Constellation",
      description: "Your document storage by vehicle and category",
      source:
        originals +
        " Node area and flow width represent bytes. Hover/focus highlights the vehicle's real category distribution; select a vehicle/category to filter. Largest five groups plus remaining groups are shown.",
      query: summary,
      empty:
        d && !d.bytes
          ? "Add documents to your vault to see storage distribution."
          : undefined,
      rows: d?.allocation.map((r) => ({
        Vehicle:
          d.byVehicle.find((v) => v.id === r.vehicle)?.label ||
          "Account documents",
        Category: r.category,
        Bytes: r.bytes,
        Documents: r.documents,
      })),
      children: d && (
        <Constellation data={d} onVehicle={onVehicle} onCategory={onCategory} />
      ),
    },
    {
      area: "storage-trend",
      title: "Storage Growth",
      description: "Measured private original storage over time",
      source:
        "Real snapshots after complete vault transactions, once per account/transaction. Before the initial baseline, history is unknown, not zero. Category series reconcile to the finalized-original policy. Expiry/protection filters use recorded metadata and current expiry cutoffs.",
      query: history,
      empty:
        h && !h.growth.some((r) => r.values !== null)
          ? "No measurements exist in this range. Choose a period that includes the start of storage tracking."
          : undefined,
      rows: h?.growth.map((r) => ({
        Time: r.timestamp,
        "Measured at": r.asOf,
        Bytes: r.values
          ? Object.values(r.values).reduce((sum, value) => sum + value, 0)
          : null,
      })),
      children: h && <Growth rows={h.growth} startedAt={h.startedAt} />,
    },
    {
      area: "storage-expiry-status",
      title: "Document Status",
      description: "Current documents by recorded expiry",
      source:
        "Counts of documents, not bytes. Expiring soon is today through 30 India-calendar days. Current means a later or unrecorded expiry; it does not verify document validity or entitlement.",
      query: summary,
      empty: d && !d.total ? "No current documents." : undefined,
      rows: d
        ? statuses.map((r) => ({ Status: r.label, Documents: r.value }))
        : undefined,
      children: d && <Status rows={statuses} />,
    },
    {
      area: "storage-heatmap",
      title: "Storage Rhythm",
      description: "Document operations by weekday and hour · IST",
      source: eventsSource + " Intensity shows operations, not bytes.",
      query: summary,
      empty:
        d && !d.rhythm.length
          ? "No document operations were recorded in this range."
          : undefined,
      rows: d?.rhythm.map((r) => ({
        "Weekday (Mon=0)": r.day,
        Hour: r.hour,
        Operations: r.count,
      })),
      children: d && <Heatmap cells={d.rhythm} />,
    },
    {
      area: "storage-top-vehicles",
      title: "Storage by Vehicle",
      description: "Document originals and retained versions",
      source:
        originals +
        " Select a vehicle bar to filter. Account documents remain a separate group.",
      query: summary,
      empty: d && !d.bytes ? "No finalized storage yet." : undefined,
      rows: d?.byVehicle.map((r) => ({
        Vehicle: r.label,
        Documents: r.documents,
        Bytes: r.bytes,
      })),
      children: d && (
        <Comparison
          data={d.byVehicle.map((r) => ({
            id: r.id,
            label: r.name,
            value: r.bytes,
          }))}
          bytes
          onSelect={onVehicle}
        />
      ),
    },
    {
      area: "storage-layers",
      title: "Storage Layers",
      description: "Original file types and retained version storage",
      source:
        originals +
        " Bands represent bytes; selecting one filters PDF or image originals.",
      query: summary,
      empty: d && !d.bytes ? "No finalized original files." : undefined,
      rows: d?.composition
        .filter((r) => r.label === "PDF" || r.label === "Images")
        .map((r) => ({ Type: r.label, Bytes: r.bytes, Versions: r.count })),
      children: d && <Layers data={d} onFile={onFile} />,
    },
    {
      area: "storage-expiry",
      title: "Expiry Horizon",
      description: "Expiry dates and records needing attention",
      source:
        "The eight nearest expiry records are plotted; dates beyond 90 days share a labeled endpoint. Summary counts cover all current filtered documents. Document links reuse vault permissions and preview.",
      query: summary,
      empty:
        d && !d.expiry.length
          ? "No document expiry dates are recorded."
          : undefined,
      rows: d?.expiry.map((r) => ({ Document: r.title, Expiry: r.date })),
      children: d && <Horizon data={d} />,
    },
    {
      area: "storage-distribution",
      title: "File Size Distribution",
      description: "Size distribution of stored original versions",
      source:
        originals +
        " Meaningful size buckets, median, P90 and largest are aggregated on the server. Counts refer to retained original versions.",
      query: details,
      empty: f && !f.largestBytes ? "No finalized original files." : undefined,
      rows: f?.distribution.map((r) => ({
        Size: r.label,
        Versions: r.count,
        Bytes: r.bytes,
      })),
      children: f && <Histogram data={f} />,
    },
    {
      area: "storage-access",
      title: "Document Access Activity",
      description: "Previews, downloads and share links in the period",
      source:
        eventsSource +
        " Previews include shared opens; shares count new links.",
      query: access,
      empty:
        a && !a.series.some((r) => r.previews || r.downloads || r.shares)
          ? "No document access was recorded in this period."
          : undefined,
      rows: a?.series.map((r) => ({
        Time: r.timestamp,
        Previews: r.previews,
        Downloads: r.downloads,
        Shares: r.shares,
      })),
      children: a && <Access series={a.series} />,
    },
    {
      area: "storage-largest",
      title: "Largest Documents",
      description: "Largest 20 documents by original storage",
      source:
        originals +
        " Safe titles and sizes only. Open documents through the existing vault preview.",
      query: details,
      empty:
        f && !f.largest.length ? "No finalized document originals." : undefined,
      rows: f?.largest.map((r) => ({
        Document: r.title,
        Vehicle: r.vehicleLabel,
        Bytes: r.bytes,
        Versions: r.versions,
      })),
      children: (
        <div className="storage-document-list">
          {f?.largest.slice(0, 6).map((r) => (
            <Link key={r.id} href={`/documents/${r.id}`}>
              <VaahanIcon name="file" size={18} />
              <span>
                <strong>{r.title}</strong>
                <small>
                  {r.vehicleLabel} · {r.versions} versions
                </small>
              </span>
              <strong>{bytes(r.bytes)}</strong>
            </Link>
          ))}
        </div>
      ),
    },
    {
      area: "storage-atlas",
      title: "Document Atlas",
      description: "Vehicle → category → individual document",
      source:
        originals +
        " Up to 100 individual documents plus server-aggregated remaining groups. Areas reconcile to selected total; opening documents still requires vault authorization.",
      query: details,
      empty:
        f && !f.atlas.length
          ? "Add documents to explore storage visually."
          : undefined,
      rows: f?.atlas.map((r) => ({
        Vehicle: r.vehicleLabel,
        Category: r.category,
        Document: r.title,
        Documents: r.documents,
        Bytes: r.bytes,
      })),
      children: f && <Atlas documents={f.atlas} />,
    },
    {
      area: "storage-efficiency",
      title: "Storage Efficiency",
      description: "Useful observations about your stored originals",
      source:
        originals +
        " Counts are stored original versions, not documents. No optimization score or speculative forecast is calculated.",
      query: details,
      empty:
        f && !f.largest.length
          ? "Add documents to begin reviewing storage."
          : undefined,
      rows: f?.distribution
        .filter((_, index) => index >= 4)
        .map((row) => ({
          Size: row.label,
          Versions: row.count,
          Bytes: row.bytes,
        })),
      children: f && (
        <div className="storage-efficiency-list">
          <div>
            <VaahanIcon name="file" size={19} />
            <span>
              <strong>
                {f.distribution
                  .slice(4)
                  .reduce((sum, row) => sum + row.count, 0)}{" "}
                original versions ≥ 10 MB
              </strong>
              <small>
                {bytes(
                  f.distribution
                    .slice(4)
                    .reduce((sum, row) => sum + row.bytes, 0),
                )}{" "}
                in large originals
              </small>
            </span>
          </div>
          {d && (
            <div>
              <VaahanIcon name="clock" size={19} />
              <span>
                <strong>
                  {d.versions.previousCount} retained previous versions
                </strong>
                <small>
                  {bytes(d.versions.previousBytes)} of original storage
                </small>
              </span>
            </div>
          )}
          <div>
            <VaahanIcon name="database" size={19} />
            <span>
              <strong>Typical original: {bytes(f.median)}</strong>
              <small>90% of originals are {bytes(f.p90)} or smaller</small>
            </span>
          </div>
          <Link className="analytics-link" href="/documents">
            Review files and versions in Document Vault →
          </Link>
        </div>
      ),
    },
    {
      area: "storage-quota",
      title: "Capacity Horizon",
      description: "Account reservation under the current vault policy",
      source:
        originals +
        " The actual enforced policy is shown, not an invented plan allowance. Reservations include thumbnails and pending cleanup and remain account-wide when filtered.",
      query: summary,
      rows: d?.composition.map((r) => ({
        Group: r.label,
        Bytes: r.bytes,
        Versions: r.count,
      })),
      children: (
        <>
          {d && (
            <Usage
              rows={d.composition}
              total={d.bytes}
              reservedBytes={d.reservedBytes}
              quotaBytes={d.quotaBytes}
            />
          )}
          <Link className="analytics-link" href="/documents">
            Manage Document Vault →
          </Link>
        </>
      ),
    },
  ];
  return (
    <div className="storage-dashboard">
      <div className="storage-metric-grid" aria-busy={summary.loading}>
        {metrics.map((m) => (
          <div key={m.label} className="storage-metric-card">
            <span className="storage-metric-icon">
              <VaahanIcon name={m.icon} size={24} />
            </span>
            <div>
              <span>{m.label}</span>
              <strong>
                {m.value ?? (
                  <span
                    className="storage-metric-skeleton"
                    aria-label={
                      summary.error ? "Metric unavailable" : "Loading metric"
                    }
                  />
                )}
              </strong>
              <small>{m.note}</small>
            </div>
          </div>
        ))}
      </div>
      {d && (
        <div className="storage-secondary-metrics">
          {f && (
            <span>
              Largest original <strong>{bytes(f.largestBytes)}</strong>
            </span>
          )}
          <span>
            Average per document{" "}
            <strong>{bytes(d.total ? d.bytes / d.total : 0)}</strong>
          </span>
          <span>
            Expiring in 30 days <strong>{d.expirySummary.month}</strong>
          </span>
          <span>
            Previous versions <strong>{bytes(d.versions.previousBytes)}</strong>
          </span>
        </div>
      )}
      <div className="storage-dashboard-grid">
        {panels.map((p) => (
          <div key={p.area} className={p.area}>
            <ChartFrame
              title={p.title}
              description={p.description}
              source={p.source}
              loading={p.query.loading}
              error={p.query.error}
              retry={p.query.retry}
              rows={p.rows}
              empty={p.empty}
              mobileExpand
              expandedClassName="storage-expanded"
              skeleton={
                <div
                  className={`storage-panel-skeleton ${p.area === "storage-allocation" ? "storage-skeleton-constellation" : ""}`}
                  role="status"
                >
                  <span className="sr-only">
                    Loading {p.title.toLowerCase()}…
                  </span>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              }
            >
              {p.children}
            </ChartFrame>
          </div>
        ))}
        <div className="storage-recent">{activity}</div>
      </div>
    </div>
  );
}
