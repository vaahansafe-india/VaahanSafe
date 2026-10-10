"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@vaahansafe/ui/components/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import { CATEGORIES } from "../document-vault/model";
import { ChartFrame, IconAction, Help } from "./ChartFrame";
import { analyticsOptions, fetchAnalytics } from "./queries";
import {
  defaultFilters,
  parseFilters,
  canonicalSearch,
  shift,
  today,
  scanDelta,
} from "./filters";
import type { Filters, Lens, Section } from "./types";
import "./analytics.css";
const Trend = dynamic(() => import("./Charts").then((m) => m.Trend), {
  ssr: false,
});
const Comparison = dynamic(() => import("./Charts").then((m) => m.Comparison), {
  ssr: false,
});
const VehicleScanChart = dynamic(
  () => import("./Charts").then((m) => m.VehicleScanChart),
  { ssr: false },
);
const Rhythm = dynamic(() => import("./Geometry").then((m) => m.Rhythm), {
  ssr: false,
});
const Ribbon = dynamic(() => import("./Geometry").then((m) => m.Ribbon), {
  ssr: false,
});
const StorageUsage = dynamic(
  () => import("./Charts").then((m) => m.StorageUsage),
  { ssr: false },
);
const Expiry = dynamic(() => import("./Geometry").then((m) => m.Expiry), {
  ssr: false,
});
// Formatters stay outside dynamically loaded chart bundles.
const bytes = (v: number) =>
  v === 0
    ? "0 B"
    : v < 1024
      ? `${v} B`
      : v < 1048576
        ? `${(v / 1024).toFixed(1)} KB`
        : `${(v / 1048576).toFixed(1)} MB`;
const stamp = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
const scanSource =
  "Persisted QR scan events linked to your currently owned QR assignments. Each event ID counts once; known bot/prefetch requests are excluded by ingestion. Times use India Standard Time. These counts describe scans, not vehicle movement.";
const docSource =
  "Current non-deleted documents and their finalized original versions. Failed and pending uploads are excluded. Original bytes include retained versions; the account reservation also covers thumbnails and pending cleanup. Document counts and storage are current snapshots; activity uses the selected date range.";
