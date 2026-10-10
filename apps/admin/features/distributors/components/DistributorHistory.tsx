"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAdminData } from "../../../lib/client-api";
import { uniqueDistributorRows } from "../distributor.filters";
import type { DistributorDetail } from "../distributor.types";
export function useDistributorHistory<
  K extends "transfers" | "retailers" | "reconciliations" | "activity",
>(id: string, section: K, tab: string, initial?: DistributorDetail) {
  type Row = DistributorDetail[K][number];
  const records = initial?.[section],
    last = records?.at(-1);
  const query = useInfiniteQuery({
    queryKey: ["distributors", "history", id, section],
    queryFn: ({ pageParam, signal }) =>
      getAdminData<{ rows: Row[]; nextCursor: string | null }>(
        `/api/distributors/${id}/history?section=${section}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`,
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    initialData: records
      ? {
          pages: [
            {
              rows: records as Row[],
              nextCursor:
                initial?.nextSections.includes(section) && last
                  ? btoa(
                      JSON.stringify({
                        id: last.id,
                        created_at: last.created_at,
                      }),
                    )
                  : null,
            },
          ],
          pageParams: [null],
        }
      : undefined,
    enabled:
      tab === (section === "reconciliations" ? "reconciliation" : section) ||
      (section === "activity" && tab === "audit"),
    staleTime: 20000,
  });
  return {
    ...query,
    rows: uniqueDistributorRows(
      query.data?.pages.map((p) => p.rows) || [],
    ) as Row[],
  };
}
export function DistributorHistoryMore({
  query,
}: {
  query: {
    hasNextPage: boolean;
    isFetching: boolean;
    isError: boolean;
    fetchNextPage: () => unknown;
    refetch: () => unknown;
  };
}) {
  return (
    <div className="dist-load-more">
      {query.isError ? (
        <>
          <p role="alert">Could not refresh this section.</p>
          <button onClick={() => void query.refetch()}>Retry</button>
        </>
      ) : (
        query.hasNextPage && (
          <button
            disabled={query.isFetching}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetching ? "Loading more…" : "Load more records"}
          </button>
        )
      )}
    </div>
  );
}
