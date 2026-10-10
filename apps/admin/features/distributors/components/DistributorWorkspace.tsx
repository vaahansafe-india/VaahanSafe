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
  SheetDescription,
  SheetTitle,
} from "@vaahansafe/ui/components/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import { toast } from "@vaahansafe/ui/components/sonner";
import { getAdminData } from "../../../lib/client-api";
import { canExport } from "../../../lib/exports";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  DistributorFilters as Filters,
  DistributorPage,
  DistributorSummary,
  DistributorRow,
} from "../distributor.types";
import {
  EMPTY_DISTRIBUTOR_FILTERS,
  normalizeDistributorSearch,
  parseDistributorFilters,
  serializeDistributorFilters,
  uniqueDistributorRows,
} from "../distributor.filters";
import { canManageDistributors } from "../distributor.permissions";
import { DistributorFilters } from "./DistributorFilters";
import { DistributorForm, mutateDistributor } from "./DistributorForm";
import { DistributorPreview, DistributorSkeleton } from "./DistributorDetail";
import { AdminSelect } from "../../../components/AdminSelect";
import { VaahanIcon } from "@vaahansafe/icons";
export function DistributorWorkspace({
  identity,
  initial,
  initialSummary,
  initialFilters,
}: {
  identity: AdminIdentity;
  initial: DistributorPage | null;
  initialSummary: DistributorSummary | null;
  initialFilters: Filters;
}) {
  const params = useSearchParams(),
    filters = useMemo(
      () => parseDistributorFilters(new URLSearchParams(params.toString())),
      [params],
    ),
    key = serializeDistributorFilters(filters),
    initialKey = serializeDistributorFilters(initialFilters),
    client = useQueryClient();
  const [search, setSearch] = useState(filters.q),
    [mobileFilters, setMobileFilters] = useState(false),
    [creating, setCreating] = useState(false),
    [preview, setPreview] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [columns, setColumns] = useState(["retailers", "activity"]),
    [exporting, setExporting] = useState(false);
  const update = (f: Filters) => {
    window.history.pushState(
      null,
      "",
      `/distributors${serializeDistributorFilters(f) ? `?${serializeDistributorFilters(f)}` : ""}`,
    );
    setSelected([]);
  };
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => setSelected([]), [key]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = normalizeDistributorSearch(search);
      if (q !== filters.q) update({ ...filters, q });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filters]);
  const list = useInfiniteQuery({
    queryKey: ["distributors", "list", key],
    queryFn: ({ pageParam, signal }) =>
      getAdminData<DistributorPage>(
        `/api/distributors?${key}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
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
    queryKey: ["distributors", "summary"],
    queryFn: ({ signal }) =>
      getAdminData<DistributorSummary>("/api/distributors/summary", signal),
    initialData: initialSummary || undefined,
    staleTime: 30000,
  });
  const rows = uniqueDistributorRows(list.data?.pages.map((p) => p.rows) || []),
    filtered = key !== "";
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ["distributors"] });
  const requestExport = async (ids?: string[]) => {
    setExporting(true);
    try {
      await mutateDistributor("/api/exports", {
        moduleKey: "distributors",
        filters: key,
        ids: ids || null,
      });
      toast.success("Export requested", {
        description: "Your filtered distributor report is being prepared.",
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
  const fields: readonly [keyof DistributorSummary, string, string][] = [
    ["total", "Total distributors", "Regional network"],
    ["active", "Active", "Operational partners"],
    ["states", "States / UTs", "Physical locations"],
    ["stock", "Stock held", "Recorded distributor custody"],
    ["transit", "In transit", "Incoming transfers"],
    ["attention", "Attention", "Verification, suspension or variance"],
  ];
  return (
    <section className="dist-workspace">
      <header className="dist-header">
        <div>
          <p className="dist-eyebrow">Operations / Distribution</p>
          <h1>Distributors</h1>
          <p>Regional partners, territories and QR inventory custody.</p>
          <small>
            {summary.data
              ? `${summary.data.total.toLocaleString("en-IN")} distributors · ${summary.data.states} states / UTs`
              : "Network summary unavailable"}
            {summary.dataUpdatedAt
              ? ` · Updated ${new Date(summary.dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : ""}
          </small>
        </div>
        <div className="dist-actions">
          <button
            type="button"
            className="dist-btn dist-btn-refresh"
            onClick={refresh}
            disabled={list.isFetching || summary.isFetching}
            title="Refresh distributor list"
          >
            <VaahanIcon
              name="refresh"
              size={13}
              className={list.isFetching || summary.isFetching ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
          {canExport(identity.role, "distributors") && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="dist-btn dist-btn-export"
                  disabled={exporting}
                  title="Export reports"
                >
                  <VaahanIcon name="download" size={13} />
                  <span>{exporting ? "Requesting…" : "Export"}</span>
                  <VaahanIcon name="chevron-down" size={11} className="opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => void requestExport()}>
                  Current filtered results
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!selected.length}
                  onSelect={() => void requestExport(selected)}
                >
                  Selected distributors ({selected.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canManageDistributors(identity.role) && (
            <button
              type="button"
              className="dist-btn dist-primary"
              onClick={() => setCreating(true)}
              title="Create new distributor record"
            >
              <VaahanIcon name="plus" size={13} />
              <span>New distributor</span>
            </button>
          )}
        </div>
      </header>
      <dl className="dist-summary">
        {fields.map(([field, label, caption]) => (
          <div key={field}>
            <dt>{label}</dt>
            <dd>
              {summary.data ? summary.data[field].toLocaleString("en-IN") : "—"}
            </dd>
            <small>
              {summary.isError && !summary.data ? "Unavailable" : caption}
            </small>
          </div>
        ))}
      </dl>
      {summary.isError && (
        <p role="status" className="dist-error">
          The network summary could not refresh.{" "}
          <button onClick={() => void summary.refetch()}>Retry summary</button>
        </p>
      )}
      <div className="dist-layout">
        <aside className="dist-filter-rail">
          <DistributorFilters value={filters} onChange={update} />
        </aside>
        <div className="dist-results">
          <div className="dist-toolbar">
            <form
              className="dist-search-form"
              onSubmit={(e) => {
                e.preventDefault();
                update({ ...filters, q: normalizeDistributorSearch(search) });
              }}
            >
              <label className="sr-only" htmlFor="distributor-search">
                Search distributor name, reference, or district
              </label>
              <div className="dist-search-wrap">
                <VaahanIcon name="search" size={13} className="dist-search-icon" />
                <input
                  id="distributor-search"
                  placeholder="Search name, reference, district…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="dist-search-clear"
                    onClick={() => {
                      setSearch("");
                      update({ ...filters, q: "" });
                    }}
                    title="Clear search"
                  >
                    <VaahanIcon name="close" size={11} />
                  </button>
                )}
              </div>
            </form>
            <div className="dist-toolbar-controls">
              <button
                type="button"
                className="dist-btn dist-mobile-filter"
                onClick={() => setMobileFilters(true)}
              >
                <VaahanIcon name="filter" size={13} />
                <span>Filters</span>
                {Object.entries(filters).filter(
                  ([k, v]) => v && k !== "q" && k !== "sort",
                ).length > 0 && (
                  <span className="dist-filter-badge">
                    {
                      Object.entries(filters).filter(
                        ([k, v]) => v && k !== "q" && k !== "sort",
                      ).length
                    }
                  </span>
                )}
              </button>
              <AdminSelect
                label="Sort distributors"
                value={filters.sort}
                options={[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                ]}
                onValueChange={(s) =>
                  update({
                    ...filters,
                    sort: s === "oldest" ? "oldest" : "newest",
                  })
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="dist-btn dist-column-control">
                    <VaahanIcon name="layers" size={13} />
                    <span>Columns</span>
                    <VaahanIcon name="chevron-down" size={11} className="opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[
                    { key: "retailers", label: "Retailer count" },
                    { key: "activity", label: "Last activity" },
                  ].map((c) => (
                    <DropdownMenuCheckboxItem
                      key={c.key}
                      checked={columns.includes(c.key)}
                      onCheckedChange={(checked) =>
                        setColumns((v) =>
                          checked ? [...v, c.key] : v.filter((k) => k !== c.key),
                        )
                      }
                    >
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {list.isError && (
            <div className="dist-error" role="alert">
              <strong>Could not load distributors.</strong>
              <p>We couldn’t load the network right now. Please try again.</p>
              <button onClick={() => void list.refetch()}>Retry</button>
            </div>
          )}
          {list.isPending ? (
            <DistributorSkeleton />
          ) : !rows.length && !list.isError ? (
            <div className="dist-empty">
              <span aria-hidden className="dist-network-icon">
                ◎
              </span>
              <p className="dist-eyebrow">Distribution network</p>
              <h2>
                {filtered
                  ? "No distributors match these filters."
                  : "Build your regional distribution network."}
              </h2>
              <p>
                {filtered
                  ? "Try changing state, district, status or inventory filters."
                  : "Distributors manage regional QR inventory, serve approved territories and supply authorized retailers."}
              </p>
              {filtered ? (
                <button onClick={() => update(EMPTY_DISTRIBUTOR_FILTERS)}>
                  Clear filters
                </button>
              ) : (
                canManageDistributors(identity.role) && (
                  <button
                    className="dist-primary"
                    onClick={() => setCreating(true)}
                  >
                    + Add first distributor
                  </button>
                )
              )}
            </div>
          ) : (
            rows.length > 0 && (
              <>
                <div className="dist-result-bar" role="status">
                  {rows.length} loaded
                  {list.isFetching && !list.isFetchingNextPage
                    ? " · Updating results…"
                    : ""}
                  {selected.length > 0 && (
                    <span>
                      {selected.length} selected{" "}
                      <button onClick={() => setSelected([])}>
                        Clear selection
                      </button>
                    </span>
                  )}
                </div>
                <div className="dist-table-wrap" aria-busy={list.isFetching}>
                  <table className="dist-table">
                    <caption className="sr-only">
                      Regional distributor operations
                    </caption>
                    <thead>
                      <tr>
                        <th>
                          <span className="sr-only">Select</span>
                        </th>
                        <th>Distributor</th>
                        <th>Location / territory</th>
                        <th>Inventory</th>
                        <th hidden={!columns.includes("retailers")}>
                          Retailers
                        </th>
                        <th>Status / attention</th>
                        <th hidden={!columns.includes("activity")}>
                          Last activity
                        </th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${row.name}`}
                              checked={selected.includes(row.id)}
                              disabled={
                                list.isPlaceholderData ||
                                (selected.length >= 100 &&
                                  !selected.includes(row.id))
                              }
                              onChange={() =>
                                setSelected((v) =>
                                  v.includes(row.id)
                                    ? v.filter((id) => id !== row.id)
                                    : [...v, row.id],
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              className="dist-row-name"
                              onClick={() => setPreview(row.id)}
                            >
                              {row.name}
                            </button>
                            <small>{row.reference_code}</small>
                          </td>
                          <td>
                            {row.city}
                            <small>
                              {row.district_name || "Location setup required"} ·{" "}
                              {row.state_name || "State not recorded"}
                            </small>
                            <small>
                              {row.territory_count} service districts
                            </small>
                          </td>
                          <td>
                            <strong>
                              {row.on_hand.toLocaleString("en-IN")}
                            </strong>
                            <small>
                              {row.in_transit.toLocaleString("en-IN")} in
                              transit
                            </small>
                          </td>
                          <td hidden={!columns.includes("retailers")}>
                            {row.retailer_count}
                          </td>
                          <td>
                            <DistributorStatus row={row} />
                          </td>
                          <td hidden={!columns.includes("activity")}>
                            <time dateTime={row.last_activity_at}>
                              {new Date(
                                row.last_activity_at,
                              ).toLocaleDateString("en-IN")}
                            </time>
                          </td>
                          <td>
                            <RowActions
                              row={row}
                              onPreview={() => setPreview(row.id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="dist-mobile-cards">
                  {rows.map((row) => (
                    <article key={row.id}>
                      <label className="dist-mobile-selection">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          disabled={
                            list.isPlaceholderData ||
                            (selected.length >= 100 &&
                              !selected.includes(row.id))
                          }
                          onChange={() =>
                            setSelected((v) =>
                              v.includes(row.id)
                                ? v.filter((id) => id !== row.id)
                                : [...v, row.id],
                            )
                          }
                        />
                        Select distributor
                      </label>
                      <div className="dist-card-top">
                        <button
                          className="dist-row-name"
                          onClick={() => setPreview(row.id)}
                        >
                          {row.name}
                        </button>
                        <RowActions
                          row={row}
                          onPreview={() => setPreview(row.id)}
                        />
                      </div>
                      <small>{row.reference_code}</small>
                      <DistributorStatus row={row} />
                      <p>
                        {row.city}
                        <br />
                        {row.district_name || "Location setup required"} ·{" "}
                        {row.state_name || "State not recorded"}
                      </p>
                      <dl>
                        <div>
                          <dt>Stock</dt>
                          <dd>{row.on_hand.toLocaleString("en-IN")}</dd>
                        </div>
                        <div>
                          <dt>In transit</dt>
                          <dd>{row.in_transit.toLocaleString("en-IN")}</dd>
                        </div>
                        <div>
                          <dt>Retailers</dt>
                          <dd>{row.retailer_count}</dd>
                        </div>
                      </dl>
                      <button onClick={() => setPreview(row.id)}>
                        View distributor
                      </button>
                    </article>
                  ))}
                </div>
                {list.isFetchingNextPage && <DistributorSkeleton rows={3} />}{" "}
                {list.hasNextPage && (
                  <div className="dist-load-more">
                    <button
                      disabled={list.isFetching}
                      onClick={() => void list.fetchNextPage()}
                    >
                      {list.isFetchingNextPage
                        ? "Loading more…"
                        : "Load more distributors"}
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>
      <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
        <SheetContent className="dist-sheet">
          <SheetTitle>Filter distributors</SheetTitle>
          <SheetDescription>
            Find partners by location, custody and operational status.
          </SheetDescription>
          <DistributorFilters value={filters} onChange={update} />
          <button
            className="dist-primary"
            onClick={() => setMobileFilters(false)}
          >
            Show results
          </button>
        </SheetContent>
      </Sheet>
      {creating && (
        <DistributorForm
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false);
            refresh();
            setPreview(id);
          }}
        />
      )}
      <DistributorPreview
        id={preview}
        onClose={() => setPreview(null)}
        identity={identity}
      />
    </section>
  );
}
function RowActions({
  row,
  onPreview,
}: {
  row: DistributorRow;
  onPreview: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Actions for ${row.name}`}>···</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onPreview}>Quick preview</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/distributors/${row.id}`}>Open distributor</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard
              .writeText(row.reference_code)
              .then(() => toast.success("Distributor reference copied"))
              .catch(() => toast.error("Could not copy reference"));
          }}
        >
          Copy reference
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function DistributorStatus({ row }: { row: DistributorRow }) {
  return (
    <div className="dist-statuses">
      <span
        className={`dist-badge ${row.status === "SUSPENDED" ? "dist-badge-attention" : ""}`}
      >
        {row.status === "ACTIVE" ? "Active" : "Suspended"}
      </span>
      <small>
        {row.verification_status === "VERIFIED"
          ? "✓ Verified"
          : row.verification_status === "PENDING"
            ? "Verification pending"
            : "Requires correction"}
      </small>
      {row.reconciliation_issues > 0 && (
        <small className="dist-attention">
          Reconciliation review · {row.unresolved_variance} variance units
        </small>
      )}
    </div>
  );
}
