"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Skeleton } from "@vaahansafe/ui/components/skeleton";
import type { SearchScope } from "../search.types";

interface SearchInitialStateProps {
  onQuickSearch: (query: string, scope: SearchScope) => void;
  recentSearches: { query: string; scope: SearchScope }[];
  onClearRecent: () => void;
}

export function SearchInitialState({
  onQuickSearch,
  recentSearches,
  onClearRecent,
}: SearchInitialStateProps) {
  return (
    <div className="search-initial-grid" aria-label="Operations Search Guidance">
      <div className="search-initial-card">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8c9684", textTransform: "uppercase" }}>
            Operational Command Center
          </span>
          <h2 style={{ fontSize: 18, margin: "4px 0 6px 0", color: "#1b1c1a" }}>
            Query across the VaahanSafe identity graph
          </h2>
          <p style={{ fontSize: 13, color: "#616e5a", margin: 0, lineHeight: 1.5 }}>
            Resolve physical QR stickers, manufacturing batches, vehicle registrations, customer accounts, orders, custody transfers and support cases in one unified workspace.
          </p>
        </div>

        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#616e5a", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Quick Scope Starters
          </span>
          <div className="quick-search-chips">
            <button
              type="button"
              className="quick-search-chip"
              onClick={() => onQuickSearch("VS-", "qr")}
            >
              <VaahanIcon name="qr" size={13} />
              <span>QR Identity</span>
            </button>
            <button
              type="button"
              className="quick-search-chip"
              onClick={() => onQuickSearch("AP", "vehicle")}
            >
              <VaahanIcon name="vehicle" size={13} />
              <span>Vehicle Registration</span>
            </button>
            <button
              type="button"
              className="quick-search-chip"
              onClick={() => onQuickSearch("VS-ORD-", "order")}
            >
              <VaahanIcon name="file" size={13} />
              <span>Order Reference</span>
            </button>
            <button
              type="button"
              className="quick-search-chip"
              onClick={() => onQuickSearch("VS-BAT-", "batch")}
            >
              <VaahanIcon name="layers" size={13} />
              <span>Batch Lot</span>
            </button>
            <button
              type="button"
              className="quick-search-chip"
              onClick={() => onQuickSearch("VS-TRF-", "transfer")}
            >
              <VaahanIcon name="route" size={13} />
              <span>Custody Transfer</span>
            </button>
          </div>
        </div>

        {recentSearches.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#616e5a", textTransform: "uppercase" }}>
                Session Recent Searches
              </span>
              <button
                type="button"
                className="admin-link text-xs"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onClick={onClearRecent}
              >
                Clear recent
              </button>
            </div>
            <div className="quick-search-chips">
              {recentSearches.map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  className="quick-search-chip"
                  onClick={() => onQuickSearch(rec.query, rec.scope)}
                >
                  <VaahanIcon name="search" size={12} />
                  <code>{rec.query}</code>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "10px 12px", background: "#f5f0e8", border: "1px solid #e5e0d4", borderRadius: 3, fontSize: 11.5, color: "#616e5a" }}>
          <strong style={{ color: "#1b1c1a" }}>Security Invariant:</strong> Phone searches are restricted, never stored in browser history or URLs, and recorded in the audit trail.
        </div>
      </div>

      <div className="search-initial-card">
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8c9684", textTransform: "uppercase" }}>
            Ergonomics
          </span>
          <h3 style={{ fontSize: 14, margin: "4px 0 12px 0", color: "#1b1c1a" }}>
            Keyboard-First Navigation
          </h3>
          <div className="keyboard-cheatsheet">
            <div className="keyboard-cheat-row">
              <span>Focus search input</span>
              <kbd className="command-kbd-hint">/</kbd>
            </div>
            <div className="keyboard-cheat-row">
              <span>Global quick switcher</span>
              <kbd className="command-kbd-hint">⌘K / Ctrl+K</kbd>
            </div>
            <div className="keyboard-cheat-row">
              <span>Execute search</span>
              <kbd className="command-kbd-hint">Enter</kbd>
            </div>
            <div className="keyboard-cheat-row">
              <span>Close preview / drawer</span>
              <kbd className="command-kbd-hint">Esc</kbd>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #ece8df", fontSize: 11.5, color: "#8c9684" }}>
          Results are strictly filtered by your authorized role permissions.
        </div>
      </div>
    </div>
  );
}

export function SearchNoResultsState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="admin-panel admin-empty" role="status">
      <VaahanIcon name="search" size={32} style={{ color: "#8c9684" }} />
      <h3 style={{ margin: "8px 0 4px 0", fontSize: 17, color: "#1b1c1a" }}>
        No accessible match found
      </h3>
      <p style={{ maxWidth: 440, margin: "0 auto 16px auto", color: "#616e5a", fontSize: 13, lineHeight: 1.5 }}>
        We couldn&apos;t find an accessible operational record matching{" "}
        <strong>&ldquo;{query}&rdquo;</strong> within your role permissions.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button type="button" className="admin-button secondary" onClick={onClear}>
          Clear search
        </button>
      </div>
    </div>
  );
}

export function SearchErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="admin-panel admin-empty" role="alert">
      <VaahanIcon name="alert" size={32} style={{ color: "#a04020" }} />
      <h3 style={{ margin: "8px 0 4px 0", fontSize: 17, color: "#1b1c1a" }}>
        Search temporarily unavailable
      </h3>
      <p style={{ maxWidth: 440, margin: "0 auto 16px auto", color: "#616e5a", fontSize: 13 }}>
        {error || "We couldn't complete this search. Your query was preserved."}
      </p>
      <button type="button" className="admin-button primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function SearchLoadingSkeleton() {
  return (
    <div className="search-results-container" aria-label="Loading search results">
      <div className="result-group-card">
        <div className="result-group-header">
          <Skeleton className="h-4 w-32" />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="result-group-card">
        <div className="result-group-header">
          <Skeleton className="h-4 w-28" />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  );
}
