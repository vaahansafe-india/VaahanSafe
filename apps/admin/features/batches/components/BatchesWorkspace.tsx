"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  BatchFilters,
  BatchItem,
  BatchPage,
  BatchSummary,
  CreateBatchInput,
} from "../batches.types";
import { formatQuantity, timeAgo } from "../batches.presentation";
import { BatchSummaryStrip } from "./BatchSummaryStrip";
import { BatchFilterRail } from "./BatchFilters";
import { MobileFilterSheet } from "./MobileFilterSheet";
import { BatchGrid } from "./BatchGrid";
import { BatchMobileCards } from "./BatchMobileCards";
import { BatchQuickPreview } from "./BatchQuickPreview";
import { NewBatchMenu } from "./NewBatchMenu";
import { CreateBatchDialog } from "./CreateBatchDialog";
import { ImportOfflineBatchDialog } from "./ImportOfflineBatchDialog";
import { GenerateIdentitiesDialog } from "./GenerateIdentitiesDialog";
import { VoidBatchDialog } from "./VoidBatchDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui/components/select";
import { VaahanIcon } from "@vaahansafe/icons";

interface BatchesWorkspaceProps {
  identity: AdminIdentity;
  initial: BatchPage | null;
  initialSummary: BatchSummary | null;
  initialFilters: BatchFilters;
}

