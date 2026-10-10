"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DatePicker } from "@/components/ui/date-picker";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import { analyticsOptions, fetchAnalytics } from "./queries";
import {
  canonicalSearch,
  defaultFilters,
  parseFilters,
  scanDelta,
  shift,
  today,
} from "./filters";
import { ChartFrame, Help, IconAction, type DataRow } from "./ChartFrame";
import {
  INDIA_REGIONS,
  SCAN_OUTCOMES,
  outcomeLabel,
  scanStamp,
  scanColors,
} from "./scan-model";
import type { AnalyticsData, Filters, Section, ScanRecord } from "./types";
import "./analytics.css";
import "./scan.css";
const fallback = () => (
  <div className="scan-visual-skeleton" aria-label="Loading visualization" />
);
const ScanTimeline = dynamic(
  () => import("./ScanCharts").then((m) => m.ScanTimeline),
  { ssr: false, loading: fallback },
);
const ScanSparkline = dynamic(
  () => import("./ScanCharts").then((m) => m.ScanSparkline),
  { ssr: false },
);
const TopScanQrs = dynamic(
  () => import("./ScanCharts").then((m) => m.TopScanQrs),
  { ssr: false, loading: fallback },
);
const ScanFlowJourney = dynamic(
  () => import("./ScanVisuals").then((m) => m.ScanFlowJourney),
  { ssr: false, loading: fallback },
);
const IndiaScanMap = dynamic(
  () => import("./ScanVisuals").then((m) => m.IndiaScanMap),
  { ssr: false, loading: fallback },
);
const ScanTimeHeatmap = dynamic(
  () => import("./ScanVisuals").then((m) => m.ScanTimeHeatmap),
  { ssr: false, loading: fallback },
);
const ScanRhythm = dynamic(
  () => import("./ScanVisuals").then((m) => m.ScanRhythm),
  { ssr: false, loading: fallback },
);
const ScanCalendar = dynamic(
  () => import("./ScanVisuals").then((m) => m.ScanCalendar),
  { ssr: false, loading: fallback },
);
const SOURCE =
  "One persisted QR scan event is one observation, scoped to your currently owned QR assignments. Active safety view means the resolver returned an active profile; it does not prove the profile was viewed. Activation required is the recorded inactive outcome. Other outcomes include blocked, replaced, missing and unrecorded outcomes. Times are India Standard Time. No raw IP or scanner identity is exposed.";
