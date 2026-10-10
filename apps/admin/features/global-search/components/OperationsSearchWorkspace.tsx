"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type {
  GlobalSearchResult,
  SearchResponseData,
  SearchScope,
  InvestigationBreadcrumb,
} from "../search.types";
import { classifySearchInput } from "../server/classify-query";
import { CommandSearchSurface } from "./CommandSearchSurface";
import { InvestigationTrail } from "./InvestigationTrail";
import { ExactMatchWorkspace } from "./ExactMatchWorkspace";
import { SearchResultsList } from "./SearchResultsList";
import { SearchPreviewSheet } from "./SearchPreviewSheet";
import {
  SearchInitialState,
  SearchNoResultsState,
  SearchErrorState,
  SearchLoadingSkeleton,
} from "./SearchEmptyStates";
import "../search-workspace.css";

interface OperationsSearchWorkspaceProps {
  phoneAllowed: boolean;
}

export function OperationsSearchWorkspace({
  phoneAllowed,
}: OperationsSearchWorkspaceProps) {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || "";
  const initialScope = (searchParams?.get("scope") as SearchScope) || "all";

  const [query, setQuery] = useState(initialQ);
  const [scope, setScope] = useState<SearchScope>(initialScope);
  const [phoneMode, setPhoneMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [responseData, setResponseData] = useState<SearchResponseData | null>(null);

  // Investigation Trail & Preview Sheet
  const [investigationTrail, setInvestigationTrail] = useState<InvestigationBreadcrumb[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<{
    type: SearchScope;
    id: string;
    reference: string;
    title?: string;
  } | null>(null);

  // Session Recent Searches (non-sensitive queries only)
  const [recentSearches, setRecentSearches] = useState<{ query: string; scope: SearchScope }[]>([]);

  const searchVersion = useRef(0);
  const classification = classifySearchInput(query);

  const executeSearch = useCallback(
    async (overrideQuery?: string, overrideScope?: SearchScope, overridePhone?: boolean) => {
      const q = overrideQuery !== undefined ? overrideQuery : query;
      const sc = overrideScope !== undefined ? overrideScope : scope;
      const ph = overridePhone !== undefined ? overridePhone : phoneMode;

      const trimmed = q.trim();
      if (trimmed.length < 3) return;

      const currentVer = ++searchVersion.current;
      setBusy(true);
      setError(null);

      // Safe URL sync (never put phone numbers into URL)
      if (!ph && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("q", trimmed);
        if (sc !== "all") url.searchParams.set("scope", sc);
        else url.searchParams.delete("scope");
        window.history.pushState(null, "", url.toString());
      }

      // Record in session recent searches if safe (strictly excluding phone numbers or digit lookups)
      const digitsOnly = trimmed.replace(/\D/g, "");
      const isLikelyPhoneOrDigits =
        /^\+?\d+$/.test(trimmed.replace(/[\s\-]/g, "")) || digitsOnly.length >= 6;

      if (!ph && !classifySearchInput(trimmed).isSensitivePhone && !isLikelyPhoneOrDigits) {
        setRecentSearches((prev) => {
          const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
          return [{ query: trimmed, scope: sc }, ...filtered].slice(0, 5);
        });
      }

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: trimmed, scope: sc, phone: ph }),
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Search failed.");
        }

        if (currentVer === searchVersion.current) {
          const data = json.data as SearchResponseData;
          setResponseData(data);

          // Reset investigation trail to primary match if exact match resolved
          if (data.exactMatch) {
            setInvestigationTrail([
              {
                entityType: data.exactMatch.primaryResult.entityType,
                id: data.exactMatch.primaryResult.id,
                reference: data.exactMatch.primaryResult.reference,
                title: data.exactMatch.primaryResult.title,
              },
            ]);
          } else {
            setInvestigationTrail([]);
          }
        }
      } catch (err) {
        if (currentVer === searchVersion.current) {
          setError(err instanceof Error ? err.message : "Search error.");
        }
      } finally {
        if (currentVer === searchVersion.current) {
          setBusy(false);
        }
      }
    },
    [query, scope, phoneMode]
  );

  // Auto-search if mounted with initial URL query (and not sensitive)
  useEffect(() => {
    if (initialQ.trim().length >= 3 && !classifySearchInput(initialQ).isSensitivePhone) {
      void executeSearch(initialQ, initialScope);
    }
  }, [initialQ, initialScope, executeSearch]);

  // Handler for inspecting a result row
  const handleInspectResult = (result: GlobalSearchResult) => {
    setSelectedPreview({
      type: result.entityType,
      id: result.id,
      reference: result.reference,
      title: result.title,
    });

    setInvestigationTrail((prev) => {
      if (prev.some((c) => c.id === result.id)) return prev;
      return [
        ...prev,
        {
          entityType: result.entityType,
          id: result.id,
          reference: result.reference,
          title: result.title,
        },
      ];
    });
  };

  // Handler for pivoting to a connected relation (from Reference Spine or Preview Sheet)
  const handlePivotRelation = (node: {
    type: SearchScope;
    id: string;
    reference: string;
    label: string;
  }) => {
    setSelectedPreview({
      type: node.type,
      id: node.id,
      reference: node.reference,
      title: node.label,
    });

    setInvestigationTrail((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === node.id);
      if (existingIdx !== -1) {
        return prev.slice(0, existingIdx + 1);
      }
      return [
        ...prev,
        {
          entityType: node.type,
          id: node.id,
          reference: node.reference,
          title: node.label,
        },
      ];
    });
  };

  // Back navigation in investigation trail
  const handleBackInTrail = () => {
    if (investigationTrail.length > 1) {
      const nextTrail = investigationTrail.slice(0, -1);
      setInvestigationTrail(nextTrail);
      const prevCrumb = nextTrail[nextTrail.length - 1];
      if (prevCrumb) {
        setSelectedPreview({
          type: prevCrumb.entityType,
          id: prevCrumb.id,
          reference: prevCrumb.reference,
          title: prevCrumb.title,
        });
      }
    }
  };

  const handleSelectCrumb = (index: number) => {
    const crumb = investigationTrail[index];
    if (crumb) {
      setInvestigationTrail(investigationTrail.slice(0, index + 1));
      setSelectedPreview({
        type: crumb.entityType,
        id: crumb.id,
        reference: crumb.reference,
        title: crumb.title,
      });
    }
  };

  const handleQuickSearch = (q: string, sc: SearchScope) => {
    setQuery(q);
    setScope(sc);
    void executeSearch(q, sc);
  };

  const handleClear = () => {
    setQuery("");
    setResponseData(null);
    setError(null);
    setInvestigationTrail([]);
    setSelectedPreview(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      url.searchParams.delete("scope");
      window.history.pushState(null, "", url.toString());
    }
  };

  return (
    <div className="search-command-workspace">
      {/* 1. Command Search Surface */}
      <CommandSearchSurface
        query={query}
        setQuery={setQuery}
        scope={scope}
        setScope={setScope}
        phoneAllowed={phoneAllowed}
        phoneMode={phoneMode}
        setPhoneMode={setPhoneMode}
        onSearch={executeSearch}
        busy={busy}
        classification={classification}
      />

      {/* 2. Investigation Breadcrumb Trail */}
      {investigationTrail.length > 1 && (
        <InvestigationTrail
          trail={investigationTrail}
          onSelectCrumb={handleSelectCrumb}
          onBack={handleBackInTrail}
          onClearTrail={() => {
            setInvestigationTrail(
              responseData?.exactMatch
                ? [
                    {
                      entityType: responseData.exactMatch.primaryResult.entityType,
                      id: responseData.exactMatch.primaryResult.id,
                      reference: responseData.exactMatch.primaryResult.reference,
                      title: responseData.exactMatch.primaryResult.title,
                    },
                  ]
                : []
            );
            setSelectedPreview(null);
          }}
        />
      )}

      {/* 3. Error Banner */}
      {error && <SearchErrorState error={error} onRetry={() => void executeSearch()} />}

      {/* 4. Loading Skeleton */}
      {busy && !responseData && <SearchLoadingSkeleton />}

      {/* 5. Initial State */}
      {!responseData && !busy && !error && (
        <SearchInitialState
          onQuickSearch={handleQuickSearch}
          recentSearches={recentSearches}
          onClearRecent={() => setRecentSearches([])}
        />
      )}

      {/* 6. Results View */}
      {responseData && (
        <>
          {responseData.totalCount === 0 ? (
            <SearchNoResultsState query={query} onClear={handleClear} />
          ) : (
            <>
              {/* Exact Match Workspace if resolved */}
              {responseData.exactMatch && (
                <ExactMatchWorkspace
                  exactMatch={responseData.exactMatch}
                  onInspectNode={handlePivotRelation}
                />
              )}

              {/* Grouped Results List */}
              <SearchResultsList
                results={responseData.results}
                groupedResults={responseData.groupedResults}
                latencyMs={responseData.latencyMs}
                totalCount={responseData.totalCount}
                onInspect={handleInspectResult}
              />
            </>
          )}
        </>
      )}

      {/* 7. Slide-in Preview Sheet */}
      <SearchPreviewSheet
        selectedEntity={selectedPreview}
        onClose={() => setSelectedPreview(null)}
        onPivotRelation={handlePivotRelation}
      />
    </div>
  );
}