export function BatchesWorkspace({
  identity,
  initial,
  initialSummary,
  initialFilters,
}: BatchesWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [filters, setFilters] = useState<BatchFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState(initialFilters.q);

  // Cumulative loaded rows for progressive "Load more"
  const [accumulatedRows, setAccumulatedRows] = useState<BatchItem[]>(
    initial?.rows || [],
  );
  const [nextCursor, setNextCursor] = useState<string | null>(
    initial?.nextCursor || null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Active selected row for Quick Preview
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [generateTarget, setGenerateTarget] = useState<BatchItem | null>(null);
  const [voidTarget, setVoidTarget] = useState<BatchItem | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Last refreshed timestamp
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const canManage = ["SUPER_ADMIN", "OPS_ADMIN"].includes(identity.role);

  // Build query string from filters
  const buildQueryString = useCallback((f: BatchFilters) => {
    const params = new URLSearchParams();
    if (f.q.trim()) params.set("q", f.q.trim());
    f.statuses.forEach((st) => params.append("status", st));
    f.channels.forEach((ch) => params.append("channel", ch));
    if (f.print !== "any") params.set("print", f.print);
    if (f.sort !== "newest") params.set("sort", f.sort);
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
    return params.toString();
  }, []);

  // Synchronize URL params with filter changes
  const updateFilters = useCallback(
    (newFilters: BatchFilters) => {
      setFilters(newFilters);
      setNextCursor(null); // Reset pagination cursor on filter update
      const qs = buildQueryString(newFilters);
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      });
    },
    [buildQueryString, pathname, router],
  );

  // Debounced search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.q) {
        updateFilters({ ...filters, q: searchQuery });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, filters, updateFilters]);

  // Fetch batches list
  const listQuery = useQuery({
    queryKey: ["batches-list", buildQueryString(filters)],
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/batches?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed loading batches");
      return data.data as BatchPage;
    },
    initialData:
      buildQueryString(filters) === buildQueryString(initialFilters)
        ? (initial ?? undefined)
        : undefined,
  });

  // Fetch summary strip metrics
  const summaryQuery = useQuery({
    queryKey: ["batches-summary"],
    queryFn: async () => {
      const res = await fetch("/api/batches/summary");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed loading summary");
      return data.data as BatchSummary;
    },
    initialData: initialSummary ?? undefined,
  });

  // Keep accumulated rows updated when listQuery changes
  useEffect(() => {
    if (listQuery.data) {
      setAccumulatedRows(listQuery.data.rows);
      setNextCursor(listQuery.data.nextCursor);
      setLastRefreshed(new Date());
    }
  }, [listQuery.data]);

  // Load more with progressive cursor
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const qs = buildQueryString(filters);
      const cursorParam = `cursor=${encodeURIComponent(nextCursor)}`;
      const fullQs = qs ? `${qs}&${cursorParam}` : cursorParam;

      const res = await fetch(`/api/batches?${fullQs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed loading more");

      const page = data.data as BatchPage;
      setAccumulatedRows((prev) => [...prev, ...page.rows]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Load more failed");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Full manual refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["batches-list"] }),
        queryClient.invalidateQueries({ queryKey: ["batches-summary"] }),
      ]);
      setLastRefreshed(new Date());
      toast.success("Batches refreshed");
    } catch {
      toast.error("Failed refreshing batches");
    }
  };

  // Create batch action
  const handleCreateBatch = async (input: CreateBatchInput) => {
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed creating batch");
    }

    toast.success(`Batch ${input.reference} created successfully`);
    await handleRefresh();
  };

  // Validation transition action
  const handleValidateBatch = async (batch: BatchItem) => {
    try {
      const res = await fetch(`/api/batches/${batch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toStatus: "VALIDATED",
          reason: "Validated cryptographic and packaging requirements",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Validation failed");

      toast.success(`Batch ${batch.reference} validated successfully`);
      await handleRefresh();
      if (selectedBatch?.id === batch.id) {
        setSelectedBatch((prev) => (prev ? { ...prev, status: "VALIDATED" } : null));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed");
    }
  };

  const handleExport = async (scope: "filtered" | "all") => {
    toast.info("Preparing batch export…");
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "batches",
          scope,
          format: "csv",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Export failed");
      toast.success("Export requested. Download link will appear in Exports.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  const summary = summaryQuery.data || initialSummary;
  const totalBatches = summary?.totalBatches ?? accumulatedRows.length;
  const totalIdentities = summary?.totalIdentities ?? 0;

  return (
    <div className="batches-workspace">
      {/* HEADER */}
      <header className="batches-header">
        <div>
          <span className="admin-section-label">OPERATIONS / BATCHES</span>
          <h1>Batches</h1>
          <p className="batches-header-sub">
            Manufacturing and physical identity operations.
          </p>
          <small className="batches-activity-time">
            {formatQuantity(totalBatches)} batches · {formatQuantity(totalIdentities)} QR identities · Updated {timeAgo(lastRefreshed.toISOString())}
          </small>
        </div>

        <div className="batches-header-actions">
          <button
            type="button"
            className="admin-button"
            disabled={listQuery.isFetching}
            onClick={handleRefresh}
          >
            {listQuery.isFetching ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            className="admin-button"
            onClick={() => handleExport("filtered")}
          >
            Export ▾
          </button>

          {canManage && (
            <NewBatchMenu
              onCreateOnline={() => setCreateDialogOpen(true)}
              onImportOffline={() => setImportDialogOpen(true)}
            />
          )}
        </div>
      </header>

      {/* SUMMARY STRIP */}
      <BatchSummaryStrip
        summary={summary}
        filters={filters}
        onChange={updateFilters}
        isLoading={summaryQuery.isLoading}
      />

      {/* MAIN BODY: FILTER RAIL + TABLE */}
      <div className="batches-body">
        {/* DESKTOP FILTER RAIL */}
        <BatchFilterRail
          filters={filters}
          onChange={updateFilters}
          onReset={() =>
            updateFilters({
              q: "",
              statuses: [],
              channels: [],
              print: "any",
              sort: "newest",
              from: "",
              to: "",
            })
          }
        />

        {/* MAIN CONTENT AREA */}
        <main className="batches-content-area">
          {/* TOOLBAR */}
          <div className="batches-toolbar">
            <form
              className="batches-search-form"
              onSubmit={(e) => {
                e.preventDefault();
                updateFilters({ ...filters, q: searchQuery });
              }}
            >
              <span className="batches-search-icon" aria-hidden="true">
                ⌕
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch reference or manufacturer…"
                className="batches-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="batches-search-clear"
                  onClick={() => {
                    setSearchQuery("");
                    updateFilters({ ...filters, q: "" });
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </form>

            <button
              type="button"
              className="admin-button batches-mobile-filter-btn"
              onClick={() => setMobileFilterOpen(true)}
            >
              Filters
              {filters.statuses.length + filters.channels.length > 0 &&
                ` (${filters.statuses.length + filters.channels.length})`}
            </button>

            <div className="batches-sort-wrapper">
              <Select
                value={filters.sort}
                onValueChange={(val) =>
                  updateFilters({ ...filters, sort: val as any })
                }
              >
                <SelectTrigger className="batches-sort-trigger" aria-label="Sort batches">
                  <SelectValue placeholder="Sort batches" />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="quantity_desc">Largest quantity</SelectItem>
                  <SelectItem value="quantity_asc">Smallest quantity</SelectItem>
                  <SelectItem value="recently_printed">Recently printed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABLE / CARDS */}
          {listQuery.isError ? (
            <div className="batches-empty-card error" role="alert">
              <div className="batches-empty-icon warning">
                <VaahanIcon name="alert" size={24} />
              </div>
              <div className="batches-empty-text">
                <h3>Batches couldn't be loaded</h3>
                <p>An unexpected service error occurred. Your current filters have been preserved.</p>
              </div>
              <button
                type="button"
                className="admin-button"
                onClick={() => void listQuery.refetch()}
              >
                Try again
              </button>
            </div>
          ) : accumulatedRows.length === 0 ? (
            <div className="batches-empty-card">
              {filters.q || filters.statuses.length > 0 || filters.channels.length > 0 || filters.print !== "any" || filters.from || filters.to ? (
                <>
                  <div className="batches-empty-icon">
                    <VaahanIcon name="search" size={24} />
                  </div>
                  <div className="batches-empty-text">
                    <h3>No batches match these filters</h3>
                    <p>
                      No manufacturing lots matched your search term or active filter criteria. Try adjusting or clearing your filters.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-button"
                    onClick={() =>
                      updateFilters({
                        q: "",
                        statuses: [],
                        channels: [],
                        print: "any",
                        sort: "newest",
                        from: "",
                        to: "",
                      })
                    }
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <div className="batches-empty-icon">
                    <VaahanIcon name="layers" size={24} />
                  </div>
                  <div className="batches-empty-text">
                    <h3>No manufacturing batches yet</h3>
                    <p>
                      Create an online lot for e-commerce kit fulfillment or import an offline retail lot to begin generating controlled VaahanSafe QR identities.
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      className="admin-button primary"
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      + Create first batch
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP GRID */}
              <BatchGrid
                rows={accumulatedRows}
                selectedId={selectedBatch?.id || null}
                onSelectRow={setSelectedBatch}
                onGenerate={setGenerateTarget}
                onValidate={handleValidateBatch}
                onVoid={setVoidTarget}
                canManage={canManage}
              />

              {/* MOBILE CARDS */}
              <BatchMobileCards
                rows={accumulatedRows}
                selectedId={selectedBatch?.id || null}
                onSelectRow={setSelectedBatch}
                onGenerate={setGenerateTarget}
                onValidate={handleValidateBatch}
                onVoid={setVoidTarget}
                canManage={canManage}
              />

              {/* PAGINATION / LOAD MORE */}
              <div className="batches-pagination-footer">
                <span className="batches-pagination-count">
                  Showing {accumulatedRows.length} of {formatQuantity(listQuery.data?.totalMatching || accumulatedRows.length)} matching batches
                </span>

                {nextCursor && (
                  <button
                    type="button"
                    className="admin-button batches-load-more-btn"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                  >
                    {isLoadingMore ? "Loading more lots…" : "Load more batches"}
                  </button>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* QUICK PREVIEW SHEET */}
      <BatchQuickPreview
        batch={selectedBatch}
        onClose={() => setSelectedBatch(null)}
        onGenerate={setGenerateTarget}
        onValidate={handleValidateBatch}
        onVoid={setVoidTarget}
        canManage={canManage}
      />

      {/* CREATE BATCH DIALOG */}
      <CreateBatchDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateBatch}
      />

      {/* IMPORT OFFLINE BATCH WIZARD */}
      <ImportOfflineBatchDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={handleRefresh}
      />

      {/* GENERATE IDENTITIES DIALOG */}
      <GenerateIdentitiesDialog
        batch={generateTarget}
        open={!!generateTarget}
        onOpenChange={(v) => !v && setGenerateTarget(null)}
        onSuccess={async () => {
          toast.success(
            `Identities generated successfully for ${generateTarget?.reference}`,
          );
          await handleRefresh();
        }}
      />

      {/* VOID BATCH ALERT DIALOG */}
      <VoidBatchDialog
        batch={voidTarget}
        open={!!voidTarget}
        onOpenChange={(v) => !v && setVoidTarget(null)}
        onSuccess={async () => {
          toast.success(`Batch ${voidTarget?.reference} voided`);
          await handleRefresh();
          if (selectedBatch?.id === voidTarget?.id) {
            setSelectedBatch((prev) => (prev ? { ...prev, status: "VOIDED" } : null));
          }
        }}
      />

      {/* MOBILE FILTER SHEET */}
      <MobileFilterSheet
        open={mobileFilterOpen}
        onOpenChange={setMobileFilterOpen}
        filters={filters}
        onChange={updateFilters}
        onReset={() =>
          updateFilters({
            q: "",
            statuses: [],
            channels: [],
            print: "any",
            sort: "newest",
            from: "",
            to: "",
          })
        }
        matchingCount={listQuery.data?.totalMatching}
      />
    </div>
  );
}
