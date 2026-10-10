"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
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
import { CATEGORIES } from "../document-vault/model";
import { analyticsOptions, fetchAnalytics } from "./queries";
import {
  canonicalSearch,
  defaultFilters,
  parseFilters,
  shift,
  today,
} from "./filters";
import { ChartFrame, Help, IconAction } from "./ChartFrame";
import { StorageDashboard, type StorageQueryState } from "./StorageDashboard";
import type { Activity, Filters, Section } from "./types";
import "./analytics.css";
import "./storage.css";

const stamp = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
function Filter({
  label,
  value,
  change,
  options,
}: {
  label: string;
  value: string;
  change: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="storage-filter">
      <span>{label}</span>
      <Select
        value={value || "all"}
        onValueChange={(value) => change(value === "all" ? "" : value)}
      >
        <SelectTrigger className="h-11 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map(([value, label]) => (
            <SelectItem value={value || "all"} key={value || "all"}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
export function StorageWorkspace() {
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters(),
    from: shift(today(), -89),
  }));
  const [preset, setPreset] = useState("90"),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(filters),
    [inputError, setInputError] = useState(""),
    [selectedEvent, setSelectedEvent] = useState<Activity | null>(null),
    [activityOpen, setActivityOpen] = useState(false),
    [exporting, setExporting] = useState(false);
  const exportRequest = useRef<AbortController | null>(null);
  const scope = useCustomerScope(),
    client = useQueryClient();
  useEffect(() => {
    setExporting(false);
    setSelectedEvent(null);
    setActivityOpen(false);
    return () => exportRequest.current?.abort();
  }, [scope]);
  const context = useQuery(analyticsOptions(scope, "context", filters));
  const summary = useQuery(analyticsOptions(scope, "documents", filters));
  const history = useQuery(analyticsOptions(scope, "storage-history", filters));
  const details = useQuery(analyticsOptions(scope, "storage-details", filters));
  const access = useQuery(analyticsOptions(scope, "storage-access", filters));
  const search = canonicalSearch("activity", {
    ...filters,
    event: "DOCUMENT",
    qr: "",
    outcome: "",
    region: "",
  });
  const feed = useInfiniteQuery({
    queryKey: ["customer-analytics", scope, "activity", search],
    initialPageParam: "",
    queryFn: ({ signal, pageParam }) =>
      fetchAnalytics(
        scope,
        "activity",
        search + (pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""),
        signal,
      ),
    getNextPageParam: (last) => last.data.cursor || undefined,
    staleTime: 60000,
    retry: false,
  });
  const active = [
    filters.category,
    filters.file,
    filters.validity,
    filters.protection,
    filters.documentActivity,
  ].filter(Boolean).length;
  const pending = [summary, history, details, access].some(
    (query) => query.isFetching,
  );
  const refreshedAt = [summary, history, details, access]
    .map((query) => query.data?.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);
  const invalidate = () =>
    void client.invalidateQueries({
      predicate: (query) =>
        query.queryKey[0] === "customer-analytics" &&
        query.queryKey[1] === scope &&
        [
          "documents",
          "storage-history",
          "storage-details",
          "storage-access",
          "activity",
        ].includes(String(query.queryKey[2])),
      refetchType: "active",
    });
  useEffect(() => {
    setSelectedEvent(null);
  }, [search]);
  const apply = () => {
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(draft))
        params.set(key, String(value));
      setFilters(parseFilters(params));
      setPreset("custom");
      setOpen(false);
      setInputError("");
    } catch (error) {
      setInputError(
        error instanceof Error ? error.message : "Check the selected filters.",
      );
    }
  };
  const range = (value: string) => {
    setPreset(value);
    if (value === "custom") {
      setDraft(filters);
      setInputError("");
      setOpen(true);
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
  const state = <S extends Section>(query: {
    data?: { data: StorageQueryState<S>["data"] };
    isFetching: boolean;
    isError: boolean;
    refetch: () => unknown;
  }): StorageQueryState<S> => ({
    data: query.data?.data,
    loading: query.isFetching,
    error: query.isError,
    retry: () => {
      void query.refetch();
    },
  });
  const events = feed.data?.pages.flatMap((page) => page.data.events) || [];
  const recent = (
    <ChartFrame
      title="Recent Document Activity"
      description="Recorded vault actions in the selected period"
      source="Owner-scoped, cursor-paginated document events. Safe display titles only. Select an event to inspect it; opening its document uses the existing vault permissions and preview."
      loading={feed.isFetching && !feed.isFetchingNextPage}
      error={feed.isError}
      retry={() => void feed.refetch()}
      empty={
        feed.data && !events.length
          ? "No document activity matches this range and filter."
          : undefined
      }
      rows={events.map((event) => ({
        Document: event.reference,
        Action: event.title,
        Time: stamp(event.timestamp),
      }))}
    >
      <ol className="storage-activity-list">
        {events.slice(0, 4).map((event) => (
          <li key={event.id}>
            <button type="button" onClick={() => setSelectedEvent(event)}>
              <span className="storage-activity-icon">
                <VaahanIcon
                  name={
                    event.title.toLowerCase() === "downloaded"
                      ? "download"
                      : event.title.toLowerCase() === "previewed"
                        ? "eye"
                        : "file"
                  }
                  size={16}
                />
              </span>
              <span>
                <strong>{event.reference}</strong>
                <small>
                  {event.title} ·{" "}
                  {context.data?.data.vehicles.find(
                    (v) => v.id === event.vehicle,
                  )?.label || "Account document"}
                </small>
                <time dateTime={event.timestamp}>{stamp(event.timestamp)}</time>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {events.length > 4 && (
        <Button variant="ghost" onClick={() => setActivityOpen(true)}>
          View all activity
        </Button>
      )}
      {feed.hasNextPage && (
        <Button
          variant="outline"
          className="mt-3"
          disabled={feed.isFetchingNextPage}
          onClick={() => setActivityOpen(true)}
        >
          {feed.isFetchingNextPage ? "Loading…" : "Load more activity"}
        </Button>
      )}
    </ChartFrame>
  );
  const exportSearch = canonicalSearch("documents", filters);
  const exportReport = async (type: string) => {
    const controller = new AbortController();
    exportRequest.current?.abort();
    exportRequest.current = controller;
    setExporting(true);
    try {
      const response = await fetch(
        `/api/analytics/storage-export?${exportSearch}&type=${type}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(20000),
          ]),
        },
      );
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "This report could not be exported.");
      }
      if (response.headers.get("X-VaahanSafe-Scope") !== scope)
        throw new Error("Sign in again before exporting this report.");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vaahansafe-storage-${type}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (!controller.signal.aborted)
        toast.error(
          error instanceof Error
            ? error.message
            : "We couldn’t export this report right now. Please try again.",
        );
    } finally {
      if (!controller.signal.aborted) setExporting(false);
    }
  };
  return (
    <TooltipProvider delayDuration={200}>
      <div className="analytics-workspace storage-workspace">
        <header className="storage-page-header">
          <div>
            <p className="analytics-eyebrow">Documents / Storage & Analytics</p>
            <h1>Document Storage</h1>
            <p>
              A complete view of document storage, usage patterns and records
              needing attention.
            </p>
          </div>
          <div className="storage-header-controls">
            <Filter
              label="Vehicle"
              value={filters.vehicle}
              change={(vehicle) => setFilters((old) => ({ ...old, vehicle }))}
              options={[
                ["", "All vehicles"],
                ...(context.data?.data.vehicles.map(
                  (v) => [v.id, v.label] as [string, string],
                ) || []),
              ]}
            />
            <Filter
              label="Date range"
              value={preset}
              change={range}
              options={[
                ["7", "Last 7 days"],
                ["30", "Last 30 days"],
                ["90", "Last 90 days"],
                ["180", "Last 6 months"],
                ["year", "This year"],
                ["custom", "Custom range"],
              ]}
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
              <VaahanIcon name="filter" size={16} />
              Filters{active > 0 && ` · ${active}`}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-11 self-end gap-2 bg-foreground text-background hover:bg-foreground/90"
                  disabled={exporting}
                >
                  <VaahanIcon name="download" size={16} />
                  {exporting ? "Exporting…" : "Export Report"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(
                  [
                    ["summary", "Storage summary CSV"],
                    ["documents", "Documents by storage CSV"],
                    ["activity", "Recent activity CSV"],
                  ] as const
                ).map(([type, label]) => (
                  <DropdownMenuItem
                    key={type}
                    onSelect={() => void exportReport(type)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="storage-range-status">
          <p role="status">
            {filters.from} — {filters.to} · India Standard Time · Storage totals
            are current snapshots
            {pending
              ? " · Updating…"
              : refreshedAt
                ? ` · Updated ${stamp(refreshedAt)}`
                : ""}
          </p>
          <IconAction
            icon="refresh"
            label="Refresh storage analytics"
            onClick={invalidate}
            disabled={pending}
          />
          <Help text="Original storage includes finalized READY versions for current, non-deleted documents. The account quota is an enforced vault policy; it also reserves thumbnail/pending cleanup bytes. Historical tracking begins at the first real snapshot." />
        </div>
        {context.isError && (
          <div className="analytics-notice" role="alert">
            Vehicle filters could not be loaded.{" "}
            <Button variant="ghost" onClick={() => void context.refetch()}>
              Retry
            </Button>
          </div>
        )}
        {active > 0 && (
          <div className="storage-active-filters">
            <span>{active} storage filters applied</span>
            <Button
              variant="ghost"
              onClick={() =>
                setFilters((old) => ({
                  ...old,
                  category: "",
                  file: "",
                  validity: "",
                  protection: "",
                  documentActivity: "",
                }))
              }
            >
              Clear filters
            </Button>
          </div>
        )}
        <StorageDashboard
          summary={state<"documents">(summary)}
          history={state<"storage-history">(history)}
          details={state<"storage-details">(details)}
          access={state<"storage-access">(access)}
          onVehicle={(vehicle) => setFilters((old) => ({ ...old, vehicle }))}
          onCategory={(category) => setFilters((old) => ({ ...old, category }))}
          onFile={(file) => setFilters((old) => ({ ...old, file }))}
          activity={recent}
        />
        <footer className="storage-footer">
          <Link href="/documents">Manage Document Vault</Link>
          <Link href="/analytics">Usage & Analytics</Link>
          <span>Your documents. Your storage insights.</span>
        </footer>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="flex flex-col overflow-hidden p-0 max-sm:w-full">
            <SheetHeader className="p-5 border-b border-border">
              <SheetTitle>Filter Storage Analytics</SheetTitle>
              <SheetDescription>
                Storage totals follow the selected records. Activity follows the
                date range.
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-2 text-xs">
                  From
                  <DatePicker
                    value={draft.from}
                    onChange={(from) => setDraft((old) => ({ ...old, from }))}
                  />
                </label>
                <label className="grid gap-2 text-xs">
                  To
                  <DatePicker
                    value={draft.to}
                    onChange={(to) => setDraft((old) => ({ ...old, to }))}
                  />
                </label>
              </div>
              <Filter
                label="Vehicle"
                value={draft.vehicle}
                change={(vehicle) => setDraft((old) => ({ ...old, vehicle }))}
                options={[
                  ["", "All vehicles"],
                  ...(context.data?.data.vehicles.map(
                    (v) => [v.id, v.label] as [string, string],
                  ) || []),
                ]}
              />
              <Filter
                label="Document category"
                value={draft.category}
                change={(category) => setDraft((old) => ({ ...old, category }))}
                options={[
                  ["", "All categories"],
                  ...Object.entries(CATEGORIES),
                ]}
              />
              <Filter
                label="Original file type"
                value={draft.file}
                change={(file) => setDraft((old) => ({ ...old, file }))}
                options={[
                  ["", "All originals"],
                  ["application/pdf", "PDF"],
                  ["image/*", "All images"],
                  ["image/jpeg", "JPEG"],
                  ["image/png", "PNG"],
                  ["image/webp", "WebP"],
                ]}
              />
              <Filter
                label="Expiry status"
                value={draft.validity}
                change={(validity) => setDraft((old) => ({ ...old, validity }))}
                options={[
                  ["", "All documents"],
                  ["CURRENT", "Current / not near expiry"],
                  ["EXPIRING", "Expiring in 30 days"],
                  ["EXPIRED", "Expired"],
                  ["NONE", "No expiry recorded"],
                ]}
              />
              <Filter
                label="Protection"
                value={draft.protection}
                change={(protection) =>
                  setDraft((old) => ({ ...old, protection }))
                }
                options={[
                  ["", "All protection modes"],
                  ["ACCOUNT", "Account"],
                  ["VAULT_PIN", "Vault PIN"],
                  ["DOCUMENT_PASSWORD", "Document password"],
                ]}
              />
              <Filter
                label="Recorded activity"
                value={draft.documentActivity}
                change={(documentActivity) =>
                  setDraft((old) => ({ ...old, documentActivity }))
                }
                options={[
                  ["", "All actions"],
                  ["UPLOAD", "Upload"],
                  ["REPLACE", "Replacement"],
                  ["PREVIEW", "Preview"],
                  ["DOWNLOAD", "Download"],
                  ["SHARE", "Share link created"],
                  ["DELETE", "Delete"],
                ]}
              />
              {inputError && (
                <p role="alert" className="text-sm text-destructive">
                  {inputError}
                </p>
              )}
            </div>
            <div className="flex justify-between border-t border-border p-5">
              <Button
                variant="outline"
                onClick={() =>
                  setDraft({
                    ...defaultFilters(),
                    from: filters.from,
                    to: filters.to,
                  })
                }
              >
                Reset
              </Button>
              <Button onClick={apply}>Apply filters</Button>
            </div>
          </SheetContent>
        </Sheet>
        <Sheet
          open={activityOpen || Boolean(selectedEvent)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedEvent(null);
              setActivityOpen(false);
            }
          }}
        >
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                {selectedEvent?.title || "Document activity"}
              </SheetTitle>
              <SheetDescription>
                {selectedEvent?.reference ||
                  "Recorded document events in the selected range"}
              </SheetDescription>
            </SheetHeader>
            {selectedEvent && (
              <div className="mt-6 space-y-5">
                {activityOpen && (
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Back to activity
                  </Button>
                )}
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Recorded</dt>
                    <dd>{stamp(selectedEvent.timestamp)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Vehicle</dt>
                    <dd>
                      {context.data?.data.vehicles.find(
                        (v) => v.id === selectedEvent.vehicle,
                      )?.label || "Account document"}
                    </dd>
                  </div>
                </dl>
                {selectedEvent.title.toLowerCase() === "deleted" ? (
                  <p className="text-sm text-muted-foreground">
                    This document was deleted. Its recorded activity is
                    retained.
                  </p>
                ) : (
                  <Button asChild>
                    <Link href={selectedEvent.href}>
                      Open document in vault
                    </Link>
                  </Button>
                )}
              </div>
            )}
            {!selectedEvent && (
              <div className="mt-6">
                <ol className="storage-activity-list">
                  {events.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <span className="storage-activity-icon">
                          <VaahanIcon name="file" size={16} />
                        </span>
                        <span>
                          <strong>{event.reference}</strong>
                          <small>{event.title}</small>
                          <time dateTime={event.timestamp}>
                            {stamp(event.timestamp)}
                          </time>
                        </span>
                      </button>
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
                    {feed.isFetchingNextPage
                      ? "Loading…"
                      : "Load more activity"}
                  </Button>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
