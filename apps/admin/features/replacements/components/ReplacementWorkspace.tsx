"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import {
  RadioGroup,
  RadioGroupItem,
} from "@vaahansafe/ui/components/radio-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@vaahansafe/ui/components/dropdown-menu";
import { AdminSelect } from "../../../components/AdminSelect";
import { getAdminData } from "../../../lib/client-api";
import { canExport } from "../../../lib/exports";
import type { AdminIdentity } from "../../../lib/contracts";
import { mutateNetwork } from "../../network/mutation";
import { ReconciliationDateRange } from "../../reconciliation/components/ReconciliationShared";
import {
  EMPTY_REPLACEMENT_FILTERS,
  REPLACEMENT_REASONS,
  REPLACEMENT_STATUSES,
  replacementLabel,
  type ReplacementFilters,
  type ReplacementPage,
  type ReplacementSummary,
} from "../replacement.types";
import {
  parseReplacementFilters,
  serializeReplacementFilters,
} from "../replacement.filters";
import {
  ReplacementIdentity,
  ReplacementBadge,
  ReplacementError,
  replacementDate,
  replacementKeys,
} from "./ReplacementShared";
import { ReplacementInspect } from "./ReplacementDetail";
export function ReplacementWorkspace({
  identity,
  initialFilters,
  initial,
  initialSummary,
}: {
  identity: AdminIdentity;
  initialFilters: ReplacementFilters;
  initial: ReplacementPage | null;
  initialSummary: ReplacementSummary | null;
}) {
  const [f, setF] = useState(initialFilters),
    [search, setSearch] = useState(f.q),
    [view, setView] = useState("grid"),
    [filterOpen, setFilterOpen] = useState(false),
    [inspect, setInspect] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [exporting, setExporting] = useState(false),
    [exportMessage, setExportMessage] = useState("");
  const client = useQueryClient(),
    filter = serializeReplacementFilters(f),
    scope = replacementKeys(identity),
    exportAllowed = canExport(identity.role, "replacements");
  useEffect(() => {
    setView(
      new URLSearchParams(window.location.search).get("view") === "rows"
        ? "rows"
        : "grid",
    );
    const pop = () => {
      const p = new URLSearchParams(window.location.search),
        v = parseReplacementFilters(p);
      setF(v);
      setSearch(v.q);
      setView(p.get("view") === "rows" ? "rows" : "grid");
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    const t = setTimeout(
      () =>
        setF((v) => ({
          ...v,
          q: parseReplacementFilters(new URLSearchParams({ q: search })).q,
        })),
      300,
    );
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    const p = new URLSearchParams(filter);
    if (view === "rows") p.set("view", "rows");
    window.history.replaceState(
      null,
      "",
      `/replacements${p.size ? "?" + p.toString() : ""}`,
    );
  }, [filter, view]);
  useEffect(() => setSelected([]), [filter]);
  const list = useInfiniteQuery({
    queryKey: [...scope, "list", filter],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      getAdminData<ReplacementPage>(
        `/api/replacements?${filter}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
        signal,
      ),
    getNextPageParam: (p) => p.nextCursor || undefined,
    staleTime: 30000,
    initialData:
      initial && filter === serializeReplacementFilters(initialFilters)
        ? { pages: [initial], pageParams: [null] }
        : undefined,
  });
  const summary = useQuery({
    queryKey: [...scope, "summary"],
    queryFn: ({ signal }) =>
      getAdminData<ReplacementSummary>("/api/replacements/summary", signal),
    initialData: initialSummary || undefined,
    staleTime: 30000,
  });
  const rows = list.data?.pages.flatMap((p) => p.rows) || [];
  const patch = (k: keyof ReplacementFilters, v: string) =>
    setF((prev) => ({ ...prev, [k]: v }));
  const metrics: [keyof ReplacementSummary, string, string][] = [
    ["review", "Awaiting review", "review"],
    ["risk", "Risk review", "risk"],
    ["issue", "Ready to issue", "issue"],
    ["fulfilment", "In fulfilment", "fulfilment"],
    ["activation", "Owner activation", "activation"],
  ];
  const select = (
    k: keyof ReplacementFilters,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="rp-field" key={k}>
      <span>{label}</span>
      <AdminSelect
        label={label}
        value={f[k]}
        onValueChange={(v) => patch(k, v)}
        options={[
          { value: "", label: "All " + label.toLowerCase() },
          ...options,
        ]}
      />
    </label>
  );
  const filters = (
    <div className="rp-filters">
      <div className="rp-filter-heading">
        <strong>Refine replacements</strong>
        <button
          className="rp-text"
          onClick={() => {
            setF({ ...EMPTY_REPLACEMENT_FILTERS });
            setSearch("");
          }}
        >
          Reset
        </button>
      </div>
      {select(
        "status",
        "Statuses",
        REPLACEMENT_STATUSES.map((value) => ({
          value,
          label: replacementLabel(value),
        })),
      )}
      {select(
        "reason",
        "Reasons",
        REPLACEMENT_REASONS.map((value) => ({
          value,
          label: replacementLabel(value),
        })),
      )}
      {select(
        "risk",
        "Risk levels",
        ["LOW", "MEDIUM", "HIGH"].map((value) => ({
          value,
          label: replacementLabel(value),
        })),
      )}
      {select(
        "qr",
        "QR states",
        [
          ["old_active", "Original active"],
          ["old_retired", "Original retired"],
          ["unallocated", "Awaiting allocation"],
          ["allocated", "Replacement allocated"],
          ["new_active", "Replacement active"],
        ].map(([value, label]) => ({ value: value!, label: label! })),
      )}
      <label className="rp-field">
        <span>Date field · IST</span>
        <AdminSelect
          label="Date field in India Standard Time"
          value={f.dateMode}
          onValueChange={(v) => patch("dateMode", v)}
          options={[
            "requested",
            "approved",
            "shipped",
            "delivered",
            "activated",
            "closed",
          ].map((value) => ({ value, label: replacementLabel(value) }))}
        />
      </label>
      <ReconciliationDateRange
        from={f.from}
        to={f.to}
        onChange={(from, to) => setF((p) => ({ ...p, from, to }))}
      />
      <p className="rp-muted">
        Filters apply to both layouts and protected exports.
      </p>
    </div>
  );
  async function requestExport(ids: string[] | null) {
    setExporting(true);
    setExportMessage("");
    try {
      await mutateNetwork("/api/exports", {
        moduleKey: "replacements",
        filters: filter,
        ids,
      });
      setExportMessage(
        "Your protected report is queued. Open Reports to download it when ready.",
      );
    } catch (e) {
      setExportMessage(
        e instanceof Error
          ? e.message
          : "Report generation is temporarily unavailable.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <main className="rp-workspace">
      <header className="rp-heading">
        <div>
          <span className="rp-kicker">
            Safety operations / identity continuity
          </span>
          <h1>Replacement operations</h1>
          <p>
            Review each request, verify its paid order and preserve a single
            active vehicle identity.
          </p>
        </div>
        <div className="rp-actions">
          {["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role) &&
            (!identity.stepUpAt ||
              Date.parse(identity.stepUpAt) < Date.now() - 600000) && (
              <Link className="rp-button" href="/verify-email?stepUp=1">
                Verify operations access
              </Link>
            )}
          <button
            className="rp-button"
            onClick={() => void client.invalidateQueries({ queryKey: scope })}
          >
            <VaahanIcon name="refresh" size={16} />
            Refresh
          </button>
          {exportAllowed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rp-button" disabled={exporting}>
                  Export <VaahanIcon name="chevron-down" size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => void requestExport(null)}>
                  Export filtered view
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!selected.length}
                  onSelect={() => void requestExport(selected)}
                >
                  Export selected · {selected.length}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <div className="rp-metrics" aria-label="Replacement workflow">
        {metrics.map(([key, label, value], n) => (
          <button
            key={key}
            className={f.scope === value ? "active" : ""}
            onClick={() => patch("scope", f.scope === value ? "" : value)}
            aria-pressed={f.scope === value}
          >
            <span className="rp-kicker">
              0{n + 1} / {label}
            </span>
            <strong>
              {summary.data ? summary.data[key].toLocaleString("en-IN") : "—"}
            </strong>
            <small>
              {key === "issue"
                ? "Approved · payment required"
                : key === "activation"
                  ? "Delivered or activated"
                  : "View queue"}
            </small>
          </button>
        ))}
      </div>
      {summary.isError && (
        <ReplacementError
          error={summary.error}
          retry={() => void summary.refetch()}
        />
      )}
      <div className="rp-queue">
        <div>
          <VaahanIcon name="alert" size={20} />
          <div>
            <strong>Needs attention</strong>
            <p>
              {summary.data ? summary.data.attention : "—"} requests with
              eligibility, risk, ageing or shipment issues.
            </p>
          </div>
        </div>
        <button
          className="rp-button"
          onClick={() =>
            patch("scope", f.scope === "attention" ? "" : "attention")
          }
          aria-pressed={f.scope === "attention"}
        >
          {f.scope === "attention"
            ? "Show all requests"
            : "Review attention queue"}
        </button>
      </div>
      <div className="rp-content">
        <aside className="rp-desktop-filters">{filters}</aside>
        <section className="rp-results">
          <div className="rp-toolbar">
            <label className="rp-search">
              <VaahanIcon name="search" size={18} />
              <input
                aria-label="Search replacements"
                placeholder="Reference, QR ID, customer, vehicle or order"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button
              className="rp-button rp-mobile-filter"
              onClick={() => setFilterOpen(true)}
            >
              <VaahanIcon name="filter" size={16} />
              Filters
            </button>
            <AdminSelect
              label="Sort replacement requests"
              value={f.sort}
              onValueChange={(v) => patch("sort", v)}
              options={[
                { value: "newest", label: "Newest requests" },
                { value: "oldest", label: "Oldest requests" },
                { value: "updated", label: "Recently updated" },
                { value: "pending", label: "Longest pending" },
              ]}
            />
            <RadioGroup
              value={view}
              onValueChange={setView}
              className="rp-view"
              aria-label="Result layout"
            >
              {["grid", "rows"].map((v) => (
                <label key={v} className={view === v ? "active" : ""}>
                  <RadioGroupItem value={v} className="sr-only" />
                  <VaahanIcon name={v === "grid" ? "grid" : "rows"} size={17} />
                  <span className="sr-only">{replacementLabel(v)}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          {filter && (
            <div className="rp-chips">
              {Object.entries(f)
                .filter(
                  ([k, v]) =>
                    v &&
                    v !==
                      EMPTY_REPLACEMENT_FILTERS[k as keyof ReplacementFilters],
                )
                .map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => {
                      patch(
                        k as keyof ReplacementFilters,
                        EMPTY_REPLACEMENT_FILTERS[
                          k as keyof ReplacementFilters
                        ],
                      );
                      if (k === "q") setSearch("");
                    }}
                  >
                    {replacementLabel(k)}: {replacementLabel(v)}{" "}
                    <span aria-label="Remove filter">×</span>
                  </button>
                ))}
            </div>
          )}
          <div className="rp-result-count" aria-live="polite">
            {list.isFetching ? "Updating…" : `${rows.length} requests loaded`}
            {selected.length > 0 && ` · ${selected.length} selected`} ·{" "}
            {f.scope ? replacementLabel(f.scope) + " queue" : "All requests"}
          </div>
          {exportMessage && (
            <p className="rp-notice" role="status">
              {exportMessage} <Link href="/reports">Reports →</Link>
            </p>
          )}
          {list.isPending ? (
            <div className="rp-skeleton" aria-label="Loading requests" />
          ) : list.isError ? (
            <ReplacementError
              error={list.error}
              retry={() => void list.refetch()}
            />
          ) : rows.length === 0 ? (
            <div className="rp-empty">
              <VaahanIcon name="refresh" size={32} />
              <h2>
                {filter
                  ? "No matching requests"
                  : "No replacement requests yet"}
              </h2>
              <p>
                {filter
                  ? "Adjust the filters to find another replacement."
                  : "Owner requests appear here after eligibility is verified. A paid replacement order is required before stock allocation."}
              </p>
              {filter && (
                <button
                  className="rp-button"
                  onClick={() => {
                    setF({ ...EMPTY_REPLACEMENT_FILTERS });
                    setSearch("");
                  }}
                >
                  Clear filters
                </button>
              )}
              <Link href="/inventory">Review QR inventory →</Link>
            </div>
          ) : (
            <div className={`rp-records rp-${view}`}>
              {rows.map((r) => (
                <article className="rp-record" key={r.id}>
                  <div className="rp-record-top">
                    {exportAllowed && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.reference_code} for export`}
                        checked={selected.includes(r.id)}
                        disabled={
                          !selected.includes(r.id) && selected.length >= 100
                        }
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked
                              ? [...s, r.id]
                              : s.filter((id) => id !== r.id),
                          )
                        }
                      />
                    )}
                    <Link
                      href={`/replacements/${r.id}`}
                      className="rp-reference"
                    >
                      {r.reference_code}
                    </Link>
                    <ReplacementBadge row={r} />
                  </div>
                  <div className="rp-record-owner">
                    <strong>{r.customer_name}</strong>
                    <span>
                      {r.make} {r.model} · {r.registration_masked}
                    </span>
                  </div>
                  <ReplacementIdentity row={r} />
                  <div className="rp-record-meta">
                    <span>{replacementLabel(r.reason)}</span>
                    <span className={r.risk_level === "HIGH" ? "rp-risk" : ""}>
                      {replacementLabel(r.risk_level)} risk
                    </span>
                    <span>{replacementDate(r.requested_at)}</span>
                  </div>
                  {r.attention && (
                    <p className="rp-attention">
                      {replacementLabel(r.attention)}
                    </p>
                  )}
                  <div className="rp-record-footer">
                    <span>
                      {r.order_number
                        ? `${r.order_number} · ${replacementLabel(r.payment_state || "PENDING")}`
                        : "Paid replacement order required"}
                    </span>
                    <button
                      className="rp-text"
                      onClick={() => setInspect(r.id)}
                    >
                      Inspect <VaahanIcon name="arrow-right" size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {list.hasNextPage && (
            <button
              className="rp-button rp-load"
              disabled={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? "Loading…" : "Load more requests"}
            </button>
          )}
        </section>
      </div>
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="left" className="rp-sheet">
          <SheetTitle>Replacement filters</SheetTitle>
          <SheetDescription>
            Refine real requests. Dates use India Standard Time.
          </SheetDescription>
          {filters}
        </SheetContent>
      </Sheet>
      <Sheet
        open={!!inspect}
        onOpenChange={(v) => {
          if (!v) setInspect(null);
        }}
      >
        <SheetContent className="rp-sheet rp-inspect">
          <SheetTitle>Quick inspection</SheetTitle>
          <SheetDescription>
            Review identity continuity before opening the full request.
          </SheetDescription>
          {inspect && <ReplacementInspect identity={identity} id={inspect} />}
        </SheetContent>
      </Sheet>
    </main>
  );
}
