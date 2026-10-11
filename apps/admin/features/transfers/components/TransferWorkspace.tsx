"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import { toast } from "@vaahansafe/ui/components/sonner";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { getAdminData } from "../../../lib/client-api";
import { canExport } from "../../../lib/exports";
import type { AdminIdentity } from "../../../lib/contracts";
import { AdminSelect } from "../../../components/AdminSelect";
import { AdminDatePicker } from "../../../components/AdminDatePicker";
import {
  TRANSFER_STATUSES,
  EMPTY_TRANSFER_FILTERS,
  transferLabel,
  transferActions,
  type TransferRow,
  type TransferPage,
  type TransferSummary,
  type TransferFilters,
} from "../transfer.types";
import {
  parseTransferFilters,
  serializeTransferFilters,
} from "../transfer.filters";
import {
  transferScope,
  transferDate,
  TransferRail,
  TransferBadge,
  TransferError,
  TransferSkeleton,
  TransferPicker,
  canManageTransfers,
  useTransferRefresh,
} from "./TransferShared";
import { TransferDetail } from "./TransferDetail";
import { sendTransfer, TransferAction } from "./TransferAction";
export function TransferWorkspace({
  identity,
  initial,
  initialSummary,
  initialFilters,
}: {
  identity: AdminIdentity;
  initial: TransferPage | null;
  initialSummary: TransferSummary | null;
  initialFilters: TransferFilters;
}) {
  const params = useSearchParams(),
    filters = useMemo(
      () => parseTransferFilters(new URLSearchParams(params.toString())),
      [params],
    ),
    key = serializeTransferFilters(filters),
    initialKey = serializeTransferFilters(initialFilters),
    refresh = useTransferRefresh(identity);
  const [search, setSearch] = useState(filters.q),
    [draft, setDraft] = useState(filters),
    [mobile, setMobile] = useState(false),
    [preview, setPreview] = useState<string | null>(null),
    [action, setAction] = useState<{ row: TransferRow; action: string } | null>(
      null,
    ),
    [selected, setSelected] = useState<string[]>([]),
    [selecting, setSelecting] = useState(false),
    [exporting, setExporting] = useState(false);
  const update = (f: TransferFilters) => {
    const s = serializeTransferFilters(f);
    window.history.pushState(null, "", `/transfers${s ? `?${s}` : ""}`);
    setSelected([]);
  };
  useEffect(() => {
    setSearch(filters.q);
    setDraft(filters);
    setSelected([]);
  }, [key]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = parseTransferFilters(new URLSearchParams({ q: search })).q;
      if (q !== filters.q) update({ ...filters, q });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters]);
  const list = useInfiniteQuery({
    queryKey: [...transferScope(identity), "list", key],
    queryFn: ({ pageParam, signal }) =>
      getAdminData<TransferPage>(
        `/api/transfers?${key}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    initialData:
      key === initialKey && initial
        ? { pages: [initial], pageParams: [null] }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: 20000,
    retry: 1,
  });
  const summary = useQuery({
    queryKey: [...transferScope(identity), "summary"],
    queryFn: ({ signal }) =>
      getAdminData<TransferSummary>("/api/transfers/summary", signal),
    initialData: initialSummary || undefined,
    staleTime: 20000,
    retry: 1,
  });
  const attention = useQuery({
    queryKey: [...transferScope(identity), "attention"],
    queryFn: ({ signal }) =>
      getAdminData<TransferPage>("/api/transfers?view=attention", signal),
    enabled: !!summary.data?.attention,
    staleTime: 20000,
  });
  const rows = Array.from(
      new Map(
        (list.data?.pages.flatMap((p) => p.rows) || []).map((r) => [r.id, r]),
      ).values(),
    ),
    manage = canManageTransfers(identity),
    exportAllowed = canExport(identity.role, "transfers");
  const requestExport = async (ids: string[] | null, all = false) => {
    setExporting(true);
    try {
      await sendTransfer("/api/exports", {
        moduleKey: "transfers",
        filters: all ? "" : key,
        ids,
      });
      toast.success("Transfer export requested.", {
        action: {
          label: "View reports",
          onClick: () => window.location.assign("/reports"),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export unavailable.");
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
  const fields = (
    <TransferFilterFields
      identity={identity}
      values={draft}
      onChange={setDraft}
    />
  );
  return (
    <div className="tr-workspace">
      <header className="tr-header">
        <div>
          <p className="tr-eyebrow">OPERATIONS / INVENTORY CUSTODY</p>
          <h1>Transfer Control Center</h1>
          <p>
            Know where stock is, what arrived, and what needs your attention.
          </p>
        </div>
        <div className="tr-actions">
          <button
            type="button"
            className="tr-toolbar-btn"
            disabled={list.isFetching}
            onClick={() => void refresh()}
          >
            <VaahanIcon
              name="refresh"
              size={13}
              className={list.isFetching ? "animate-spin" : ""}
            />
            <span>{list.isFetching ? "Refreshing…" : "Refresh"}</span>
          </button>
          {manage && (
            <Link className="tr-link-button tr-primary" href="/transfers/new">
              <VaahanIcon name="plus" size={13} />
              <span>New transfer</span>
            </Link>
          )}
        </div>
      </header>
      <div className="tr-summary" aria-label="Transfer totals">
        {[
          ["Active", "active", ""],
          ["In transit", "transit", "transit"],
          ["Need attention", "attention", "attention"],
          ["Received today · IST", "receivedToday", ""],
        ].map(([label, metric, view]) => {
          const content = (
            <>
              <span>{label}</span>
              <strong>
                {summary.data
                  ? summary.data[
                      metric as keyof TransferSummary
                    ].toLocaleString("en-IN")
                  : "—"}
              </strong>
            </>
          );
          return view ? (
            <button
              key={metric}
              onClick={() => update({ ...EMPTY_TRANSFER_FILTERS, view: view! })}
            >
              {content}
            </button>
          ) : (
            <div key={metric}>{content}</div>
          );
        })}
      </div>
      {summary.isError && (
        <TransferError
          message="Transfer totals unavailable."
          retry={summary.refetch}
        />
      )}
      {!!summary.data?.attention && (
        <section className="tr-attention">
          <div className="tr-section-title">
            <h2>Needs attention</h2>
            <button
              onClick={() =>
                update({ ...EMPTY_TRANSFER_FILTERS, view: "attention" })
              }
            >
              View all {summary.data.attention}
            </button>
          </div>
          {attention.isError ? (
            <TransferError
              message="Attention queue unavailable."
              retry={attention.refetch}
            />
          ) : (
            <div className="tr-attention-queue">
              {attention.data?.rows.slice(0, 4).map((t) => (
                <button key={t.id} onClick={() => setPreview(t.id)}>
                  <strong>{t.reference_code}</strong>
                  <span>
                    {t.overdue
                      ? "Expected arrival passed"
                      : t.status === "PARTIALLY_RECEIVED"
                        ? "Receipt incomplete"
                        : `${t.damaged_quantity} damaged · ${t.missing_quantity} missing`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      <div className="dist-layout tr-layout">
        <aside
          className="dist-filter-rail tr-filter-rail"
          aria-label="Transfer filters"
        >
          <form
            className="tr-desktop-filters"
            onSubmit={(e) => {
              e.preventDefault();
              update(draft);
            }}
          >
            <div className="tr-filter-heading">
              <strong>Filter transfers</strong>
              <button
                type="button"
                className="tr-filter-clear"
                onClick={() => update({ ...EMPTY_TRANSFER_FILTERS })}
              >
                Clear all
              </button>
            </div>
            {fields}
            <div className="tr-actions">
              <button className="tr-primary">Apply filters</button>
              <button
                type="button"
                onClick={() => update({ ...EMPTY_TRANSFER_FILTERS })}
              >
                Reset
              </button>
            </div>
          </form>
        </aside>
        <div className="tr-results">
          <nav className="tr-views" aria-label="Transfer views">
            {[
              { value: "", label: "All transfers", icon: "route" as VaahanIconName },
              {
                value: "approvals",
                label: "Awaiting approval",
                icon: "clock" as VaahanIconName,
              },
              {
                value: "transit",
                label: "In transit",
                icon: "package" as VaahanIconName,
              },
              {
                value: "reconcile",
                label: "Reconciliation",
                icon: "shield-check" as VaahanIconName,
              },
              {
                value: "attention",
                label: "Needs attention",
                icon: "alert" as VaahanIconName,
              },
              {
                value: "closed",
                label: "Closed",
                icon: "check" as VaahanIconName,
              },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                className="tr-view-tab"
                aria-pressed={filters.view === value}
                onClick={() => update({ ...filters, view: value })}
              >
                <VaahanIcon name={icon} size={14} className="shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="tr-toolbar">
            <div className="tr-search-wrap">
              <label className="sr-only" htmlFor="tr-search-input">
                Search transfer reference
              </label>
              <VaahanIcon
                name="search"
                size={13}
                className="tr-search-icon shrink-0"
              />
              <input
                id="tr-search-input"
                className="tr-search-input"
                placeholder="Search transfer reference (VS-TRF…)"
                value={search}
                maxLength={100}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="tr-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <VaahanIcon name="close" size={11} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="tr-mobile-filter tr-toolbar-btn"
              onClick={() => {
                setDraft(filters);
                setMobile(true);
              }}
            >
              <VaahanIcon name="filter" size={13} />
              <span>Filters</span>
            </button>
            {exportAllowed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="tr-toolbar-btn"
                    disabled={exporting}
                  >
                    <VaahanIcon name="download" size={13} />
                    <span>{exporting ? "Exporting…" : "Export"}</span>
                    <VaahanIcon
                      name="chevron-down"
                      size={11}
                      className="opacity-60 shrink-0"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => void requestExport(null)}>
                    Export current view
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!selected.length}
                    onSelect={() => void requestExport(selected)}
                  >
                    Export selected ({selected.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => void requestExport(null, true)}
                  >
                    Request full export
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {exportAllowed && (
              <button
                type="button"
                className="tr-toolbar-btn"
                onClick={() => {
                  setSelecting(!selecting);
                  setSelected([]);
                }}
              >
                <VaahanIcon name="layers" size={13} />
                <span>{selecting ? "Exit selection" : "Select transfers"}</span>
              </button>
            )}
          </div>
          {!!key && (
            <div className="tr-chips" aria-label="Active filters">
              {Object.entries(filters)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    className="tr-chip"
                    onClick={() => update({ ...filters, [k]: "" })}
                    aria-label={`Remove ${k} filter`}
                  >
                    <span>
                      {k}:{" "}
                      {["source", "destination", "batch"].includes(k)
                        ? "Selected record"
                        : transferLabel(v)}
                    </span>
                    <VaahanIcon
                      name="close"
                      size={10}
                      className="shrink-0 opacity-70"
                    />
                  </button>
                ))}
              <button
                type="button"
                className="tr-chip-clear"
                onClick={() => update({ ...EMPTY_TRANSFER_FILTERS })}
              >
                Clear all
              </button>
            </div>
          )}
          <div className="tr-results-bar" aria-live="polite">
            <span>
              {selected.length ? `${selected.length} selected · ` : ""}
              {rows.length ? `${rows.length} transfers loaded` : ""}
            </span>
            {list.isFetching && rows.length > 0 && <span>Updating view…</span>}
          </div>
          {list.isPending ? (
            <TransferSkeleton />
          ) : list.isError && rows.length === 0 ? (
            <TransferError
              message="Unable to load transfers."
              retry={list.refetch}
            />
          ) : rows.length === 0 ? (
            <section className="tr-empty">
              <div className="tr-empty-icon" aria-hidden>
                <VaahanIcon name="route" size={26} />
              </div>
              <h2>
                {key ? "No transfers match these filters" : "No transfers yet"}
              </h2>
              <p>
                {key
                  ? "Adjust the filters or search for another transfer reference."
                  : "Transfers create an auditable custody trail whenever printed QR stock moves between VaahanSafe, distributors and retailers."}
              </p>
              {key ? (
                <button
                  type="button"
                  className="tr-primary"
                  onClick={() => update({ ...EMPTY_TRANSFER_FILTERS })}
                >
                  Clear filters
                </button>
              ) : (
                <>
                  <div className="tr-empty-route">
                    <span>Central inventory</span>
                    <VaahanIcon
                      name="arrow-right"
                      size={12}
                      className="opacity-50 shrink-0"
                    />
                    <span>Distributor</span>
                    <VaahanIcon
                      name="arrow-right"
                      size={12}
                      className="opacity-50 shrink-0"
                    />
                    <span>Retailer</span>
                  </div>
                  {manage && (
                    <Link
                      href="/transfers/new"
                      className="tr-link-button tr-primary"
                    >
                      <VaahanIcon name="plus" size={13} />
                      <span>Create first transfer</span>
                    </Link>
                  )}
                  <p className="tr-muted">
                    Request & reserve → Approve → Dispatch → Receive → Reconcile
                  </p>
                </>
              )}
            </section>
          ) : (
            <>
              <div className="tr-table-wrap">
                <table className="tr-table">
                  <thead>
                    <tr>
                      {exportAllowed && <th scope="col">Select</th>}
                      <th scope="col">Transfer / progress</th>
                      <th scope="col">Custody route</th>
                      <th scope="col">Quantity ledger</th>
                      <th scope="col">Updated · IST</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t.id}>
                        {exportAllowed && (
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${t.reference_code}`}
                              checked={selected.includes(t.id)}
                              disabled={
                                !selected.includes(t.id) &&
                                selected.length >= 100
                              }
                              onChange={() => toggle(t.id)}
                            />
                          </td>
                        )}
                        <td>
                          <Link
                            href={`/transfers/${t.id}`}
                            className="tr-reference"
                          >
                            {t.reference_code}
                          </Link>
                          <TransferBadge row={t} />
                          <TransferRail row={t} />
                        </td>
                        <td>
                          <strong>{t.source_name}</strong>
                          <span className="tr-table-destination">
                            <VaahanIcon
                              name="arrow-right"
                              size={11}
                              className="opacity-60 shrink-0 inline-block align-middle mr-1"
                            />
                            <span>{t.destination_name}</span>
                          </span>
                          <small>
                            {t.source_partner_id
                              ? "Distributor → Retailer"
                              : "Central → Distributor"}
                          </small>
                        </td>
                        <td>
                          <strong>{t.quantity} requested</strong>
                          <small>
                            {t.received_quantity} received ·{" "}
                            {t.damaged_quantity} damaged
                          </small>
                          <small>{t.missing_quantity} missing / lost</small>
                        </td>
                        <td>
                          {transferDate(t.updated_at)}
                          {t.overdue && (
                            <small className="tr-warn">Arrival overdue</small>
                          )}
                        </td>
                        <td>
                          <TransferRowMenu
                            row={t}
                            manage={manage}
                            onPreview={() => setPreview(t.id)}
                            onAction={(a) => setAction({ row: t, action: a })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="tr-mobile-cards">
                {rows.map((t) => (
                  <article key={t.id}>
                    {selecting && (
                      <label className="tr-check">
                        <input
                          type="checkbox"
                          checked={selected.includes(t.id)}
                          disabled={
                            !selected.includes(t.id) && selected.length >= 100
                          }
                          onChange={() => toggle(t.id)}
                        />
                        Select {t.reference_code}
                      </label>
                    )}
                    <div className="tr-section-title">
                      <Link
                        href={`/transfers/${t.id}`}
                        className="tr-reference"
                      >
                        {t.reference_code}
                      </Link>
                      <TransferRowMenu
                        row={t}
                        manage={manage}
                        onPreview={() => setPreview(t.id)}
                        onAction={(a) => setAction({ row: t, action: a })}
                      />
                    </div>
                    <TransferBadge row={t} />
                    <p className="tr-card-route">
                      <span>{t.source_name}</span>
                      <VaahanIcon
                        name="arrow-right"
                        size={11}
                        className="opacity-60 shrink-0 inline-block align-middle mx-1"
                      />
                      <span>{t.destination_name}</span>
                    </p>
                    <TransferRail row={t} />
                    <div className="tr-card-ledger">
                      <strong>{t.quantity} requested</strong>
                      <span>{t.received_quantity} received</span>
                      <span>
                        {t.damaged_quantity} damaged · {t.missing_quantity}{" "}
                        missing
                      </span>
                    </div>
                    <small>Updated {transferDate(t.updated_at)} IST</small>
                  </article>
                ))}
              </div>
              {list.isError && (
                <TransferError
                  message="Unable to load further records."
                  retry={list.refetch}
                />
              )}{" "}
              {list.hasNextPage && (
                <div className="tr-more">
                  <button
                    disabled={list.isFetching}
                    onClick={() => void list.fetchNextPage()}
                  >
                    {list.isFetching ? "Loading…" : "Load next 50 transfers"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent className="tr-sheet">
          <SheetTitle>Filter transfers</SheetTitle>
          <SheetDescription>
            Choose route, stock and dates, then apply to the workspace.
          </SheetDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update(draft);
              setMobile(false);
            }}
          >
            <TransferFilterFields
              identity={identity}
              values={draft}
              onChange={setDraft}
            />
            <div className="tr-filter-footer">
              <button
                type="button"
                onClick={() => setDraft({ ...EMPTY_TRANSFER_FILTERS })}
              >
                Reset
              </button>
              <button className="tr-primary">Apply filters</button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
      <Sheet
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
      >
        <SheetContent className="tr-sheet tr-preview">
          <SheetTitle>Transfer preview</SheetTitle>
          <SheetDescription>
            Route, quantity ledger and custody trail.
          </SheetDescription>
          {preview && (
            <TransferDetail
              key={preview}
              identity={identity}
              id={preview}
              preview
            />
          )}
        </SheetContent>
      </Sheet>
      {action && (
        <TransferAction
          row={action.row}
          action={action.action}
          onClose={() => setAction(null)}
          onChanged={refresh}
          onResolveMissing={() => setAction({ row: action.row, action: "resolve" })}
        />
      )}
    </div>
  );
}
function TransferRowMenu({
  row,
  manage,
  onPreview,
  onAction,
}: {
  row: TransferRow;
  manage: boolean;
  onPreview: () => void;
  onAction: (a: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="tr-row-menu-btn"
          aria-label={`Actions for ${row.reference_code}`}
        >
          <VaahanIcon name="more" size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onPreview}>Quick preview</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/transfers/${row.id}`}>Open transfer</Link>
        </DropdownMenuItem>
        {manage &&
          transferActions(row.status, row).map((a) => (
            <DropdownMenuItem key={a} onSelect={() => onAction(a)}>
              {transferLabel(a)}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function TransferFilterFields({
  identity,
  values,
  onChange,
}: {
  identity: AdminIdentity;
  values: TransferFilters;
  onChange: (f: TransferFilters) => void;
}) {
  const set = (k: keyof TransferFilters, v: string) =>
    onChange({ ...values, [k]: v });
  return (
    <div className="tr-filter-fields">
      <div className="tr-filter-field">
        <span className="tr-filter-label">Status</span>
        <AdminSelect
          label="Transfer status"
          value={values.status}
          onValueChange={(v) => set("status", v)}
          options={[
            { value: "", label: "All statuses" },
            ...TRANSFER_STATUSES.map((value) => ({
              value,
              label: transferLabel(value),
            })),
          ]}
        />
      </div>
      <div className="tr-filter-field">
        <span className="tr-filter-label">Movement</span>
        <AdminSelect
          label="Movement type"
          value={values.movement}
          onValueChange={(v) => set("movement", v)}
          options={[
            { value: "", label: "All movements" },
            { value: "central", label: "Central → Distributor" },
            { value: "retail", label: "Distributor → Retailer" },
          ]}
        />
      </div>
      <div className="tr-filter-field">
        <span className="tr-filter-label">Source</span>
        <TransferPicker
          identity={identity}
          label="Source partner"
          partnerKind="DISTRIBUTOR"
          value={values.source}
          extraOptions={[
            { id: "central", label: "Central inventory (VaahanSafe central)" },
          ]}
          onChange={(v) => set("source", v)}
          predicate={(p) => p.kind === "DISTRIBUTOR"}
        />
      </div>
      <div className="tr-filter-field">
        <span className="tr-filter-label">Destination</span>
        <TransferPicker
          identity={identity}
          label="Destination partner"
          value={values.destination}
          onChange={(v) => set("destination", v)}
        />
      </div>
      <div className="tr-filter-field">
        <span className="tr-filter-label">Batch</span>
        <TransferPicker
          identity={identity}
          kind="batches"
          label="Transferred batch"
          source={values.source === "central" ? "" : values.source}
          value={values.batch}
          onChange={(v) => set("batch", v)}
        />
      </div>
      <fieldset className="tr-filter-dates">
        <legend>Requested</legend>
        <div className="tr-filter-field">
          <span className="tr-filter-label">From</span>
          <AdminDatePicker
            value={values.from}
            onChange={(v) => set("from", v)}
            label="Requested from date"
            placeholder="From date"
          />
        </div>
        <div className="tr-filter-field">
          <span className="tr-filter-label">To</span>
          <AdminDatePicker
            value={values.to}
            onChange={(v) => set("to", v)}
            label="Requested to date"
            placeholder="To date"
          />
        </div>
      </fieldset>
    </div>
  );
}
