"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
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
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import { toast } from "@vaahansafe/ui/components/sonner";
import { AdminSelect } from "../../../components/AdminSelect";
import { getAdminData } from "../../../lib/client-api";
import { canExport } from "../../../lib/exports";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  RetailerFilters as Filters,
  RetailerPage,
  RetailerSummary,
  RetailerRow,
} from "../retailer.types";
import {
  EMPTY_RETAILER_FILTERS,
  parseRetailerFilters,
  serializeRetailerFilters,
  normalizeRetailerSearch,
  retailerHealth,
  canManageRetailers,
} from "../retailer.filters";
import { uniqueDistributorRows } from "../../distributors/distributor.filters";
import { mutateNetwork } from "../../network/mutation";
import { RetailerFilters } from "./RetailerFilters";
import { RetailerForm } from "./RetailerForm";
import {
  RetailerPreview,
  RetailerEditor,
  RetailerSkeleton,
} from "./RetailerDetail";
export function RetailerStatus({ row }: { row: RetailerRow }) {
  const signals = retailerHealth(row);
  return (
    <div className="dist-statuses">
      <span
        className={`dist-badge${row.status === "SUSPENDED" ? " dist-badge-attention" : ""}`}
      >
        {row.status === "ACTIVE" ? "Active" : "Suspended"}
      </span>
      <small>
        {row.verification_status === "VERIFIED"
          ? "Verified"
          : row.verification_status === "PENDING"
            ? "Verification pending"
            : "Requires correction"}
      </small>
      {signals
        .filter((s) => s !== "Suspended" && s !== "Verification required")
        .slice(0, 2)
        .map((s) => (
          <small className="dist-attention" key={s}>
            {s}
          </small>
        ))}
    </div>
  );
}
export function timeLabel(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not recorded";
}
export function RetailerWorkspace({
  identity,
  initial,
  initialSummary,
  initialFilters,
}: {
  identity: AdminIdentity;
  initial: RetailerPage | null;
  initialSummary: RetailerSummary | null;
  initialFilters: Filters;
}) {
  const params = useSearchParams(),
    filters = useMemo(
      () => parseRetailerFilters(new URLSearchParams(params.toString())),
      [params],
    ),
    key = serializeRetailerFilters(filters),
    initialKey = serializeRetailerFilters(initialFilters),
    client = useQueryClient();
  const [search, setSearch] = useState(filters.q),
    [mobile, setMobile] = useState(false),
    [draft, setDraft] = useState(filters),
    [creating, setCreating] = useState(false),
    [preview, setPreview] = useState<string | null>(null),
    [editing, setEditing] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [activityColumn, setActivityColumn] = useState(true),
    [exporting, setExporting] = useState(false);
  const update = (f: Filters) => {
    const q = serializeRetailerFilters(
      parseRetailerFilters(new URLSearchParams(serializeRetailerFilters(f))),
    );
    window.history.pushState(null, "", `/retailers${q ? "?" + q : ""}`);
    setSelected([]);
  };
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => setSelected([]), [key]);
  useEffect(() => {
    const t = setTimeout(() => {
      const q = normalizeRetailerSearch(search);
      if (q !== filters.q) update({ ...filters, q });
    }, 300);
    return () => clearTimeout(t);
  }, [search, filters]);
  const list = useInfiniteQuery({
    queryKey: ["retailers", "list", key],
    queryFn: ({ signal, pageParam }) =>
      getAdminData<RetailerPage>(
        `/api/retailers?${key}${pageParam ? "&cursor=" + encodeURIComponent(pageParam) : ""}`,
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
  });
  const summary = useQuery({
    queryKey: ["retailers", "summary"],
    queryFn: ({ signal }) =>
      getAdminData<RetailerSummary>("/api/retailers/summary", signal),
    initialData: initialSummary || undefined,
    staleTime: 30000,
  });
  const rows = uniqueDistributorRows(list.data?.pages.map((p) => p.rows) || []),
    filterCount = Object.entries(filters).filter(
      ([k, v]) => v && k !== "sort" && k !== "q",
    ).length,
    filtered = key !== "";
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ["retailers"] });
  const exportReport = async (ids?: string[]) => {
    setExporting(true);
    try {
      await mutateNetwork("/api/exports", {
        moduleKey: "retailers",
        filters: key,
        ids: ids || null,
      });
      toast.success("Export requested", {
        description: "Your scoped retailer report is being prepared.",
        action: {
          label: "View reports",
          onClick: () => window.location.assign("/reports"),
        },
      });
    } catch (e) {
      toast.error("Could not request export", {
        description: (e as Error).message,
      });
    } finally {
      setExporting(false);
    }
  };
  const toggle = (id: string, checked: boolean) =>
    setSelected((old) =>
      checked
        ? old.length < 100
          ? [...new Set([...old, id])]
          : old
        : old.filter((v) => v !== id),
    );
  const actions = (r: RetailerRow) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Actions for ${r.name}`}>⋯</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/retailers/${r.id}`}>Open retailer</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPreview(r.id)}>
          Quick preview
        </DropdownMenuItem>
        {["inventory", "transfers", "activations", "audit"].map((tab) => (
          <DropdownMenuItem key={tab} asChild>
            <Link href={`/retailers/${r.id}?tab=${tab}`}>
              View {tab === "audit" ? "audit trail" : tab}
            </Link>
          </DropdownMenuItem>
        ))}
        {r.parent_distributor_id && (
          <DropdownMenuItem asChild>
            <Link href={`/distributors/${r.parent_distributor_id}`}>
              Open distributor
            </Link>
          </DropdownMenuItem>
        )}
        {canManageRetailers(identity.role) && (
          <>
            <DropdownMenuItem onSelect={() => setEditing(r.id)}>
              Edit retailer
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/retailers/${r.id}?tab=overview`}>
                {r.status === "ACTIVE"
                  ? "Review suspension"
                  : "Review reactivation"}
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const fields: [keyof RetailerSummary, string, string][] = [
    ["total", "Retailers", "Local outlet network"],
    ["active", "Active", "Operational partners"],
    ["stock", "Available stock", "Recorded retailer custody"],
    ["transit", "In transit", "Incoming stock"],
    ["activations", "Activations / 30d", "From retained retail custody"],
    ["attention", "Attention", "Stock, verification or variance"],
  ];
  return (
    <section className="dist-workspace retail-workspace">
      <header className="dist-header">
        <div>
          <p className="dist-eyebrow">Operations / Retail network</p>
          <h1>Retailers</h1>
          <p>
            Manage local fulfilment partners, inventory and QR distribution.
          </p>
          <small>
            {summary.data
              ? `${summary.data.total.toLocaleString("en-IN")} retailers · ${summary.data.districts} districts`
              : "Retail summary unavailable"}
            {summary.dataUpdatedAt
              ? ` · Updated ${new Date(summary.dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </small>
        </div>
        <div className="dist-actions">
          <button
            disabled={list.isFetching || summary.isFetching}
            onClick={refresh}
          >
            {list.isFetching || summary.isFetching ? "Refreshing…" : "Refresh"}
          </button>
          {canExport(identity.role, "retailers") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button disabled={exporting}>
                  {exporting ? "Requesting…" : "Export ⌄"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => void exportReport()}>
                  Current filtered results
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!selected.length}
                  onSelect={() => void exportReport(selected)}
                >
                  Selected retailers ({selected.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canManageRetailers(identity.role) && (
            <button className="dist-primary" onClick={() => setCreating(true)}>
              + New retailer
            </button>
          )}
        </div>
      </header>
      <dl className="dist-summary">
        {fields.map(([k, label, help]) => (
          <div key={k}>
            <dt>{label}</dt>
            <dd>
              {summary.data ? summary.data[k].toLocaleString("en-IN") : "—"}
            </dd>
            <small>{help}</small>
          </div>
        ))}
      </dl>
      {summary.isError && (
        <div role="alert" className="dist-error">
          Summary could not refresh.{" "}
          <button onClick={() => void summary.refetch()}>Retry summary</button>
        </div>
      )}
      <div className="dist-layout">
        <aside className="dist-filter-rail" aria-label="Retailer filters">
          <RetailerFilters value={filters} onChange={update} />
        </aside>
        <div className="dist-results">
          <div className="dist-toolbar">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update({ ...filters, q: normalizeRetailerSearch(search) });
              }}
            >
              <label className="sr-only" htmlFor="retailer-search">
                Search retailer, reference, locality or distributor
              </label>
              <input
                id="retailer-search"
                placeholder="Search retailer, reference, locality or distributor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <button
              className="dist-mobile-filter"
              onClick={() => {
                setDraft(filters);
                setMobile(true);
              }}
            >
              Filters{filterCount ? " " + filterCount : ""}
            </button>
            <AdminSelect
              label="Sort retailers"
              value={filters.sort}
              onValueChange={(sort) =>
                update({ ...filters, sort: sort as Filters["sort"] })
              }
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
              ]}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="dist-column-control">Columns</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={activityColumn}
                  onCheckedChange={setActivityColumn}
                >
                  Activation activity
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {filterCount > 0 && (
            <p className="retail-filter-note">
              {filterCount} filters applied ·{" "}
              <button onClick={() => update(EMPTY_RETAILER_FILTERS)}>
                Clear filters
              </button>
            </p>
          )}
          {list.isError && (
            <div className="dist-error" role="alert">
              We couldn't load retailers right now.{" "}
              <button onClick={() => void list.refetch()}>Retry</button>
            </div>
          )}
          {list.isPending ? (
            <RetailerSkeleton />
          ) : rows.length === 0 && !list.isError ? (
            <div className="dist-empty">
              <span className="dist-network-icon" aria-hidden>
                ⌂
              </span>
              <p className="dist-eyebrow">Retail network</p>
              <h2>
                {filtered
                  ? "No retailers match these filters."
                  : "No retailers have been added yet."}
              </h2>
              <p>
                {filtered
                  ? "Try changing distributor, location, status or inventory filters."
                  : "Retailers are local fulfilment points that receive VaahanSafe QR inventory from authorized distributors and serve vehicle owners."}
              </p>
              {filtered ? (
                <button onClick={() => update(EMPTY_RETAILER_FILTERS)}>
                  Clear filters
                </button>
              ) : (
                canManageRetailers(identity.role) && (
                  <button
                    className="dist-primary"
                    onClick={() => setCreating(true)}
                  >
                    + Add first retailer
                  </button>
                )
              )}
            </div>
          ) : (
            rows.length > 0 && (
              <>
                <div className="dist-result-bar" aria-live="polite">
                  <span>
                    {rows.length} retailers loaded
                    {list.isFetching && !list.isFetchingNextPage
                      ? " · Updating…"
                      : ""}
                  </span>
                  {selected.length > 0 && (
                    <span>
                      {selected.length} selected ·{" "}
                      <button onClick={() => setSelected([])}>
                        Clear selection
                      </button>
                    </span>
                  )}
                </div>
                <div className="dist-table-wrap">
                  <table className="dist-table retail-table">
                    <thead>
                      <tr>
                        <th>
                          <span className="sr-only">Select retailers</span>
                        </th>
                        <th>Retailer</th>
                        <th>Distributor</th>
                        <th>Location</th>
                        <th>Stock</th>
                        {activityColumn && (
                          <th className="retail-activity-column">Activity</th>
                        )}
                        <th>Status</th>
                        <th className="retail-updated-column">Updated</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${r.name}`}
                              checked={selected.includes(r.id)}
                              disabled={
                                !selected.includes(r.id) &&
                                selected.length >= 100
                              }
                              onChange={(e) => toggle(r.id, e.target.checked)}
                            />
                          </td>
                          <td>
                            <button
                              className="dist-row-name"
                              onClick={() => setPreview(r.id)}
                            >
                              {r.name}
                            </button>
                            <small>{r.reference_code}</small>
                          </td>
                          <td>
                            {r.parent_distributor_id ? (
                              <Link
                                href={`/distributors/${r.parent_distributor_id}`}
                              >
                                {r.distributor_name}
                              </Link>
                            ) : (
                              "Supply setup required"
                            )}
                            <small>{r.distributor_reference}</small>
                          </td>
                          <td>
                            {r.city}
                            <small>
                              {r.district_name || "District setup required"}
                              <br />
                              {r.state_name}
                            </small>
                          </td>
                          <td>
                            <strong>
                              {r.available.toLocaleString("en-IN")}
                            </strong>
                            <small>
                              {r.in_transit} incoming
                              {r.reserved ? ` · ${r.reserved} reserved` : ""}
                            </small>
                          </td>
                          {activityColumn && (
                            <td className="retail-activity-column">
                              {r.activations_30d} / 30d
                              <small>{r.activations_today} today</small>
                            </td>
                          )}
                          <td>
                            <RetailerStatus row={r} />
                          </td>
                          <td className="retail-updated-column">
                            <small>{timeLabel(r.last_activity_at)}</small>
                          </td>
                          <td>{actions(r)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="dist-mobile-cards">
                  {rows.map((r) => (
                    <article key={r.id}>
                      <div className="dist-card-top">
                        <button
                          className="dist-row-name"
                          onClick={() => setPreview(r.id)}
                        >
                          {r.name}
                        </button>
                        {actions(r)}
                      </div>
                      <small>{r.reference_code}</small>
                      <RetailerStatus row={r} />
                      <p>
                        {r.city} ·{" "}
                        {r.district_name || "Location setup required"}
                        <br />
                        {r.state_name}
                        <br />
                        {r.distributor_name || "Supply setup required"}
                      </p>
                      <dl>
                        <div>
                          <dt>Stock</dt>
                          <dd>{r.available}</dd>
                        </div>
                        <div>
                          <dt>Incoming</dt>
                          <dd>{r.in_transit}</dd>
                        </div>
                        <div>
                          <dt>Today</dt>
                          <dd>{r.activations_today}</dd>
                        </div>
                      </dl>
                      <label className="dist-mobile-selection">
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          disabled={
                            !selected.includes(r.id) && selected.length >= 100
                          }
                          onChange={(e) => toggle(r.id, e.target.checked)}
                        />
                        Select {r.name}
                      </label>
                      <small>Updated {timeLabel(r.last_activity_at)}</small>
                      <Link
                        className="dist-link-button"
                        href={`/retailers/${r.id}`}
                      >
                        View retailer
                      </Link>
                    </article>
                  ))}
                </div>
                {list.isFetchingNextPage && <RetailerSkeleton rows={2} />}
                <div className="dist-load-more">
                  {list.hasNextPage && (
                    <button
                      disabled={list.isFetching}
                      onClick={() => void list.fetchNextPage()}
                    >
                      {list.isFetchingNextPage
                        ? "Loading more…"
                        : "Load more retailers"}
                    </button>
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent className="dist-sheet retail-filter-sheet">
          <SheetTitle>Filter retailers</SheetTitle>
          <SheetDescription>
            Find local outlets by supply network, location and stock health.
          </SheetDescription>
          <RetailerFilters value={draft} onChange={setDraft} />
          <footer className="retail-sheet-footer">
            <button onClick={() => setDraft(EMPTY_RETAILER_FILTERS)}>
              Reset
            </button>
            <button
              className="dist-primary"
              onClick={() => {
                update(draft);
                setMobile(false);
              }}
            >
              Show results
            </button>
          </footer>
        </SheetContent>
      </Sheet>
      {creating && <RetailerForm open onClose={() => setCreating(false)} />}
      <RetailerPreview
        id={preview}
        onClose={() => setPreview(null)}
        identity={identity}
      />
      {editing && (
        <RetailerEditor id={editing} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
