"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@vaahansafe/ui/components/sheet";
import type { AdminIdentity } from "../../../lib/contracts";
import { getAdminData } from "../../../lib/client-api";
import { AdminSelect } from "../../../components/AdminSelect";
import { canExport } from "../../../lib/exports";
import type {
  InventoryPage,
  InventoryFacets,
  InventoryFilters,
  InventorySelection,
} from "../inventory.types";
import {
  EMPTY_FILTERS,
  parseInventoryFilters,
  serializeInventoryFilters,
  normalizeInventorySearch,
  appendInventoryRows,
} from "../inventory.filters";
import { selectedCount, toggleSelected } from "../inventory.selection";
import { canPrintInventory } from "../inventory.permissions";
import { InventoryFilterRail, stateLabel } from "./InventoryFilters";
import {
  InventoryGrid,
  INVENTORY_COLUMNS,
  type InventoryColumn,
} from "./InventoryGrid";
import { InventoryPreview, InventorySkeleton } from "./InventoryDetail";
import { PrintDialog, postInventory } from "./PrintDialog";
import { BlockDialog } from "./BlockDialog";

export function InventoryWorkspace({
  identity,
  initial,
  initialFacets,
  initialFilters,
}: {
  identity: AdminIdentity;
  initial: InventoryPage | null;
  initialFacets: InventoryFacets | null;
  initialFilters: InventoryFilters;
}) {
  const params = useSearchParams(),
    filters = useMemo(
      () => parseInventoryFilters(new URLSearchParams(params.toString())),
      [params],
    );
  const key = serializeInventoryFilters(filters),
    initialKey = serializeInventoryFilters(initialFilters),
    client = useQueryClient();
  const [search, setSearch] = useState(filters.q),
    [filterSheet, setFilterSheet] = useState(false),
    [selection, setSelection] = useState<InventorySelection>({
      mode: "ids",
      ids: [],
    }),
    [preview, setPreview] = useState<string | null>(null),
    [printing, setPrinting] = useState<InventorySelection | null>(null),
    [blocking, setBlocking] = useState<InventorySelection | null>(null),
    [compact, setCompact] = useState(false),
    [columns, setColumns] = useState<InventoryColumn[]>([
      "batch",
      "lifecycle",
      "print",
      "activation",
      "created",
    ]),
    [notice, setNotice] = useState(""),
    [actionBusy, setActionBusy] = useState(false);
  const update = useCallback((next: InventoryFilters) => {
    const query = serializeInventoryFilters(next);
    window.history.pushState(
      null,
      "",
      query ? `/inventory?${query}` : "/inventory",
    );
  }, []);
  useEffect(() => {
    setSearch(filters.q);
    setSelection({ mode: "ids", ids: [] });
  }, [key, filters.q]);
  useEffect(() => {
    if (normalizeInventorySearch(search) === filters.q) return;
    const timer = setTimeout(
      () => update({ ...filters, q: normalizeInventorySearch(search) }),
      300,
    );
    return () => clearTimeout(timer);
  }, [search, filters, update]);
  const query = useInfiniteQuery({
    queryKey: ["inventory-list", key],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      getAdminData<InventoryPage>(
        `/api/inventory?${key}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        signal,
      ),
    getNextPageParam: (page) => page.nextCursor || undefined,
    initialData:
      key === initialKey && initial
        ? { pages: [initial], pageParams: [null] }
        : undefined,
    staleTime: 30000,
  });
  const facets = useQuery({
    queryKey: ["inventory-facets", key],
    queryFn: ({ signal }) =>
      getAdminData<InventoryFacets>(`/api/inventory/facets?${key}`, signal),
    initialData:
      key === initialKey && initialFacets ? initialFacets : undefined,
    staleTime: 30000,
  });
  const rows = useMemo(
      () => appendInventoryRows(query.data?.pages.map((p) => p.rows) || []),
      [query.data],
    ),
    count = selectedCount(selection),
    write = canPrintInventory(identity.role);
  const refresh = useCallback(() => {
    setSelection({ mode: "ids", ids: [] });
    void client.invalidateQueries({ queryKey: ["inventory-list"] });
    void client.invalidateQueries({ queryKey: ["inventory-facets"] });
    void client.invalidateQueries({ queryKey: ["inventory-detail"] });
  }, [client]);
  const toggle = useCallback(
    (id: string) =>
      setSelection((s) => {
        const next = toggleSelected(s, id);
        if (
          (next.mode === "ids" && next.ids.length > 100) ||
          (next.mode === "all" && next.excluded.length > 100)
        ) {
          setNotice(
            "Select up to 100 individual identities per operation. Use all matching results for a query selection.",
          );
          return s;
        }
        return next;
      }),
    [],
  );
  const inspect = useCallback((id: string) => setPreview(id), []),
    print = useCallback((s: InventorySelection) => {
      setPreview(null);
      setPrinting(s);
    }, []),
    block = useCallback((s: InventorySelection) => {
      setPreview(null);
      setBlocking(s);
    }, []);
  async function allMatching() {
    setActionBusy(true);
    try {
      const result = await postInventory<{ token: string; count: number }>(
        "/api/inventory/selection",
        { filters: key },
      );
      setSelection({ mode: "all", ...result, excluded: [] });
      setNotice(
        "All matching results selected using a server-side query snapshot.",
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setActionBusy(false);
    }
  }
  async function exportInventory(scope: "filtered" | "selected") {
    setActionBusy(true);
    try {
      await postInventory("/api/exports", {
        moduleKey: "inventory",
        filters: key,
        ...(scope === "selected" ? { selection } : {}),
      });
      setNotice("Export queued. Open Reports to download the completed file.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setActionBusy(false);
    }
  }
  const activeChips = Object.entries(filters).filter(
    ([k, v]) =>
      k !== "q" && k !== "sort" && (Array.isArray(v) ? v.length : !!v),
  );
  return (
    <div className="inventory-workspace">
      <header className="inventory-header">
        <div>
          <p className="admin-section-label">OPERATIONS / QR INVENTORY</p>
          <h1>QR Inventory</h1>
          <p>Trace, inspect and manage every physical VaahanSafe identity.</p>
        </div>
        <div className="admin-actions">
          <button
            className="admin-button"
            disabled={query.isFetching || facets.isFetching}
            onClick={refresh}
          >
            Refresh
          </button>
          {canExport(identity.role, "inventory") && (
            <details className="inventory-control">
              <summary>Export ▾</summary>
              <div>
                <button
                  disabled={actionBusy}
                  onClick={() => void exportInventory("filtered")}
                >
                  Export filtered results
                </button>
                <button
                  disabled={actionBusy || !count}
                  onClick={() => void exportInventory("selected")}
                >
                  Export selected identities
                </button>
              </div>
            </details>
          )}
        </div>
      </header>
      <div className="inventory-summary" aria-label="Inventory summary">
        {(
          ["total", "available", "activated", "blocked", "replaced"] as const
        ).map((name) => {
          const isSelected =
            name === "total"
              ? filters.statuses.length === 0 && !filters.activation && !filters.risk
              : name === "activated"
                ? filters.statuses.includes("ACTIVATED") || filters.activation === "active"
                : name === "available"
                  ? filters.statuses.includes("INVENTORY") && filters.statuses.length === 1
                  : name === "blocked"
                    ? filters.statuses.includes("BLOCKED")
                    : name === "replaced"
                      ? filters.statuses.includes("REPLACED") || filters.risk === "replacement"
                      : false;

          const handleClick = () => {
            if (name === "total") {
              update({ ...EMPTY_FILTERS });
            } else if (name === "activated") {
              if (isSelected) {
                update({ ...filters, statuses: [], activation: "" });
              } else {
                update({ ...filters, statuses: ["ACTIVATED"], activation: "active" });
              }
            } else if (name === "available") {
              if (isSelected) {
                update({ ...filters, statuses: [] });
              } else {
                update({ ...filters, statuses: ["INVENTORY"] });
              }
            } else if (name === "blocked") {
              if (isSelected) {
                update({ ...filters, statuses: [] });
              } else {
                update({ ...filters, statuses: ["BLOCKED"] });
              }
            } else if (name === "replaced") {
              if (isSelected) {
                update({ ...filters, statuses: [], risk: "" });
              } else {
                update({ ...filters, statuses: ["REPLACED"] });
              }
            }
          };

          return (
            <button
              type="button"
              key={name}
              onClick={handleClick}
              className={`inventory-summary-card ${isSelected ? "is-selected" : ""}`}
              aria-pressed={isSelected}
            >
              <span>{name === "total" ? "Identities" : stateLabel(name)}</span>
              <strong>
                {facets.data
                  ? facets.data[name].toLocaleString("en-IN")
                  : facets.isError
                    ? "Unavailable"
                    : "…"}
              </strong>
            </button>
          );
        })}
      </div>
      {facets.isError && (
        <div className="admin-notice error" role="alert">
          Inventory counts are unavailable.{" "}
          <button onClick={() => void facets.refetch()}>Retry counts</button>
        </div>
      )}
      <div className="inventory-toolbar">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ ...filters, q: normalizeInventorySearch(search) });
          }}
        >
          <label className="sr-only" htmlFor="inventory-search">
            Search QR inventory
          </label>
          <span aria-hidden="true">⌕</span>
          <input
            id="inventory-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search QR ID, visible code or batch reference…"
            maxLength={64}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearch("");
                update({ ...filters, q: "" });
              }}
            >
              ×
            </button>
          )}
        </form>
        <button
          className="admin-button inventory-mobile-filter"
          onClick={() => setFilterSheet(true)}
        >
          Filters {activeChips.length || ""}
        </button>
        <label className="inventory-view-select">
          <span className="sr-only">Inventory view</span>
          <AdminSelect
            label="Inventory view"
            value={
              filters.statuses.includes("ACTIVATED") || filters.activation === "active"
                ? "activated"
                : filters.statuses.includes("INVENTORY") && filters.statuses.length === 1
                  ? "available"
                  : filters.risk === "failed"
                    ? "risk"
                    : ""
            }
            onValueChange={(v) => {
              if (v === "activated")
                update({ ...EMPTY_FILTERS, statuses: ["ACTIVATED"], activation: "active" });
              if (v === "available")
                update({ ...EMPTY_FILTERS, statuses: ["INVENTORY"] });
              if (v === "risk") update({ ...EMPTY_FILTERS, risk: "failed" });
              if (v === "all") update({ ...EMPTY_FILTERS });
            }}
            options={[
              { value: "", label: "Choose view" },
              { value: "all", label: "All inventory" },
              { value: "activated", label: "Activated identities" },
              { value: "available", label: "Inventory stock" },
              { value: "risk", label: "Failed activation attempts" },
            ]}
          />
        </label>
        <details className="inventory-control">
          <summary>Columns ▾</summary>
          <div>
            {INVENTORY_COLUMNS.map((c) => (
              <label className="inventory-check" key={c}>
                <input
                  type="checkbox"
                  checked={columns.includes(c)}
                  onChange={() =>
                    setColumns((v) =>
                      v.includes(c) ? v.filter((x) => x !== c) : [...v, c],
                    )
                  }
                />
                {stateLabel(c)}
              </label>
            ))}
          </div>
        </details>
        <label className="inventory-view-select">
          <span className="sr-only">Row density</span>
          <AdminSelect
            label="Row density"
            value={compact ? "compact" : "comfortable"}
            onValueChange={(v) => setCompact(v === "compact")}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </label>
      </div>
      {activeChips.length > 0 && (
        <div className="inventory-filter-chips">
          {activeChips.map(([k, v]) => (
            <button
              key={k}
              aria-label={`Clear ${k} filter`}
              onClick={() =>
                update({ ...filters, [k]: Array.isArray(v) ? [] : "" })
              }
            >
              {stateLabel(k)}:{" "}
              {k === "batch"
                ? facets.data?.batches.find((b) => b.id === v)?.reference ||
                  "Selected batch"
                : Array.isArray(v)
                  ? v.map(stateLabel).join(", ")
                  : stateLabel(v)}{" "}
              ×
            </button>
          ))}
          <button onClick={() => update({ ...EMPTY_FILTERS })}>
            Clear all
          </button>
        </div>
      )}
      <div className="inventory-body">
        <aside className="inventory-filter-rail" aria-label="Inventory filters">
          <InventoryFilterRail
            filters={filters}
            facets={facets.data}
            onChange={update}
          />
        </aside>
        <section className="inventory-results" aria-label="Inventory results">
          <div className="inventory-results-heading">
            <strong>
              {facets.data
                ? `${facets.data.total.toLocaleString("en-IN")} results`
                : "Inventory results"}
            </strong>
            <label>
              Sort{" "}
              <AdminSelect
                label="Inventory sort"
                value={filters.sort}
                onValueChange={(v) =>
                  update({
                    ...filters,
                    sort: v as "newest" | "oldest",
                  })
                }
                options={[
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                ]}
              />
            </label>
          </div>
          <div className="inventory-selection-tools">
            <button
              disabled={!rows.length}
              onClick={() =>
                setSelection({
                  mode: "ids",
                  ids: query.data?.pages.at(-1)?.rows.map((r) => r.id) || [],
                })
              }
            >
              Select current 50
            </button>
            <button
              disabled={!rows.length || rows.length > 100}
              onClick={() =>
                setSelection({ mode: "ids", ids: rows.map((r) => r.id) })
              }
            >
              Select loaded ({rows.length})
            </button>
            <button
              disabled={actionBusy || !facets.data?.total}
              onClick={() => void allMatching()}
            >
              Select all matching ({facets.data?.total ?? "…"})
            </button>
            {count > 0 && (
              <button onClick={() => setSelection({ mode: "ids", ids: [] })}>
                Clear selection
              </button>
            )}
          </div>
          {count > 0 && (
            <div
              className="inventory-bulk-bar"
              role="region"
              aria-label="Selected inventory"
            >
              <strong>
                {count} selected{" "}
                {selection.mode === "all"
                  ? "· All matching"
                  : "· Individual rows"}
              </strong>
              {selection.mode === "all" && selection.excluded.length > 0 && (
                <span>{selection.excluded.length} excluded</span>
              )}
              {write && (
                <>
                  <button
                    className="admin-button primary"
                    disabled={count > 100}
                    onClick={() => print(selection)}
                  >
                    Review print
                  </button>
                  <button
                    className="admin-button"
                    disabled={count > 100}
                    onClick={() => block(selection)}
                  >
                    Review block
                  </button>
                </>
              )}
              {count > 100 && (
                <small>
                  Print and block operations are limited to 100 identities.
                  Narrow the filters or select rows.
                </small>
              )}
            </div>
          )}
          {notice && (
            <div className="admin-notice" role="status">
              {notice}
              <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          {query.isPending ? (
            <InventorySkeleton />
          ) : query.isError && !rows.length ? (
            <div className="inventory-empty" role="alert">
              <h2>Inventory couldn’t load</h2>
              <p>{query.error.message}</p>
              <button
                className="admin-button"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </div>
          ) : rows.length ? (
            <InventoryGrid
              rows={rows}
              selection={selection}
              columns={columns}
              compact={compact}
              write={write}
              onToggle={toggle}
              onInspect={inspect}
              onPrint={print}
              onBlock={block}
              onNotice={setNotice}
            />
          ) : (
            <div className="inventory-empty">
              <h2>{key ? "No matching identities" : "No QR inventory yet"}</h2>
              <p>
                {key
                  ? "Adjust your search or clear the filters to see more inventory."
                  : "Import or generate a batch to add physical identities."}
              </p>
              <button
                className="admin-button"
                onClick={() => update({ ...EMPTY_FILTERS })}
              >
                Clear filters
              </button>
            </div>
          )}
          {query.isFetchingNextPage && <InventorySkeleton />}
          {query.isFetchNextPageError && (
            <p className="admin-notice error" role="alert">
              The next page couldn’t load. Your current rows are preserved.
            </p>
          )}
          <footer className="inventory-load-more">
            <p>
              Showing {rows.length}
              {facets.data
                ? ` of ${facets.data.total.toLocaleString("en-IN")} matching identities`
                : ""}
            </p>
            {query.hasNextPage && (
              <button
                className="admin-button"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "Loading…" : "Load 50 more"}
              </button>
            )}
            <small>
              {rows.length
                ? "Stable order by creation time and identity"
                : "Find → Filter → Inspect"}
            </small>
          </footer>
        </section>
      </div>
      <Sheet open={filterSheet} onOpenChange={setFilterSheet}>
        <SheetContent
          side="left"
          className="inventory-filter-sheet"
          aria-describedby={undefined}
        >
          <SheetTitle>Filter inventory</SheetTitle>
          <InventoryFilterRail
            filters={filters}
            facets={facets.data}
            onChange={update}
          />
          <div className="inventory-sheet-actions">
            <button
              className="admin-button"
              onClick={() => update({ ...EMPTY_FILTERS })}
            >
              Reset
            </button>
            <button
              className="admin-button primary"
              onClick={() => setFilterSheet(false)}
            >
              Show {facets.data?.total ?? ""} results
            </button>
          </div>
        </SheetContent>
      </Sheet>
      {preview && (
        <InventoryPreview
          id={preview}
          onClose={() => setPreview(null)}
          onPrint={print}
        />
      )}{" "}
      {printing && (
        <PrintDialog selection={printing} onClose={() => setPrinting(null)} />
      )}{" "}
      {blocking && (
        <BlockDialog
          selection={blocking}
          onClose={() => setBlocking(null)}
          onComplete={refresh}
        />
      )}
    </div>
  );
}
