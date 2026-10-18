"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@vaahansafe/ui/components/dropdown-menu";
import {
  RadioGroup,
  RadioGroupItem,
} from "@vaahansafe/ui/components/radio-group";
import { toast } from "@vaahansafe/ui/components/sonner";
import type { AdminIdentity } from "../../../lib/contracts";
import { getAdminData } from "../../../lib/client-api";
import { canExport } from "../../../lib/exports";
import { AdminSelect } from "../../../components/AdminSelect";
import { GeographyCombobox } from "../../geography/GeographyCombobox";
import { mutateNetwork } from "../../network/mutation";
import {
  EMPTY_RECONCILIATION_FILTERS,
  reconciliationLabel,
  varianceDescription,
  type ReconciliationFilters,
  type ReconciliationPage,
  type ReconciliationRow,
  type ReconciliationSummary,
} from "../reconciliation.types";
import {
  parseReconciliationFilters,
  serializeReconciliationFilters,
} from "../reconciliation.filters";
import {
  CustodianPicker,
  ReconciliationDateRange,
  ReconciliationBadge,
  StockBalance,
  ReconciliationError,
  ReconciliationSkeleton,
  reconciliationKeys,
  reconciliationDate,
  custodianLocation,
  canManageReconciliation,
  useReconciliationRefresh,
} from "./ReconciliationShared";
import { ReconciliationDetailView } from "./ReconciliationDetail";
export function ReconciliationWorkspace({
  identity,
  initial,
  initialSummary,
  initialFilters,
}: {
  identity: AdminIdentity;
  initial: ReconciliationPage | null;
  initialSummary: ReconciliationSummary | null;
  initialFilters: ReconciliationFilters;
}) {
  const params = useSearchParams(),
    filters = useMemo(
      () => parseReconciliationFilters(new URLSearchParams(params.toString())),
      [params],
    ),
    key = serializeReconciliationFilters(filters),
    initialKey = serializeReconciliationFilters(initialFilters),
    view = params.get("view") === "grid" ? "grid" : "rows";
  const [search, setSearch] = useState(filters.q),
    [mobile, setMobile] = useState(false),
    [draft, setDraft] = useState(filters),
    [preview, setPreview] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [exporting, setExporting] = useState(false),
    [help, setHelp] = useState(false),
    [exportError, setExportError] = useState("");
  const focusTarget = useRef<HTMLButtonElement | null>(null),
    refresh = useReconciliationRefresh(identity);
  const update = useCallback(
    (f: ReconciliationFilters) => {
      const p = new URLSearchParams(serializeReconciliationFilters(f));
      p.set("view", view);
      window.history.pushState(null, "", `/reconciliation?${p}`);
      setSelected([]);
    },
    [view],
  );
  useEffect(() => {
    setSearch(filters.q);
    setDraft(filters);
    setSelected([]);
  }, [filters]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = parseReconciliationFilters(
        new URLSearchParams({ q: search }),
      ).q;
      if (q !== filters.q) update({ ...filters, q });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters, update]);
  const list = useInfiniteQuery({
    queryKey: reconciliationKeys.list(identity, key),
    queryFn: ({ pageParam, signal }) =>
      getAdminData<ReconciliationPage>(
        `/api/reconciliation?${key}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    initialData:
      key === initialKey && initial
        ? { pages: [initial], pageParams: [null] }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30000,
    retry: 1,
  });
  const summary = useQuery({
    queryKey: [...reconciliationKeys.scope(identity), "summary"],
    queryFn: ({ signal }) =>
      getAdminData<ReconciliationSummary>(
        "/api/reconciliation/summary",
        signal,
      ),
    initialData: initialSummary || undefined,
    staleTime: 30000,
    retry: 1,
  });
  const attention = useQuery({
    queryKey: [...reconciliationKeys.scope(identity), "attention"],
    queryFn: ({ signal }) =>
      getAdminData<ReconciliationPage>(
        "/api/reconciliation?scope=attention&sort=unresolved",
        signal,
      ),
    enabled: !!summary.data?.review,
    staleTime: 30000,
    retry: 1,
  });
  const rows = Array.from(
      new Map(
        (list.data?.pages.flatMap((p) => p.rows) || []).map((r) => [r.id, r]),
      ).values(),
    ),
    manage = canManageReconciliation(identity),
    exportAllowed = canExport(identity.role, "reconciliation");
  const inspect = (id: string, button: HTMLButtonElement) => {
    focusTarget.current = button;
    setPreview(id);
  };
  const exportRows = async (ids: string[] | null) => {
    setExporting(true);
    setExportError("");
    try {
      await mutateNetwork("/api/exports", {
        moduleKey: "reconciliation",
        filters: key,
        ids,
      });
      toast.success("Reconciliation report requested.", {
        action: {
          label: "View reports",
          onClick: () => window.location.assign("/reports"),
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Report unavailable.";
      setExportError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id)
        ? s.filter((v) => v !== id)
        : s.length < 100
          ? [...s, id]
          : s,
    );
  const chips = Object.entries(filters).filter(
    ([k, v]) =>
      v && v !== EMPTY_RECONCILIATION_FILTERS[k as keyof ReconciliationFilters],
  );
  const filterFields = (
    <ReconciliationFiltersPanel
      identity={identity}
      filters={draft}
      onChange={(f) => {
        setDraft(f);
        if (!mobile) update(f);
      }}
    />
  );
  const card = (r: ReconciliationRow) => (
    <article className="rc-record" key={r.id}>
      <header>
        <button
          className="rc-reference"
          onClick={(e) => inspect(r.id, e.currentTarget)}
        >
          {r.reference_code}
        </button>
        <ReconciliationBadge row={r} />
      </header>
      <div className="rc-card-custodian">
        <strong>{r.custodian_name}</strong>
        <small>{reconciliationLabel(r.custodian_kind)}</small>
        <span>{custodianLocation(r)}</span>
      </div>
      <p className="rc-eyebrow">LEDGER ↔ PHYSICAL COUNT</p>
      <StockBalance row={r} />
      <div className="rc-record-meta">
        <div className="rc-outcome-row">
          <span
            className={`rc-outcome-pill ${
              r.outcome === "MATCHED"
                ? "matched"
                : r.variance
                  ? "variance"
                  : ""
            }`}
          >
            {reconciliationLabel(r.outcome)}
          </span>
          <span className="rc-timestamp">
            <VaahanIcon name="clock" size={11} />
            {r.count_completed_at ? "Counted" : "Created"} ·{" "}
            {reconciliationDate(r.count_completed_at || r.created_at)} IST
          </span>
        </div>
        {r.transfer_reference && (
          <Link
            href={`/transfers/${r.transfer_id}`}
            className="rc-record-related"
          >
            <VaahanIcon name="route" size={12} />
            <span>Related transfer · </span>
            <code>{r.transfer_reference}</code>
          </Link>
        )}
        {r.attention && (
          <p className="rc-card-attention">
            <VaahanIcon name="alert" size={12} />
            {reconciliationLabel(r.attention)}
          </p>
        )}
      </div>
      <footer className="rc-record-footer">
        {exportAllowed ? (
          <label className="rc-selection">
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              onChange={() => toggle(r.id)}
              aria-label={`Select ${r.reference_code} for export`}
            />
            <span>Select</span>
          </label>
        ) : (
          <span className="rc-spacer" />
        )}
        <div className="rc-record-actions">
          <button
            className="rc-button rc-inspect-btn"
            onClick={(e) => inspect(r.id, e.currentTarget)}
          >
            <span>Inspect</span>
            <VaahanIcon
              name="arrow-right"
              size={12}
              className="rc-inspect-arrow"
            />
          </button>
          <RecordMenu r={r} inspect={(button) => inspect(r.id, button)} />
        </div>
      </footer>
    </article>
  );
  return (
    <div className="rc-workspace">
      <header className="rc-header">
        <div className="rc-header-intro">
          <p className="rc-eyebrow">OPERATIONS / INVENTORY CONTROL</p>
          <h1>Stock Reconciliation</h1>
          <p>
            Verify physical QR stock against VaahanSafe&apos;s authoritative
            custody ledger.
          </p>
        </div>
        <div className="rc-actions">
          <button
            className="rc-button rc-refresh"
            disabled={list.isFetching}
            onClick={() => void refresh()}
            aria-label="Refresh reconciliations"
          >
            <VaahanIcon
              name="refresh"
              size={14}
              className={list.isFetching ? "animate-spin" : ""}
            />
            <span>{list.isFetching ? "Updating…" : "Refresh"}</span>
          </button>
          {manage && (
            <Link className="rc-button rc-primary" href="/reconciliation/new">
              <VaahanIcon name="plus" size={14} />
              <span>New reconciliation</span>
            </Link>
          )}
          <button
            className="rc-button rc-help"
            onClick={() => setHelp(true)}
            aria-label="Reconciliation help"
          >
            <VaahanIcon name="help" size={16} />
          </button>
        </div>
      </header>
      <div className="rc-summary" aria-label="Inventory control summary">
        {[
          {
            label: "Open counts",
            metric: "open",
            scope: "open",
            icon: "layers" as const,
          },
          {
            label: "Variances",
            metric: "variances",
            scope: "variance",
            icon: "alert" as const,
          },
          {
            label: "Needs review",
            metric: "review",
            scope: "attention",
            icon: "clock" as const,
          },
          {
            label: "Matched today · IST",
            metric: "matchedToday",
            scope: "matched",
            icon: "check" as const,
          },
        ].map(({ label, metric, scope, icon }) => {
          const val = summary.data
            ? summary.data[metric as keyof ReconciliationSummary]
            : null;
          const countNum = typeof val === "number" ? val : 0;
          return (
            <button
              key={metric}
              className={`rc-metric-card rc-metric-${metric} ${countNum > 0 ? "rc-metric-has-count" : ""}`}
              onClick={() =>
                update({
                  ...EMPTY_RECONCILIATION_FILTERS,
                  scope:
                    scope === "variance" || scope === "matched" ? "" : scope,
                  variance:
                    scope === "variance"
                      ? "any"
                      : scope === "matched"
                        ? "matched"
                        : "",
                  ...(scope === "matched"
                    ? {
                        from: new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(new Date()),
                        to: new Intl.DateTimeFormat("en-CA", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }).format(new Date()),
                      }
                    : {}),
                })
              }
            >
              <div className="rc-metric-header">
                <span className="rc-metric-label">{label}</span>
                <div className="rc-metric-icon-wrap">
                  <VaahanIcon name={icon} size={15} />
                </div>
              </div>
              <div className="rc-metric-body">
                <strong className="rc-metric-value">
                  {summary.data
                    ? summary.data[
                        metric as keyof ReconciliationSummary
                      ].toLocaleString("en-IN")
                    : "—"}
                </strong>
              </div>
              <div className="rc-metric-footer">
                <span>Filter view</span>
                <VaahanIcon
                  name="arrow-right"
                  size={12}
                  className="rc-metric-arrow"
                />
              </div>
            </button>
          );
        })}
      </div>
      {summary.isError && (
        <ReconciliationError
          message="Summary temporarily unavailable."
          retry={summary.refetch}
        />
      )}
      {summary.data?.review && attention.data?.rows.length ? (
        <aside className="rc-attention-strip">
          <p className="rc-eyebrow">NEEDS ATTENTION · {summary.data?.review}</p>
          {attention.data.rows.slice(0, 3).map((r) => (
            <button key={r.id} onClick={(e) => inspect(r.id, e.currentTarget)}>
              <strong>{r.reference_code}</strong>
              <span>{r.custodian_name}</span>
              <small>
                {r.phase === "COUNTING"
                  ? "Count pending"
                  : `Ledger ${r.expected_quantity} · Physical ${r.counted_quantity} · Δ ${r.variance}`}
              </small>
              <em>{reconciliationLabel(r.attention || "")} →</em>
            </button>
          ))}
        </aside>
      ) : null}
      <div className="rc-toolbar">
        <div className="rc-search">
          <VaahanIcon name="search" size={17} />
          <label className="sr-only" htmlFor="rc-search">
            Search reconciliation reference, partner, batch or transfer
          </label>
          <input
            id="rc-search"
            value={search}
            placeholder="Search reference, partner, batch or transfer…"
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="rc-icon-button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                update({ ...filters, q: "" });
              }}
            >
              <VaahanIcon name="close" size={13} />
            </button>
          )}
        </div>
        <div className="rc-toolbar-actions">
          <button
            className="rc-button rc-mobile-filter"
            onClick={() => {
              setDraft(filters);
              setMobile(true);
            }}
          >
            <VaahanIcon name="filter" size={14} />
            Filters{chips.length ? ` · ${chips.length}` : ""}
          </button>
          <RadioGroup
            value={view}
            onValueChange={(v) => {
              if (!v) return;
              const p = new URLSearchParams(params.toString());
              p.set("view", v);
              window.history.replaceState(null, "", `/reconciliation?${p}`);
            }}
            aria-label="Presentation mode"
            className="rc-view-toggle"
          >
            <label className="rc-view-choice">
              <RadioGroupItem
                value="rows"
                aria-label="Rows view"
                className="sr-only"
              />
              <VaahanIcon name="rows" size={16} />
            </label>
            <label className="rc-view-choice">
              <RadioGroupItem
                value="grid"
                aria-label="Grid view"
                className="sr-only"
              />
              <VaahanIcon name="grid" size={16} />
            </label>
          </RadioGroup>
          {exportAllowed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rc-button rc-export-button"
                  disabled={exporting}
                >
                  <VaahanIcon name="download" size={14} />
                  <span>Export</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void exportRows(null)}>
                  Export current filtered view
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!selected.length}
                  onSelect={() => void exportRows(selected)}
                >
                  Export selected · {selected.length}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/reports">View requested reports</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <nav className="rc-tabs" aria-label="Operational views">
        {[
          ["All", "", ""],
          ["Open", "open", ""],
          ["Variance", "", "any"],
          ["Review", "attention", ""],
          ["Approval", "approval", ""],
          ["Closed", "closed", ""],
        ].map(([label, scope, variance]) => (
          <button
            key={label}
            aria-pressed={
              filters.scope === scope && filters.variance === variance
            }
            onClick={() =>
              update({ ...filters, scope: scope!, variance: variance! })
            }
          >
            {label}
          </button>
        ))}
      </nav>
      {chips.length > 0 && (
        <div className="rc-chips" aria-label="Active filters">
          {chips.map(([k, v]) => (
            <button
              key={k}
              className="rc-button"
              onClick={() =>
                update({
                  ...filters,
                  [k]: EMPTY_RECONCILIATION_FILTERS[
                    k as keyof ReconciliationFilters
                  ],
                  ...(k === "state" ? { district: "" } : {}),
                })
              }
            >
              {k === "partner"
                ? "Custodian selected"
                : k === "state"
                  ? "State selected"
                  : k === "district"
                    ? "District selected"
                    : `${reconciliationLabel(k)} · ${reconciliationLabel(v)}`}
              <VaahanIcon name="close" size={12} />
              <span className="sr-only">Remove {k} filter</span>
            </button>
          ))}
          <button
            className="rc-clear"
            onClick={() => update(EMPTY_RECONCILIATION_FILTERS)}
          >
            Clear all
          </button>
        </div>
      )}
      {exportError && (
        <p className="rc-error" role="alert">
          {exportError}
        </p>
      )}
      <div className="rc-layout">
        <aside className="rc-filter-sidebar">
          {filterFields}
          <button
            className="rc-clear"
            onClick={() => update(EMPTY_RECONCILIATION_FILTERS)}
          >
            Reset filters
          </button>
        </aside>
        <section
          className="rc-results"
          aria-label="Reconciliation results"
          aria-busy={list.isFetching}
        >
          <div className="rc-results-meta">
            <span>
              {rows.length.toLocaleString("en-IN")} reconciliations
              {selected.length ? ` · ${selected.length} selected` : ""}
            </span>
            <span role="status">
              {list.isFetching
                ? "Updating records…"
                : "Ledger and physical quantities · IST"}
            </span>
          </div>
          {list.isError && (
            <ReconciliationError
              message={
                rows.length
                  ? "Unable to update results. Existing records remain visible."
                  : "Unable to load reconciliations."
              }
              retry={list.refetch}
            />
          )}{" "}
          {list.isPending ? (
            <ReconciliationSkeleton view={view} />
          ) : !rows.length && !list.isError ? (
            <div className="rc-empty">
              <VaahanIcon name="layers" size={30} />
              <h2>
                {summary.data?.total === 0
                  ? "No reconciliations yet"
                  : "No matching reconciliations"}
              </h2>
              <p>
                {summary.data?.total === 0
                  ? "Authoritative ledger → physical count → compare → investigate → approve → close."
                  : "No records match the selected status, custodian, variance or date range."}
              </p>
              {summary.data?.total === 0 ? (
                manage && (
                  <Link
                    className="rc-button rc-primary"
                    href="/reconciliation/new"
                  >
                    Start reconciliation
                  </Link>
                )
              ) : (
                <button
                  className="rc-button"
                  onClick={() => update(EMPTY_RECONCILIATION_FILTERS)}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {view === "rows" && (
                <div className="rc-table-wrap rc-desktop-rows">
                  <table>
                    <thead>
                      <tr>
                        {exportAllowed && (
                          <th>
                            <span className="sr-only">Select for export</span>
                          </th>
                        )}
                        <th>Reconciliation</th>
                        <th>Custodian / location</th>
                        <th>Balance</th>
                        <th>Variance / outcome</th>
                        <th>Workflow</th>
                        <th>Count date · IST</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          {exportAllowed && (
                            <td>
                              <input
                                type="checkbox"
                                checked={selected.includes(r.id)}
                                onChange={() => toggle(r.id)}
                                aria-label={`Select ${r.reference_code} for export`}
                              />
                            </td>
                          )}
                          <td>
                            <button
                              className="rc-reference"
                              onClick={(e) => inspect(r.id, e.currentTarget)}
                            >
                              {r.reference_code}
                            </button>
                            {r.transfer_reference && (
                              <small>
                                <Link href={`/transfers/${r.transfer_id}`}>
                                  {r.transfer_reference}
                                </Link>
                              </small>
                            )}
                          </td>
                          <td>
                            <strong>{r.custodian_name}</strong>
                            <small>
                              {reconciliationLabel(r.custodian_kind)}
                            </small>
                            <small>{custodianLocation(r)}</small>
                          </td>
                          <td>
                            <span>
                              Ledger <b>{r.expected_quantity}</b>
                            </span>
                            <small>
                              Physical{" "}
                              <b>
                                {r.phase === "COUNTING"
                                  ? "Pending"
                                  : r.counted_quantity}
                              </b>
                            </small>
                          </td>
                          <td>
                            <strong
                              className={
                                r.variance && r.phase !== "COUNTING"
                                  ? "rc-variance"
                                  : ""
                              }
                            >
                              {r.phase === "COUNTING"
                                ? "—"
                                : r.variance > 0
                                  ? `+${r.variance}`
                                  : r.variance}
                            </strong>
                            <small>{varianceDescription(r)}</small>
                            <small>{reconciliationLabel(r.outcome)}</small>
                          </td>
                          <td>
                            <ReconciliationBadge row={r} />
                            {r.attention && (
                              <small>{reconciliationLabel(r.attention)}</small>
                            )}
                          </td>
                          <td>
                            {reconciliationDate(
                              r.count_completed_at || r.created_at,
                            )}
                            <small>
                              {r.count_completed_at
                                ? "Count completed"
                                : "Creation date · count time not recorded"}
                            </small>
                          </td>
                          <td>
                            <div className="rc-table-actions">
                              <button
                                className="rc-button rc-inspect-btn"
                                onClick={(e) => inspect(r.id, e.currentTarget)}
                              >
                                <span>Inspect</span>
                                <VaahanIcon
                                  name="arrow-right"
                                  size={12}
                                  className="rc-inspect-arrow"
                                />
                              </button>
                              <RecordMenu
                                r={r}
                                inspect={(button) => inspect(r.id, button)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div
                className={`rc-grid ${view === "rows" ? "rc-mobile-rows" : ""}`}
              >
                {rows.map(card)}
              </div>
            </>
          )}
          {list.hasNextPage && (
            <div className="rc-load-more">
              <button
                className="rc-button"
                disabled={list.isFetchingNextPage}
                onClick={() => void list.fetchNextPage()}
              >
                {list.isFetchingNextPage
                  ? "Loading…"
                  : "Load more reconciliations"}
              </button>
            </div>
          )}
        </section>
      </div>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="rc-filter-sheet">
          <SheetTitle>Filter reconciliations</SheetTitle>
          <SheetDescription>Commit a stock-control view.</SheetDescription>
          {filterFields}
          <div className="rc-actions">
            <button
              className="rc-button"
              onClick={() => setDraft(EMPTY_RECONCILIATION_FILTERS)}
            >
              Reset
            </button>
            <button
              className="rc-button rc-primary"
              onClick={() => {
                update(draft);
                setMobile(false);
              }}
            >
              Apply filters
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet
        open={!!preview}
        onOpenChange={(v) => {
          if (!v) setPreview(null);
        }}
      >
        <SheetContent
          className="rc-sheet"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            focusTarget.current?.focus();
          }}
        >
          <SheetTitle>Inspect reconciliation</SheetTitle>
          <SheetDescription>
            Ledger, physical count and next action.
          </SheetDescription>
          {preview && (
            <ReconciliationDetailView
              identity={identity}
              id={preview}
              compact
            />
          )}
        </SheetContent>
      </Sheet>
      <Sheet open={help} onOpenChange={setHelp}>
        <SheetContent className="rc-sheet">
          <SheetTitle>How reconciliation works</SheetTitle>
          <SheetDescription>
            Ledger → physical count → variance → resolution → approval.
          </SheetDescription>
          <p>
            A count preserves a server-created snapshot of unsold physical
            stock. It cannot create new QR identities or activate services.
          </p>
          <p>
            Closing acknowledges the resolution. It does not erase a variance or
            adjust inventory. A separate approved action can mark the exact
            unchanged missing or damaged identities unavailable.
          </p>
          <p>
            Transfer discrepancies stay in the Transfers workflow. Historical
            count dates, classifications and evidence are shown only when
            recorded.
          </p>
          <button className="rc-button" onClick={() => void refresh()}>
            Refresh records
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
function RecordMenu({
  r,
  inspect,
}: {
  r: ReconciliationRow;
  inspect: (button: HTMLButtonElement) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          ref={trigger}
          className="rc-icon-button"
          aria-label={`Actions for ${r.reference_code}`}
        >
          <VaahanIcon name="more-horizontal" size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => {if(trigger.current)inspect(trigger.current)}}>
          Inspect reconciliation
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/reconciliation/${r.id}`}>Open full reconciliation</Link>
        </DropdownMenuItem>
        {r.transfer_id && (
          <DropdownMenuItem asChild>
            <Link href={`/transfers/${r.transfer_id}`}>
              Open related transfer
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() =>
            void navigator.clipboard.writeText(r.reference_code).then(
              () => toast.success("Reference copied."),
              () => toast.error("Reference could not be copied."),
            )
          }
        >
          Copy reference
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            void navigator.clipboard.writeText(r.id).then(
              () => toast.success("Internal reference copied."),
              () => toast.error("Reference could not be copied."),
            )
          }
        >
          Copy internal ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function ReconciliationFiltersPanel({
  identity,
  filters: f,
  onChange,
}: {
  identity: AdminIdentity;
  filters: ReconciliationFilters;
  onChange: (f: ReconciliationFilters) => void;
}) {
  const select = (
    key: keyof ReconciliationFilters,
    label: string,
    options: string[][],
  ) => (
    <div className="rc-field">
      <label>{label}</label>
      <AdminSelect
        label={label}
        value={f[key]}
        onValueChange={(v) => onChange({ ...f, [key]: v })}
        options={options.map(([value, label]) => ({
          value: value!,
          label: label!,
        }))}
      />
    </div>
  );
  return (
    <div className="rc-filters">
      <p className="rc-eyebrow">FILTER RECONCILIATIONS</p>
      {select("status", "Workflow status", [
        ["", "All statuses"],
        ["OPEN", "Open"],
        ["REVIEWED", "Reviewed"],
        ["CLOSED", "Closed"],
      ])}
      {select("variance", "Variance / outcome", [
        ["", "All outcomes"],
        ["matched", "Matched"],
        ["any", "Any variance"],
        ["shortage", "Missing stock"],
        ["surplus", "Unexpected stock"],
        ["damaged", "Damaged stock"],
      ])}
      <div className="rc-field">
        <label>Custodian</label>
        <CustodianPicker
          identity={identity}
          allowAll
          value={f.partner}
          onChange={(id) => onChange({ ...f, partner: id })}
        />
      </div>
      {select("kind", "Custodian type", [
        ["", "All types"],
        ["DISTRIBUTOR", "Distributor"],
        ["RETAILER", "Retailer"],
        ["WAREHOUSE", "Central inventory"],
      ])}
      <GeographyCombobox
        label="State"
        value={f.state}
        allowClear
        onChange={(state) => onChange({ ...f, state, district: "" })}
      />
      <GeographyCombobox
        label="District"
        state={f.state}
        value={f.district}
        allowClear
        onChange={(district) => onChange({ ...f, district })}
      />
      {select("dateMode", "Date refers to", [
        ["count", "Count date"],
        ["created", "Created date"],
        ["closed", "Closed date"],
      ])}
      <ReconciliationDateRange
        from={f.from}
        to={f.to}
        onChange={(from, to) => onChange({ ...f, from, to })}
      />
      <small>
        IST calendar dates. Historical count-date filters use creation date when
        count time was not recorded.
      </small>
      {select("sort", "Sort results", [
        ["newest", "Newest count"],
        ["oldest", "Oldest count"],
        ["updated", "Recently updated"],
        ["shortage", "Largest shortage"],
        ["surplus", "Largest surplus"],
        ["unresolved", "Oldest unresolved"],
      ])}
    </div>
  );
}