function Filter({
  label,
  value,
  change,
  options,
}: {
  label: string;
  value: string;
  change: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="scan-filter">
      <span>{label}</span>
      <Select
        value={value || "all"}
        onValueChange={(v) => change(v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-11 bg-card">
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
function Summary({
  data,
  loading,
  error,
  retry,
}: {
  data?: AnalyticsData["scan-summary"];
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const metrics: Array<{
    label: string;
    icon: VaahanIconName;
    value?: number;
    field?: "total" | "successful" | "unsuccessful" | "partial";
    previous?: number;
    note: string;
    color: string;
  }> = [
    {
      label: "Total scans",
      icon: "qr-code",
      value: data?.total,
      field: "total",
      previous: data?.previousTotal,
      note: "Recorded observations",
      color: scanColors[2],
    },
    {
      label: "Successful resolutions",
      icon: "shield-check",
      value: data?.successful,
      field: "successful",
      previous: data?.previousSuccessful,
      note: data?.total
        ? `${Math.round((data.successful / data.total) * 100)}% active safety views`
        : "Active safety views",
      color: scanColors[0],
    },
    {
      label: "Non-active resolutions",
      icon: "shield-alert",
      value: data?.unsuccessful,
      field: "unsuccessful",
      previous: data?.previousUnsuccessful,
      note: "Includes activation required",
      color: scanColors[2],
    },
    {
      label: "QR identities scanned",
      icon: "qr-code",
      value: data?.identities,
      previous: data?.previousIdentities,
      note: "Distinct owned QR identities",
      color: scanColors[1],
    },
    {
      label: "Activation required",
      icon: "lock",
      value: data?.partial,
      previous: data?.previousPartial,
      field: "partial",
      note: "Included in non-active resolutions",
      color: scanColors[1],
    },
  ];
  return (
    <>
      <div className="scan-summary" aria-busy={loading}>
        {metrics.map((m) => (
          <section key={m.label} className="scan-metric">
            <div
              className="scan-metric-icon"
              style={{ color: m.color, background: m.color + "18" }}
            >
              <VaahanIcon name={m.icon} size={25} />
            </div>
            <div className="scan-metric-content">
              <div className="scan-metric-label">
                {m.label}
                <Help
                  text={
                    m.field
                      ? SOURCE
                      : "Distinct QR identities with recorded scans in the selected period. This counts your QR identities, not people or unique scanners."
                  }
                />
              </div>
              <div className="scan-metric-number">
                {m.value?.toLocaleString("en-IN") ?? (error ? "—" : "…")}
              </div>
              <small>
                {m.value !== undefined && m.previous !== undefined
                  ? scanDelta(m.value, m.previous)
                  : m.note}
              </small>
              {m.field && data && (
                <ScanSparkline
                  series={data.series}
                  field={m.field}
                  color={m.color}
                />
              )}
            </div>
          </section>
        ))}
      </div>
      {error && (
        <div className="scan-summary-error" role="alert">
          Summary could not be loaded.
          <Button variant="outline" onClick={retry}>
            Retry summary
          </Button>
        </div>
      )}
    </>
  );
}
export function ScanWorkspace() {
  const [filters, setFilters] = useState<Filters>(() => ({
      ...defaultFilters(),
      compare: true,
    })),
    [ready, setReady] = useState(false),
    [preset, setPreset] = useState("30"),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(filters),
    [inputError, setInputError] = useState(""),
    [event, setEvent] = useState<ScanRecord | null>(null),
    [allEvents, setAllEvents] = useState(false),
    [exporting, setExporting] = useState(false);
  const scope = useCustomerScope(),
    client = useQueryClient(),
    request = useRef<AbortController | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const p = new URLSearchParams(window.location.search);
        const f = parseFilters(p);
        setFilters({ ...f, compare: true });
        setPreset(p.has("from") ? "custom" : "30");
      } catch {
        toast.error(
          "These scan filters are invalid. The last 30 days are shown.",
        );
        setFilters({ ...defaultFilters(), compare: true });
      }
      setReady(true);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);
  useEffect(() => {
    if (ready)
      window.history.replaceState(
        window.history.state,
        "",
        `/analytics/scans?${canonicalSearch("scan-summary", filters)}`,
      );
  }, [filters, ready]);
  useEffect(() => {
    setEvent(null);
    setAllEvents(false);
    setExporting(false);
    return () => request.current?.abort();
  }, [scope]);
  function useScan<S extends Section>(section: S) {
    return useQuery({
      ...analyticsOptions(scope, section, filters),
      enabled: ready,
    });
  }
  const context = useScan("context"),
    summary = useScan("scan-summary"),
    flow = useScan("scan-flow"),
    timeline = useScan("scan-timeline"),
    geography = useScan("scan-geography"),
    heatmap = useScan("scan-heatmap"),
    rhythm = useScan("scan-rhythm"),
    top = useScan("scan-top"),
    calendar = useScan("scan-calendar");
  const search = canonicalSearch("scan-recent", filters);
  const recent = useInfiniteQuery({
    queryKey: ["customer-analytics", scope, "scan-recent", search],
    initialPageParam: "",
    queryFn: ({ signal, pageParam }) =>
      fetchAnalytics(
        scope,
        "scan-recent",
        search + (pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""),
        signal,
      ),
    getNextPageParam: (last) => last.data.cursor || undefined,
    enabled: ready,
    staleTime: 60000,
    gcTime: 300000,
    retry: false,
  });
  const events = recent.data?.pages.flatMap((p) => p.data.events) || [];
  const apply = useCallback((change: Partial<Filters>) => {
    setFilters((old) => ({ ...old, ...change }));
    setEvent(null);
  }, []);
  const select = useCallback(
    (kind: "vehicle" | "qr" | "outcome", value: string) => {
      if (kind === "vehicle") apply({ vehicle: value, qr: "" });
      else
        apply({
          [kind]:
            kind === "outcome" && value === "OTHER" ? "NOT_RESOLVED" : value,
        });
    },
    [apply],
  );
  const range = (value: string) => {
    setPreset(value);
    if (value === "custom") {
      setDraft(filters);
      setOpen(true);
    } else
      apply({
        from: shift(today(), -(Number(value) - 1)),
        to: today(),
        grouping: "auto",
      });
  };
  const active = [
    "vehicle",
    "qr",
    "outcome",
    "state",
    "city",
    "weekday",
    "hour",
  ].filter((k) => filters[k as keyof Filters] !== "").length;
  const stateOptions: Array<[string, string]> = [
    ["", "All states / UTs"],
    ...Object.entries(INDIA_REGIONS).filter(([c]) => c !== "UNKNOWN"),
  ];
  const vehicleOptions: Array<[string, string]> = [
    ["", "All vehicles"],
    ...(context.data?.data.vehicles.map(
      (v) => [v.id, v.label] as [string, string],
    ) || []),
  ];
  const qrOptions: Array<[string, string]> = [
    ["", "All QR identities"],
    ...(context.data?.data.qrs
      .filter((q) => !filters.vehicle || q.vehicle === filters.vehicle)
      .map((q) => [q.id, q.label] as [string, string]) || []),
  ];
  function frame<S extends Section>(
    section: S,
    q: {
      data?: { data: AnalyticsData[S] };
      isPending: boolean;
      isFetching: boolean;
      isError: boolean;
      refetch: () => unknown;
    },
  ) {
    return {
      loading: q.isPending || q.isFetching,
      error: q.isError,
      retry: () => void q.refetch(),
      source: SOURCE,
      mobileExpand: true,
      expandedClassName: "scan-expanded",
      skeleton: (
        <div className={`scan-shaped-skeleton ${section}`} role="status">
          <span className="sr-only">
            Loading {section.replace("scan-", "")}…
          </span>
        </div>
      ),
    };
  }
  async function report(type: string) {
    const c = new AbortController();
    request.current?.abort();
    request.current = c;
    setExporting(true);
    try {
      const r = await fetch(
        `/api/analytics/scan-export?${search}&type=${type}`,
        {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.any([c.signal, AbortSignal.timeout(20000)]),
        },
      );
      if (!r.ok) {
        const b = await r.json();
        throw Error(b.error || "Report unavailable");
      }
      if (r.headers.get("X-VaahanSafe-Scope") !== scope)
        throw Error("Sign in again before exporting.");
      const b = await r.blob();
      if (c.signal.aborted) return;
      const url = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = url;
      a.download = `vaahansafe-scans-${type}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      if (!c.signal.aborted)
        toast.error(
          e instanceof Error ? e.message : "This report could not be exported.",
        );
    } finally {
      if (!c.signal.aborted) setExporting(false);
    }
  }
  const rows: DataRow[] = events.map((r) => ({
    Time: scanStamp(r.timestamp),
    QR: r.qrLabel,
    Vehicle: r.vehicleLabel,
    Location:
      [r.city, r.state === "Not recorded" ? "" : r.state]
        .filter(Boolean)
        .join(", ") || "Not recorded",
    Outcome: outcomeLabel(r.result),
  }));
  const recentTable = (items: ScanRecord[]) => (
    <div className="scan-recent-scroll">
      <table className="scan-recent-table">
        <thead>
          <tr>
            {["Time", "QR identity", "Vehicle", "Location", "Status", ""].map(
              (h, i) => (
                <th key={i}>{h}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{scanStamp(r.timestamp)}</td>
              <td>{r.qrLabel}</td>
              <td>
                {r.vehicleName}
                <small>{r.vehicleLabel}</small>
              </td>
              <td>
                {[r.city, r.state === "Not recorded" ? "" : r.state]
                  .filter(Boolean)
                  .join(", ") || "Not recorded"}
              </td>
              <td>
                <span
                  className={`scan-status ${r.result === "RESOLVED_ACTIVE" ? "scan-success" : r.result === "RESOLVED_INACTIVE" ? "scan-warning" : "scan-other"}`}
                >
                  {outcomeLabel(r.result)}
                </span>
              </td>
              <td>
                <button
                  aria-label={`Inspect ${r.qrLabel} scan at ${scanStamp(r.timestamp)}`}
                  onClick={() => {
                    setEvent(r);
                    setAllEvents(false);
                  }}
                >
                  <VaahanIcon name="more-horizontal" size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <TooltipProvider delayDuration={200}>
      <div className="analytics-workspace scan-workspace">
        <header className="scan-page-header">
          <div>
            <p className="analytics-eyebrow">Analytics / Scans</p>
            <h1>Scan Analytics</h1>
            <p>
              Explore how your QR identities are being scanned, where, when and
              on which vehicles.
            </p>
          </div>
          <div className="scan-toolbar">
            <Filter
              label="Date range"
              value={preset}
              change={range}
              options={["7", "30", "90", "180", "366"]
                .map(
                  (v) =>
                    [v, `Last ${v === "366" ? "year" : v + " days"}`] as [
                      string,
                      string,
                    ],
                )
                .concat([["custom", "Custom range"]])}
            />
            <Filter
              label="Vehicle"
              value={filters.vehicle}
              change={(v) => apply({ vehicle: v, qr: "" })}
              options={vehicleOptions}
            />
            <Filter
              label="QR identity"
              value={filters.qr}
              change={(v) => apply({ qr: v })}
              options={qrOptions}
            />
            <Button
              variant="outline"
              className="h-11 self-end gap-2"
              onClick={() => {
                setDraft(filters);
                setInputError("");
                setOpen(true);
              }}
            >
              <VaahanIcon name="filter" size={17} />
              Filters
              {active > 0 && (
                <span className="scan-filter-count">{active}</span>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-11 self-end gap-2 bg-foreground text-background hover:bg-foreground/90"
                  disabled={exporting}
                >
                  <VaahanIcon name="download" size={17} />
                  {exporting ? "Exporting…" : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void report("summary")}>
                  Summary CSV
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void report("history")}>
                  Filtered scan history CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="scan-range-status">
          <p role="status">
            {filters.from} – {filters.to} · IST
            {[
              summary,
              flow,
              timeline,
              geography,
              heatmap,
              rhythm,
              top,
              calendar,
            ].some((q) => q.isFetching)
              ? " · Updating…"
              : ""}
            {filters.state &&
              ` · ${INDIA_REGIONS[filters.state] || filters.state}`}
            {filters.weekday &&
              ` · ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][Number(filters.weekday)]}`}
            {filters.hour &&
              ` · ${filters.hour}:00–${Number(filters.hour) + 1}:00`}
          </p>
          <div>
            {active > 0 && (
              <Button
                variant="ghost"
                onClick={() =>
                  apply({
                    vehicle: "",
                    qr: "",
                    outcome: "",
                    state: "",
                    city: "",
                    weekday: "",
                    hour: "",
                  })
                }
              >
                Clear filters
              </Button>
            )}
            <IconAction
              icon="refresh"
              label="Refresh scan analytics"
              onClick={() =>
                void client.invalidateQueries({
                  predicate: (q) =>
                    q.queryKey[0] === "customer-analytics" &&
                    q.queryKey[1] === scope &&
                    String(q.queryKey[2]).startsWith("scan-"),
                })
              }
            />
          </div>
        </div>
        <Summary
          data={summary.data?.data}
          loading={summary.isPending}
          error={summary.isError}
          retry={() => void summary.refetch()}
        />
        <div className="scan-dashboard-grid">
          <div className="scan-panel-flow">
            <ChartFrame
              title="Scan Flow Journey"
              description="Vehicle → QR identity → recorded resolver outcome."
              {...frame("scan-flow", flow)}
              empty={
                flow.data?.data.total === 0
                  ? "No scans recorded during this period. Change the date range to explore earlier activity."
                  : undefined
              }
              rows={flow.data?.data.rows.map((r) => ({
                Vehicle: r.name,
                Plate: r.vehicleLabel,
                QR: r.qrLabel,
                Outcome: outcomeLabel(r.outcome),
                Scans: r.count,
              }))}
            >
              {flow.data && (
                <ScanFlowJourney data={flow.data.data} select={select} />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-map">
            <ChartFrame
              title="Scan Locations"
              description="Coarse state estimates with rankings beside the map."
              {...frame("scan-geography", geography)}
              empty={
                geography.data?.data.total === 0
                  ? "No scans were recorded in this period. Locations appear only when recorded."
                  : undefined
              }
              rows={geography.data?.data.states.map((r) => ({
                State: INDIA_REGIONS[r.code] || r.label,
                Scans: r.count,
                Share: geography.data?.data.total
                  ? `${((100 * r.count) / geography.data.data.total).toFixed(1)}%`
                  : "0%",
                Active: r.successful,
                "Top city": r.topCity,
              }))}
            >
              {geography.data && (
                <IndiaScanMap
                  data={geography.data.data}
                  select={(state) => apply({ state, city: "" })}
                />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-timeline">
            <ChartFrame
              title="Scan Activity Over Time"
              description="Recorded outcomes across the selected period."
              {...frame("scan-timeline", timeline)}
              rows={timeline.data?.data.series.map((r) => ({
                Time: r.timestamp,
                "Active safety view": r.successful,
                "Activation required": r.partial,
                "Not resolved": r.unsuccessful,
              }))}
              action={
                <Select
                  value={filters.grouping}
                  onValueChange={(v) =>
                    apply({ grouping: v as Filters["grouping"] })
                  }
                >
                  <SelectTrigger
                    aria-label="Time grouping"
                    className="h-8 w-auto min-w-[110px] text-xs font-medium"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["auto", "day", "week", "month"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v === "auto"
                          ? "Automatic"
                          : v.charAt(0).toUpperCase() + v.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            >
              {timeline.data && (
                <ScanTimeline series={timeline.data.data.series} />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-heatmap">
            <ChartFrame
              title="Scan Time Heatmap"
              description="Weekday and hour · India time."
              {...frame("scan-heatmap", heatmap)}
              rows={heatmap.data?.data.cells.map((r) => ({
                Day:
                  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][r.day] ||
                  "Unknown",
                Hour: r.hour,
                Scans: r.count,
                Active: r.successful,
              }))}
              empty={
                heatmap.data?.data.cells.length === 0
                  ? "No scans recorded in this period."
                  : undefined
              }
            >
              {heatmap.data && (
                <ScanTimeHeatmap
                  cells={heatmap.data.data.cells}
                  select={(day, hour) =>
                    apply({ weekday: String(day), hour: String(hour) })
                  }
                />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-rhythm">
            <ChartFrame
              title="Scan Rhythm"
              description="A radial histogram of 24 hours."
              {...frame("scan-rhythm", rhythm)}
              rows={rhythm.data?.data.hours.map((r) => ({
                Hour: `${r.hour}:00 IST`,
                Scans: r.count,
              }))}
            >
              {rhythm.data && (
                <ScanRhythm
                  hours={rhythm.data.data.hours}
                  select={(h) => apply({ hour: String(h) })}
                />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-top">
            <ChartFrame
              title="Top QR Identities"
              description="Ranked by scans in the selected period."
              {...frame("scan-top", top)}
              empty={
                top.data?.data.qrs.length === 0
                  ? "No QR scan activity in this period."
                  : undefined
              }
              rows={top.data?.data.qrs.map((r) => ({
                QR: r.label,
                Vehicle: r.vehicleLabel,
                Scans: r.count,
                Active: r.successful,
              }))}
            >
              {top.data && (
                <TopScanQrs
                  data={top.data.data}
                  select={(qr) => apply({ qr })}
                />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-calendar">
            <ChartFrame
              title="Scan Calendar"
              description="Daily observations. Select a date to filter."
              {...frame("scan-calendar", calendar)}
              rows={calendar.data?.data.days.map((r) => ({
                Date: r.date,
                Scans: r.count,
                Active: r.successful,
              }))}
            >
              {calendar.data && (
                <ScanCalendar
                  days={calendar.data.data.days}
                  select={(date) => {
                    apply({ from: date, to: date, grouping: "auto" });
                    setPreset("custom");
                  }}
                />
              )}
            </ChartFrame>
          </div>
          <div className="scan-panel-recent">
            <ChartFrame
              title="Recent Scans"
              description="Latest recorded observations matching your filters."
              source={SOURCE}
              loading={recent.isPending}
              error={recent.isError}
              retry={() => void recent.refetch()}
              rows={rows}
              empty={
                recent.data && events.length === 0
                  ? "No recorded scans match these filters."
                  : undefined
              }
              action={
                <Button
                  variant="ghost"
                  className="h-8 text-xs text-[#58775b]"
                  onClick={() => setAllEvents(true)}
                >
                  View all →
                </Button>
              }
            >
              {recentTable(events.slice(0, 5))}
            </ChartFrame>
          </div>
        </div>
        <footer className="scan-footer">
          <Link href="/analytics">Usage & Analytics</Link>
          <Link href="/analytics/storage">Storage Analytics</Link>
          <Link href="/scan-history">Full Scan History</Link>
        </footer>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="scan-filter-sheet overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Scans</SheetTitle>
              <SheetDescription>
                Apply filters to all scan charts. Geography is approximate;
                dates and hours use IST.
              </SheetDescription>
            </SheetHeader>
            <div className="scan-filter-grid">
              <label className="scan-filter">
                <span>From</span>
                <DatePicker
                  value={draft.from}
                  onChange={(from) => setDraft((d) => ({ ...d, from }))}
                />
              </label>
              <label className="scan-filter">
                <span>To</span>
                <DatePicker
                  value={draft.to}
                  onChange={(to) => setDraft((d) => ({ ...d, to }))}
                />
              </label>
              <Filter
                label="Vehicle"
                value={draft.vehicle}
                change={(vehicle) =>
                  setDraft((d) => ({ ...d, vehicle, qr: "" }))
                }
                options={vehicleOptions}
              />
              <Filter
                label="QR identity"
                value={draft.qr}
                change={(qr) => setDraft((d) => ({ ...d, qr }))}
                options={[
                  ["", "All QR identities"],
                  ...(context.data?.data.qrs
                    .filter(
                      (q) => !draft.vehicle || q.vehicle === draft.vehicle,
                    )
                    .map((q) => [q.id, q.label] as [string, string]) || []),
                ]}
              />
              <Filter
                label="Outcome"
                value={draft.outcome}
                change={(outcome) => setDraft((d) => ({ ...d, outcome }))}
                options={[
                  ["", "All recorded outcomes"],
                  ...Object.entries(SCAN_OUTCOMES).filter(
                    ([v]) => v !== "OTHER",
                  ),
                ]}
              />
              <Filter
                label="State / UT"
                value={draft.state}
                change={(state) => setDraft((d) => ({ ...d, state, city: "" }))}
                options={stateOptions}
              />
              <label className="scan-filter">
                <span>Recorded city / region</span>
                <input
                  value={draft.city}
                  maxLength={120}
                  placeholder="Exact recorded city"
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, city: e.target.value }))
                  }
                  className="h-11 rounded-md border border-border bg-card px-3 text-sm"
                />
              </label>
              <Filter
                label="Weekday"
                value={draft.weekday}
                change={(weekday) => setDraft((d) => ({ ...d, weekday }))}
                options={[
                  ["", "All weekdays"],
                  ...[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((d, i) => [String(i), d] as [string, string]),
                ]}
              />
              <Filter
                label="Hour"
                value={draft.hour}
                change={(hour) => setDraft((d) => ({ ...d, hour }))}
                options={[
                  ["", "All hours"],
                  ...Array.from(
                    { length: 24 },
                    (_, h) =>
                      [String(h), `${h}:00–${h + 1}:00 IST`] as [
                        string,
                        string,
                      ],
                  ),
                ]}
              />
            </div>
            {inputError && (
              <p role="alert" className="text-sm text-destructive">
                {inputError}
              </p>
            )}
            <div className="scan-sheet-actions">
              <Button
                variant="outline"
                onClick={() => setDraft({ ...defaultFilters(), compare: true })}
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  try {
                    const f = parseFilters(
                      new URLSearchParams(
                        canonicalSearch("scan-summary", draft),
                      ),
                    );
                    setFilters({ ...f, compare: true });
                    setPreset("custom");
                    setOpen(false);
                  } catch (e) {
                    setInputError(
                      e instanceof Error ? e.message : "Choose valid filters.",
                    );
                  }
                }}
              >
                Apply filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Sheet
          open={!!event || allEvents}
          onOpenChange={(v) => {
            if (!v) {
              setEvent(null);
              setAllEvents(false);
            }
          }}
        >
          <SheetContent className="scan-detail-sheet overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{event ? "Scan event" : "Recent Scans"}</SheetTitle>
              <SheetDescription>
                {event
                  ? scanStamp(event.timestamp)
                  : "Matching records, loaded 25 at a time."}
              </SheetDescription>
            </SheetHeader>
            {event ? (
              <>
                <dl className="scan-detail-fields">
                  {Object.entries({
                    QR: event.qrLabel,
                    Vehicle: event.vehicleName,
                    Plate: event.vehicleLabel,
                    Outcome: outcomeLabel(event.result),
                    Location:
                      [
                        event.city,
                        event.state === "Not recorded" ? "" : event.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not recorded",
                    "Browser family": event.device || "Not recorded",
                    "Referral class": event.referrer || "Not recorded",
                    "Response duration": "Not recorded",
                  }).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                <ol className="scan-event-stages">
                  <li>
                    <VaahanIcon name="qr-code" size={20} />
                    <div>
                      QR scan recorded
                      <small>{scanStamp(event.timestamp)}</small>
                    </div>
                  </li>
                  <li>
                    <VaahanIcon name="shield" size={20} />
                    <div>
                      Resolver outcome recorded
                      <small>{outcomeLabel(event.result)}</small>
                    </div>
                  </li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  The source records one scan timestamp and its outcome.
                  Individual stage durations and confirmed profile views are
                  unavailable.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setEvent(null);
                    setAllEvents(true);
                  }}
                >
                  Back to matching scans
                </Button>
              </>
            ) : (
              <>
                {recentTable(events)}
                {recent.hasNextPage && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    disabled={recent.isFetchingNextPage}
                    onClick={() => void recent.fetchNextPage()}
                  >
                    {recent.isFetchingNextPage ? "Loading…" : "Load more scans"}
                  </Button>
                )}
                {recent.isError && (
                  <p role="alert">
                    Scans could not be loaded.
                    <Button
                      variant="outline"
                      onClick={() => void recent.refetch()}
                    >
                      Retry
                    </Button>
                  </p>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