function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs text-muted-foreground">
      <span>{label}</span>
      <Select
        value={value || "all"}
        onValueChange={(v) => onChange(v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-11 bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map(([v, l]) => (
            <SelectItem key={v || "all"} value={v || "all"}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
function useAnalytics<S extends Section>(
  section: S,
  filters: Filters,
  enabled: boolean,
) {
  return useQuery({
    ...analyticsOptions(useCustomerScope(), section, filters),
    enabled,
  });
}
export function AnalyticsWorkspace({
  initialLens = "overview",
  dedicated = false,
}: {
  initialLens?: Lens;
  dedicated?: boolean;
}) {
  const [filters, setFilters] = useState(defaultFilters),
    [lens, setLens] = useState<Lens>(initialLens),
    [preset, setPreset] = useState("30"),
    [filterOpen, setFilterOpen] = useState(false),
    [draft, setDraft] = useState(filters),
    [filterError, setFilterError] = useState(""),
    [vehicleDetail, setVehicleDetail] = useState("");
  const scope = useCustomerScope(),
    client = useQueryClient();
  const context = useAnalytics("context", filters, true);
  const vehicles = useAnalytics(
    "vehicles",
    filters,
    lens === "overview" || lens === "vehicles",
  );
  const scans = useAnalytics(
    "scans",
    filters,
    lens === "overview" || lens === "scans",
  );
  const documents = useAnalytics(
    "documents",
    filters,
    lens === "overview" || lens === "documents",
  );
  const security = useAnalytics(
    "security",
    filters,
    lens === "overview" || lens === "security",
  );
  const network = useAnalytics("network", filters, lens === "network");
  const activitySearch = canonicalSearch("activity", filters);
  const feed = useInfiniteQuery({
    queryKey: ["customer-analytics", scope, "activity", activitySearch],
    initialPageParam: "",
    queryFn: ({ signal, pageParam }) =>
      fetchAnalytics(
        scope,
        "activity",
        activitySearch +
          (pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""),
        signal,
      ),
    getNextPageParam: (last) => last.data.cursor || undefined,
    enabled: lens === "overview" || lens === "network",
    staleTime: 60000,
    gcTime: 300000,
    retry: false,
  });
  const detailFilters = useMemo(
    () => ({ ...filters, vehicle: vehicleDetail, qr: "" }),
    [filters, vehicleDetail],
  );
  const detailVehicle = useAnalytics(
    "vehicles",
    detailFilters,
    !!vehicleDetail,
  );
  const detailScans = useAnalytics("scans", detailFilters, !!vehicleDetail);
  const v = vehicles.data?.data,
    s = scans.data?.data,
    d = documents.data?.data,
    a = security.data?.data,
    n = network.data?.data;
  const relevant =
    lens === "overview"
      ? [vehicles, scans, documents, security]
      : lens === "vehicles"
        ? [vehicles]
        : lens === "scans"
          ? [scans]
          : lens === "documents"
            ? [documents]
            : lens === "security"
              ? [security]
              : [network];
  const pending = relevant.some((q) => q.isFetching),
    updated = relevant
      .map((q) => q.data?.updatedAt)
      .filter((x): x is string => !!x)
      .sort()
      .at(-1);
  const activeFilters = [
    filters.qr,
    filters.outcome,
    filters.category,
    filters.event,
    filters.device,
    filters.region,
    filters.grouping !== "auto" ? filters.grouping : "",
  ].filter(Boolean).length;
  const chooseVehicle = (id: string) =>
    setFilters((old) => ({ ...old, vehicle: id, qr: "" }));
  const refresh = () =>
    void client.invalidateQueries({
      queryKey: ["customer-analytics", scope],
      refetchType: "active",
    });
  const rangePreset = (value: string) => {
    setPreset(value);
    if (value === "custom") {
      setDraft(filters);
      setFilterError("");
      setFilterOpen(true);
      return;
    }
    const end = today();
    setFilters((old) => ({
      ...old,
      from:
        value === "year"
          ? end.slice(0, 4) + "-01-01"
          : shift(end, 1 - Number(value)),
      to: end,
      grouping: "auto",
    }));
  };
  const scanRows =
    s?.series.map((row) => ({
      Time: stamp(row.timestamp),
      Scans: row.value,
      "Active safety view": row.successful ?? 0,
      "Previous period": row.previous ?? null,
    })) || [];
  const scanPanel = (
    <ChartFrame
      title="Scan activity"
      description={`Recorded QR activity · ${scans.data?.range.granularity || "adaptive"} buckets · IST`}
      source={scanSource}
      loading={scans.isFetching}
      error={scans.isError}
      retry={() => void scans.refetch()}
      empty={
        s && !s.total
          ? "No scans were recorded during this period. Change the date range or open Scan History."
          : undefined
      }
      rows={scanRows}
    >
      {s && (
        <>
          <Trend series={s.series} compare={filters.compare} successful />
          {filters.compare && (
            <p className="analytics-chart-note">
              {scanDelta(s.total, s.previousTotal)}
            </p>
          )}
        </>
      )}
    </ChartFrame>
  );
  const storagePanel = (
    <ChartFrame
      title="Document storage"
      description="Finalized originals and retained versions · current snapshot"
      source={docSource}
      loading={documents.isFetching}
      error={documents.isError}
      retry={() => void documents.refetch()}
      rows={d?.composition.map((r) => ({
        Type: r.label,
        "Original bytes": r.bytes,
        Versions: r.count,
      }))}
    >
      {d && (
        <>
          <StorageUsage
            rows={d.composition}
            total={d.bytes}
            reservedBytes={d.reservedBytes}
            quotaBytes={d.quotaBytes}
          />
          <Link className="analytics-link" href="/documents">
            Open Document Vault →
          </Link>
        </>
      )}
    </ChartFrame>
  );
  const securityPanel = (
    <ChartFrame
      title="Account sessions"
      description="Your active sessions · current snapshot"
      summary={a ? `${a.activeSessions} active sessions` : undefined}
      source="Real account sessions, with coarse device classes only. Last successful sign-in is the newest retained session creation; revoked/expired sessions are excluded from the active list. This view is account-wide, independent of the vehicle filter."
      loading={security.isFetching}
      error={security.isError}
      retry={() => void security.refetch()}
      rows={a?.sessions.map((r) => ({
        Device: r.device,
        Current: r.current ? "Yes" : "No",
        "Signed in": stamp(r.created),
        "Last active": stamp(r.lastSeen),
      }))}
    >
      {a && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Last retained sign-in:{" "}
            {a.lastLogin ? stamp(a.lastLogin) : "Not recorded"}
          </p>
          {a.sessions.map((r, i) => (
            <div key={r.created + String(i)} className="analytics-session">
              <VaahanIcon name="phone" size={18} />
              <div>
                <strong>
                  {r.device} {r.current && "· Current session"}
                </strong>
                <p>Last active {stamp(r.lastSeen)}</p>
              </div>
            </div>
          ))}
          <Link className="analytics-link" href="/settings/security">
            Manage sessions →
          </Link>
        </div>
      )}
    </ChartFrame>
  );
  const feedRows = feed.data?.pages.flatMap((p) => p.data.events) || [];
  const activityPanel = (
    <ChartFrame
      title="Recent activity"
      description="Connected vehicle, QR, document and account events"
      source="A bounded, owner-scoped stream of persisted events, ordered by occurrence and stable source ID. Account and notification activity are omitted when a vehicle or QR is selected. Select an event type in Filters to narrow the stream."
      loading={feed.isFetching && !feed.isFetchingNextPage}
      error={feed.isError}
      retry={() => void feed.refetch()}
      empty={
        feed.data && !feedRows.length
          ? "No activity matches this range and filter."
          : undefined
      }
      rows={feedRows.map((r) => ({
        Time: stamp(r.timestamp),
        Activity: r.title,
        Reference: r.reference,
      }))}
    >
      <ol className="analytics-feed">
        {feedRows.map((event) => (
          <li key={event.id}>
            <span className="analytics-event-mark" aria-hidden="true" />
            <div>
              <Link href={event.href} className="font-medium hover:underline">
                {event.title}
              </Link>
              <p className="text-xs text-muted-foreground break-words">
                {event.reference}
              </p>
            </div>
            <time dateTime={event.timestamp}>{stamp(event.timestamp)}</time>
          </li>
        ))}
      </ol>
      {feed.hasNextPage && (
        <Button
          variant="outline"
          className="mt-4"
          disabled={feed.isFetchingNextPage}
          onClick={() => void feed.fetchNextPage()}
        >
          {feed.isFetchingNextPage ? "Loading…" : "Load more activity"}
        </Button>
      )}
    </ChartFrame>
  );
  return (
    <TooltipProvider delayDuration={200}>
      <main className="analytics-workspace">
        <header className="analytics-page-header">
          <div>
            <p className="analytics-eyebrow">
              {dedicated ? "Scan Analytics" : "Usage & Analytics"}
            </p>
            <h1>
              {dedicated
                ? "Your QR scan activity."
                : "Your VaahanSafe activity, in one view."}
            </h1>
            <p>
              {dedicated
                ? "Explore recorded QR scans, their outcomes and coarse regions over time."
                : "Understand how your vehicles, QR identities, documents and account have been used over time."}
            </p>
          </div>
          <Help text="Scans and activity follow your selected range. Vehicles, stored documents, storage and active sessions describe the current state. All time buckets use India Standard Time." />
        </header>
        <div className="analytics-toolbar">
          <SelectFilter
            label="Date range"
            value={preset}
            onChange={rangePreset}
            options={[
              ["1", "Today"],
              ["7", "Last 7 days"],
              ["30", "Last 30 days"],
              ["90", "Last 90 days"],
              ["year", "This year"],
              ["custom", "Custom range"],
            ]}
          />
          <SelectFilter
            label="Vehicle"
            value={filters.vehicle}
            onChange={chooseVehicle}
            options={[
              ["", "All vehicles"],
              ...(context.data?.data.vehicles.map(
                (v) => [v.id, v.label] as [string, string],
              ) || []),
            ]}
          />
          <SelectFilter
            label="Compare scans"
            value={filters.compare ? "previous" : "off"}
            onChange={(v) =>
              setFilters((f) => ({ ...f, compare: v === "previous" }))
            }
            options={[
              ["off", "Off"],
              ["previous", "Previous period"],
            ]}
          />
          <Button
            className="h-11 self-end gap-2"
            variant="outline"
            onClick={() => {
              setDraft(filters);
              setFilterError("");
              setFilterOpen(true);
            }}
          >
            <VaahanIcon name="filter" size={16} />
            Filters{activeFilters > 0 && ` · ${activeFilters}`}
          </Button>
          <div className="self-end">
            <IconAction
              icon="refresh"
              label="Refresh active analytics"
              onClick={refresh}
              disabled={pending}
            />
          </div>
        </div>
        {context.isError && (
          <div role="alert" className="analytics-notice">
            Vehicle filters could not be loaded.
            <Button variant="ghost" onClick={() => void context.refetch()}>
              Retry
            </Button>
          </div>
        )}
        <div className="analytics-range-note" role="status">
          {filters.from} — {filters.to} · India Standard Time
          {pending
            ? " · Updating; previous results stay visible"
            : updated
              ? ` · Updated ${stamp(updated)}`
              : ""}
        </div>
        <Tabs value={lens} onValueChange={(value) => setLens(value as Lens)}>
          <div className={dedicated ? "hidden" : "analytics-tab-scroll"}>
            <TabsList className="h-auto min-w-max justify-start rounded-none border-b border-border bg-transparent p-0">
              {(
                [
                  "overview",
                  "vehicles",
                  "scans",
                  "documents",
                  "security",
                  "network",
                ] as Lens[]
              ).map((name) => (
                <TabsTrigger
                  key={name}
                  value={name}
                  className="min-h-11 rounded-none border-b-2 border-transparent data-[state=active]:border-[#cc785c] data-[state=active]:shadow-none capitalize"
                >
                  {name === "documents"
                    ? "Storage"
                    : name === "network"
                      ? "Usage"
                      : name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="overview">
            <div
              className="analytics-metric-strip"
              aria-label="Current usage and selected-period scans"
            >
              {[
                ["Vehicles", v?.vehicles.length],
                ["Scans", s?.total],
                ["Documents", d?.total],
                ["Stored originals", d ? bytes(d.bytes) : undefined],
              ].map(([label, value]) => (
                <button
                  type="button"
                  key={String(label)}
                  onClick={() =>
                    setLens(
                      label === "Vehicles"
                        ? "vehicles"
                        : label === "Scans"
                          ? "scans"
                          : "documents",
                    )
                  }
                >
                  <span>{label}</span>
                  <strong>{value ?? "—"}</strong>
                  <small>
                    {label === "Scans" ? "Selected period" : "Current snapshot"}
                  </small>
                </button>
              ))}
            </div>
            <div className="analytics-grid">
              <div className="analytics-full">{scanPanel}</div>
              <div className="analytics-wide">
                <ChartFrame
                  title="Scans by vehicle"
                  description="Recorded QR scans per vehicle in the selected period"
                  source={
                    scanSource +
                    " The chart shows up to 15 vehicles ranked by scan count. Select a bar to filter the workspace; current document totals appear in its tooltip."
                  }
                  loading={vehicles.isFetching}
                  error={vehicles.isError}
                  retry={() => void vehicles.refetch()}
                  empty={
                    v && !v.vehicles.some((vehicle) => vehicle.scans > 0)
                      ? "No vehicle scans were recorded in this period. Change the date range to see activity."
                      : undefined
                  }
                  rows={v?.vehicles.map((r) => ({
                    Vehicle: r.label,
                    QR: r.qr,
                    Scans: r.scans,
                    Documents: r.documents,
                  }))}
                >
                  {v && (
                    <VehicleScanChart
                      vehicles={v.vehicles}
                      onSelect={chooseVehicle}
                    />
                  )}
                </ChartFrame>
              </div>
              <div>{storagePanel}</div>
              <div>{securityPanel}</div>
              <div className="analytics-wide">{activityPanel}</div>
            </div>
          </TabsContent>
          <TabsContent value="vehicles">
            <div className="analytics-grid">
              <div className="analytics-wide">
                <ChartFrame
                  title="Vehicle activity ribbon"
                  description="A chronology of scan, document and activation events"
                  source="Database-aggregated time buckets for owned vehicles; latest 400 non-empty buckets. Marks are activity observations and do not represent a vehicle travel route."
                  loading={vehicles.isFetching}
                  error={vehicles.isError}
                  retry={() => void vehicles.refetch()}
                  empty={
                    v && !v.ribbon.length
                      ? "No vehicle activity was recorded for this range."
                      : undefined
                  }
                  rows={v?.ribbon.map((r) => ({
                    Vehicle:
                      v.vehicles.find((v) => v.id === r.vehicle)?.label ||
                      "Vehicle",
                    Time: stamp(r.timestamp),
                    Scans: r.scans,
                    "Document events": r.documents,
                    Activations: r.activations,
                  }))}
                >
                  {v && (
                    <Ribbon
                      vehicles={v.vehicles}
                      events={v.ribbon}
                      from={vehicles.data!.range.from}
                      to={vehicles.data!.range.to}
                    />
                  )}
                </ChartFrame>
              </div>
              <div>
                <ChartFrame
                  title="Vehicle comparison"
                  description="Scans per vehicle · selected period"
                  source={
                    scanSource +
                    " Showing up to 15 vehicles, with the full values in View data."
                  }
                  loading={vehicles.isFetching}
                  error={vehicles.isError}
                  retry={() => void vehicles.refetch()}
                  empty={
                    v && !v.vehicles.some((v) => v.scans)
                      ? "No scan activity for these vehicles."
                      : undefined
                  }
                  rows={v?.vehicles.map((r) => ({
                    Vehicle: r.label,
                    Scans: r.scans,
                  }))}
                >
                  {v && (
                    <Comparison
                      data={v.vehicles.map((r) => ({
                        id: r.id,
                        label: r.label,
                        value: r.scans,
                      }))}
                      onSelect={chooseVehicle}
                    />
                  )}
                </ChartFrame>
              </div>
              <div className="analytics-full">
                <ChartFrame
                  title="Your vehicles"
                  description="Current identity and document usage, alongside selected-period scans"
                  source="QR identity is a display reference. This page does not grant service entitlement or expose activation credentials."
                  loading={vehicles.isFetching}
                  error={vehicles.isError}
                  retry={() => void vehicles.refetch()}
                  empty={
                    v && !v.vehicles.length
                      ? "No owned vehicles match this filter."
                      : undefined
                  }
                  rows={v?.vehicles.map((r) => ({
                    Vehicle: r.label,
                    Scans: r.scans,
                    Documents: r.documents,
                    "Expiring soon": r.expiring,
                    "Original bytes": r.bytes,
                  }))}
                >
                  <div className="analytics-vehicle-list">
                    {v?.vehicles.map((row) => (
                      <button
                        className="analytics-vehicle-node"
                        key={row.id}
                        onClick={() => setVehicleDetail(row.id)}
                      >
                        <strong>
                          {row.label} · {row.name}
                        </strong>
                        <span>{row.qr || "QR not connected"}</span>
                        <span>
                          {row.scans} scans · {row.documents} documents ·{" "}
                          {row.expiring} expiring soon
                        </span>
                        <span>
                          Last scan{" "}
                          {row.lastScan
                            ? stamp(row.lastScan)
                            : "not recorded in this range"}
                        </span>
                      </button>
                    ))}
                  </div>
                </ChartFrame>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="scans">
            <div className="analytics-grid">
              <div className="analytics-full">{scanPanel}</div>
              <div className="analytics-wide">
                <ChartFrame
                  title="Scan rhythm"
                  description="Weekday × hour · India Standard Time"
                  source={
                    scanSource +
                    " Heatmap color represents count; the data table provides exact hourly totals."
                  }
                  loading={scans.isFetching}
                  error={scans.isError}
                  retry={() => void scans.refetch()}
                  empty={
                    s && !s.total
                      ? "No recorded scans to form a rhythm."
                      : undefined
                  }
                  rows={s?.rhythm.map((r) => ({
                    Day: [
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ][r.day]!,
                    Hour: `${r.hour}:00`,
                    Scans: r.count,
                  }))}
                >
                  {s && <Rhythm cells={s.rhythm} />}
                </ChartFrame>
              </div>
              <div>
                <ChartFrame
                  title="Scan regions"
                  description="Coarse geography where recorded"
                  source="Region labels come from the scan request's approximate edge geography. They are not GPS positions or confirmed vehicle locations. Missing regions stay marked as not recorded."
                  loading={scans.isFetching}
                  error={scans.isError}
                  retry={() => void scans.refetch()}
                  empty={
                    s && !s.regions.length
                      ? "No coarse geographic activity recorded."
                      : undefined
                  }
                  rows={s?.regions.map((r) => ({
                    Region: r.label,
                    Scans: r.count,
                  }))}
                >
                  {s && (
                    <Comparison
                      data={s.regions.map((r) => ({
                        id: r.label === "Not recorded" ? null : r.label,
                        label: r.label,
                        value: r.count,
                      }))}
                      onSelect={(region) =>
                        setFilters((f) => ({
                          ...f,
                          region: f.region === region ? "" : region,
                        }))
                      }
                    />
                  )}
                  <p className="analytics-chart-note">
                    Select a region bar to filter ·{" "}
                    {filters.region || "All regions"}
                  </p>
                </ChartFrame>
              </div>
              <div className="analytics-full">
                <ChartFrame
                  title="Scan outcomes"
                  description="Recorded safety view results"
                  source="RESOLVED_ACTIVE means the active safety projection was returned. Inactive, replaced and blocked results describe lifecycle gates, not failed network requests."
                  rows={s?.outcomes.map((r) => ({
                    Outcome: r.label,
                    Count: r.count,
                  }))}
                  empty={
                    s && !s.outcomes.length
                      ? "No outcomes recorded."
                      : undefined
                  }
                  loading={scans.isFetching}
                  error={scans.isError}
                  retry={() => void scans.refetch()}
                >
                  {s && (
                    <Comparison
                      data={s.outcomes.map((r) => ({
                        id: null,
                        label: r.label.replaceAll("_", " ").toLowerCase(),
                        value: r.count,
                      }))}
                      label="Recorded outcomes"
                    />
                  )}
                </ChartFrame>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="documents">
            <div className="analytics-grid">
              <div>{storagePanel}</div>
              <div className="analytics-wide">
                <ChartFrame
                  title="Storage by vehicle"
                  description="Finalized original bytes including retained versions"
                  source={
                    docSource +
                    " Select a vehicle bar to filter; account documents remain separate."
                  }
                  rows={d?.byVehicle.map((r) => ({
                    Vehicle: r.label,
                    Bytes: r.bytes,
                  }))}
                  loading={documents.isFetching}
                  error={documents.isError}
                  retry={() => void documents.refetch()}
                  empty={
                    d && !d.bytes ? "No finalized original storage." : undefined
                  }
                >
                  {d && (
                    <Comparison
                      data={d.byVehicle.map((r) => ({ ...r, value: r.bytes }))}
                      bytes
                      onSelect={chooseVehicle}
                    />
                  )}
                </ChartFrame>
              </div>
              <div>
                <ChartFrame
                  title="Document expiry"
                  description="Current documents ordered by expiry"
                  source="Actual document expiry dates. Up to 50 nearest expiry records, including already expired copies. Opening a document still requires its vault permissions."
                  rows={d?.expiry.map((r) => ({
                    Document: r.title,
                    Expiry: r.date,
                  }))}
                  empty={
                    d && !d.expiry.length
                      ? "No expiry dates are recorded."
                      : undefined
                  }
                  loading={documents.isFetching}
                  error={documents.isError}
                  retry={() => void documents.refetch()}
                >
                  {d && <Expiry documents={d.expiry} />}
                </ChartFrame>
              </div>
              <div className="analytics-wide">
                <ChartFrame
                  title="Vault activity"
                  description="Meaningful document actions in the selected period"
                  source="Persisted upload, preview, share, download, replacement and security events. Previews/downloads count authorization requests, not confirmed completed reads. Thumbnail requests are not counted as previews."
                  rows={d?.series.map((r) => ({
                    Time: stamp(r.timestamp),
                    Events: r.value,
                  }))}
                  empty={
                    d && !d.activity.length
                      ? "No vault activity recorded in this range."
                      : undefined
                  }
                  loading={documents.isFetching}
                  error={documents.isError}
                  retry={() => void documents.refetch()}
                >
                  {d && (
                    <>
                      <Trend series={d.series} label="Document events" />
                      <div className="analytics-breakdown">
                        {d.activity.map((r) => (
                          <div
                            className="analytics-breakdown-row"
                            key={r.label}
                          >
                            <span>
                              {r.label.toLowerCase().replaceAll("_", " ")}
                            </span>
                            <strong>{r.count}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </ChartFrame>
              </div>
              <div className="analytics-full analytics-notice">
                <p>
                  {d && (
                    <>
                      Account storage reservation: {bytes(d.reservedBytes || 0)}{" "}
                      of {bytes(d.quotaBytes)} under the current vault
                      policy.{" "}
                    </>
                  )}
                  Historical storage snapshots have not been recorded, so a past
                  storage growth curve is unavailable.
                </p>
                <Link className="analytics-link" href="/documents">
                  Open Document Vault →
                </Link>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="security">
            <div className="analytics-grid">
              <div className="analytics-wide">
                <ChartFrame
                  title="Sign-in activity"
                  description="Retained session creations · account-wide"
                  source="Session creation is evidence of a completed sign-in. This is not a complete immutable login audit: deleted sessions no longer contribute. Failed-login history and vault-unlock failures are not currently recorded as customer analytics."
                  rows={a?.series.map((r) => ({
                    Time: stamp(r.timestamp),
                    "Sessions created": r.value,
                  }))}
                  empty={
                    a && !a.series.some((r) => r.value)
                      ? "No retained sign-ins in this range."
                      : undefined
                  }
                  loading={security.isFetching}
                  error={security.isError}
                  retry={() => void security.refetch()}
                >
                  {a && <Trend series={a.series} label="Sessions created" />}
                </ChartFrame>
              </div>
              <div>{securityPanel}</div>
              <div className="analytics-full">
                <ChartFrame
                  title="Security activity"
                  description="Recorded account changes"
                  source="Only allowlisted, owner-scoped security events are projected. No request details, tokens, IP addresses or raw device strings are returned."
                  rows={a?.events.map((r) => ({
                    Time: stamp(r.timestamp),
                    Activity: r.title,
                  }))}
                  empty={
                    a && !a.events.length
                      ? "No supported security events were recorded in this range."
                      : undefined
                  }
                  loading={security.isFetching}
                  error={security.isError}
                  retry={() => void security.refetch()}
                >
                  <ol className="analytics-feed">
                    {a?.events.map((r) => (
                      <li key={r.id}>
                        <span className="analytics-event-mark" />
                        <span>{r.title}</span>
                        <time dateTime={r.timestamp}>{stamp(r.timestamp)}</time>
                      </li>
                    ))}
                  </ol>
                </ChartFrame>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="network">
            <div className="analytics-grid">
              <div className="analytics-wide">
                <ChartFrame
                  title="Your service experience"
                  description="Observed QR resolutions · selected period"
                  source="A safety view ratio describes QR lifecycle outcomes, not network availability. Telemetry is best-effort and this view cannot establish platform uptime. Latency and delivery failures are not recorded as account-scoped metrics."
                  rows={n?.series.map((r) => ({
                    Time: stamp(r.timestamp),
                    Resolutions: r.value,
                    "Active safety views": r.successful ?? 0,
                  }))}
                  empty={
                    n && !n.observed
                      ? "No recorded QR service observations in this range."
                      : undefined
                  }
                  loading={network.isFetching}
                  error={network.isError}
                  retry={() => void network.refetch()}
                >
                  {n && <Trend series={n.series} network successful />}
                </ChartFrame>
              </div>
              <div>
                <ChartFrame
                  title="Upload outcomes"
                  description="Recorded original-version processing states"
                  source="Actual upload reservations created in this range. Pending uploads are not successes; finalized READY versions are confirmed uploads. This is an observed processing count, not availability."
                  rows={n?.uploads.map((r) => ({
                    State: r.label,
                    Count: r.count,
                  }))}
                  empty={
                    n && !n.uploads.length
                      ? "No uploads recorded in this range."
                      : undefined
                  }
                  loading={network.isFetching}
                  error={network.isError}
                  retry={() => void network.refetch()}
                >
                  {n && (
                    <Comparison
                      data={n.uploads.map((r) => ({
                        id: null,
                        label: r.label.toLowerCase().replaceAll("_", " "),
                        value: r.count,
                      }))}
                      label="Uploads"
                    />
                  )}
                </ChartFrame>
              </div>
              <div className="analytics-full">
                <ChartFrame
                  title="Notification delivery"
                  description="Provider-recorded delivery states · account-wide"
                  source="Counts use real delivery records associated with your notification rows. This account-wide section is omitted when a vehicle or QR filter is set, since the delivery source lacks a reliable vehicle dimension."
                  rows={n?.notifications.map((r) => ({
                    State: r.label,
                    Count: r.count,
                  }))}
                  empty={
                    n && !n.notifications.length
                      ? filters.vehicle || filters.qr
                        ? "Clear vehicle and QR filters to view account notification delivery."
                        : "No notification delivery records in this range."
                      : undefined
                  }
                  loading={network.isFetching}
                  error={network.isError}
                  retry={() => void network.refetch()}
                >
                  {n && (
                    <Comparison
                      data={n.notifications.map((r) => ({
                        id: null,
                        label: r.label.toLowerCase().replaceAll("_", " "),
                        value: r.count,
                      }))}
                      label="Delivery records"
                    />
                  )}
                </ChartFrame>
              </div>
              <div className="analytics-full">{activityPanel}</div>
            </div>
          </TabsContent>
        </Tabs>
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent className="flex flex-col overflow-hidden p-0 max-sm:w-full">
            <SheetHeader className="border-b border-border p-5">
              <SheetTitle>Filter analytics</SheetTitle>
              <SheetDescription>
                Apply filters to the sources they describe. Account security
                stays independent of vehicle selections.
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs">From</label>
                  <DatePicker
                    value={draft.from}
                    onChange={(from) => setDraft((f) => ({ ...f, from }))}
                  />
                </div>
                <div>
                  <label className="text-xs">To</label>
                  <DatePicker
                    value={draft.to}
                    onChange={(to) => setDraft((f) => ({ ...f, to }))}
                  />
                </div>
              </div>
              <SelectFilter
                label="Vehicle"
                value={draft.vehicle}
                onChange={(vehicle) =>
                  setDraft((f) => ({ ...f, vehicle, qr: "" }))
                }
                options={[
                  ["", "All vehicles"],
                  ...(context.data?.data.vehicles.map(
                    (v) => [v.id, v.label] as [string, string],
                  ) || []),
                ]}
              />
              <SelectFilter
                label="QR identity"
                value={draft.qr}
                onChange={(qr) => setDraft((f) => ({ ...f, qr }))}
                options={[
                  ["", "All identities"],
                  ...(context.data?.data.qrs
                    .filter(
                      (q) => !draft.vehicle || q.vehicle === draft.vehicle,
                    )
                    .map((q) => [q.id, q.label] as [string, string]) || []),
                ]}
              />
              <SelectFilter
                label="Scan outcome"
                value={draft.outcome}
                onChange={(outcome) => setDraft((f) => ({ ...f, outcome }))}
                options={[
                  ["", "All outcomes"],
                  ...[
                    "RESOLVED_ACTIVE",
                    "RESOLVED_INACTIVE",
                    "RESOLVED_REPLACED",
                    "RESOLVED_BLOCKED",
                    "NOT_FOUND",
                  ].map(
                    (v) =>
                      [v, v.replaceAll("_", " ").toLowerCase()] as [
                        string,
                        string,
                      ],
                  ),
                ]}
              />
              <SelectFilter
                label="Document type"
                value={draft.category}
                onChange={(category) => setDraft((f) => ({ ...f, category }))}
                options={[
                  ["", "All document types"],
                  ...Object.entries(CATEGORIES),
                ]}
              />
              <SelectFilter
                label="Activity event"
                value={draft.event}
                onChange={(event) => setDraft((f) => ({ ...f, event }))}
                options={[
                  ["", "All events"],
                  ...[
                    "SCAN",
                    "DOCUMENT",
                    "ACCOUNT",
                    "NOTIFICATION",
                    "ACTIVATION",
                  ].map((v) => [v, v.toLowerCase()] as [string, string]),
                ]}
              />
              <SelectFilter
                label="Session device"
                value={draft.device}
                onChange={(device) => setDraft((f) => ({ ...f, device }))}
                options={[
                  ["", "All devices"],
                  ...["Mobile", "Tablet", "Desktop", "Unknown"].map(
                    (v) => [v, v] as [string, string],
                  ),
                ]}
              />
              <SelectFilter
                label="Time grouping"
                value={draft.grouping}
                onChange={(grouping) =>
                  setDraft((f) => ({
                    ...f,
                    grouping: grouping as Filters["grouping"],
                  }))
                }
                options={[
                  ["auto", "Automatic"],
                  ["hour", "Hourly · up to 2 days"],
                  ["day", "Daily"],
                  ["week", "Weekly"],
                  ["month", "Monthly"],
                ]}
              />
              {draft.region && (
                <Button
                  variant="outline"
                  onClick={() => setDraft((f) => ({ ...f, region: "" }))}
                >
                  Clear region: {draft.region}
                </Button>
              )}
              {filterError && (
                <p role="alert" className="text-sm text-destructive">
                  {filterError}
                </p>
              )}
            </div>
            <footer className="flex justify-between gap-3 border-t border-border bg-background p-5">
              <Button
                variant="outline"
                onClick={() => setDraft(defaultFilters())}
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  try {
                    const params = new URLSearchParams();
                    Object.entries(draft).forEach(([k, v]) =>
                      params.set(k, String(v)),
                    );
                    setFilters(parseFilters(params));
                    setPreset("custom");
                    setFilterOpen(false);
                  } catch (e) {
                    setFilterError(
                      e instanceof Error
                        ? e.message
                        : "Choose supported filters.",
                    );
                  }
                }}
              >
                Apply filters
              </Button>
            </footer>
          </SheetContent>
        </Sheet>
        <Sheet
          open={!!vehicleDetail}
          onOpenChange={(open) => {
            if (!open) setVehicleDetail("");
          }}
        >
          <SheetContent className="overflow-y-auto sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>
                {detailVehicle.data?.data.vehicles[0]?.label ||
                  "Vehicle activity"}
              </SheetTitle>
              <SheetDescription>
                Selected-period QR activity and current document usage.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <ChartFrame
                title="Vehicle summary"
                description={
                  detailVehicle.data?.data.vehicles[0]?.name || "Owned vehicle"
                }
                source="Loaded only when you open this vehicle."
                loading={detailVehicle.isFetching}
                error={detailVehicle.isError}
                retry={() => void detailVehicle.refetch()}
                rows={detailVehicle.data?.data.vehicles.map((v) => ({
                  Scans: v.scans,
                  Documents: v.documents,
                  QR: v.qr,
                  "Expiring soon": v.expiring,
                }))}
              >
                {detailVehicle.data?.data.vehicles.map((v) => (
                  <div className="analytics-vehicle-node" key={v.id}>
                    <strong>{v.qr || "QR not connected"}</strong>
                    <span>
                      {v.scans} scans · {v.documents} documents
                    </span>
                    <span>
                      {v.expiring} expiring soon · {bytes(v.bytes)} originals
                    </span>
                    <span>
                      Activated{" "}
                      {v.activatedAt ? stamp(v.activatedAt) : "not recorded"}
                    </span>
                  </div>
                ))}
                {detailVehicle.data?.data.subscriptions.map((r, i) => (
                  <p className="text-sm" key={i}>
                    {r.name} · {r.tier} · {r.status}
                  </p>
                ))}
              </ChartFrame>
              <ChartFrame
                title="Vehicle scans"
                description="Scan trend"
                source={scanSource}
                rows={detailScans.data?.data.series.map((r) => ({
                  Time: stamp(r.timestamp),
                  Scans: r.value,
                }))}
                empty={
                  detailScans.data && !detailScans.data.data.total
                    ? "No scans in this range."
                    : undefined
                }
                loading={detailScans.isFetching}
                error={detailScans.isError}
                retry={() => void detailScans.refetch()}
              >
                {detailScans.data && (
                  <Trend series={detailScans.data.data.series} />
                )}
              </ChartFrame>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="analytics-link"
                  href={`/vehicles/${vehicleDetail}`}
                >
                  Open vehicle →
                </Link>
                <Link
                  className="analytics-link"
                  href={`/vehicles/${vehicleDetail}/documents`}
                >
                  Open vehicle documents →
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </TooltipProvider>
  );
}
