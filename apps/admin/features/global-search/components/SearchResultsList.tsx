"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import type { GlobalSearchResult, SearchScope } from "../search.types";
import { SearchResultRow } from "./SearchResultRow";

interface SearchResultsListProps {
  results: GlobalSearchResult[];
  groupedResults: Partial<Record<SearchScope, GlobalSearchResult[]>>;
  latencyMs: number;
  totalCount: number;
  onInspect: (result: GlobalSearchResult) => void;
}

const ENTITY_GROUP_CONFIG: Record<
  string,
  { label: string; icon: VaahanIconName; href: string }
> = {
  qr: { label: "QR Identities", icon: "qr", href: "/inventory" },
  vehicle: { label: "Vehicles", icon: "vehicle", href: "/vehicles" },
  order: { label: "Orders", icon: "file", href: "/orders" },
  batch: { label: "Batches", icon: "layers", href: "/batches" },
  transfer: { label: "Transfers", icon: "route", href: "/transfers" },
  partner: { label: "Partners", icon: "globe", href: "/distributors" },
  customer: { label: "Customers", icon: "users", href: "/customers" },
  support: { label: "Support Cases", icon: "help", href: "/support" },
  shipment: { label: "Shipments", icon: "route", href: "/shipping" },
};

export function SearchResultsList({
  results,
  groupedResults,
  latencyMs,
  totalCount,
  onInspect,
}: SearchResultsListProps) {
  const [activeFacet, setActiveFacet] = useState<string>("all");

  const matchingCategories = Object.keys(groupedResults).filter(
    (key) => (groupedResults[key as SearchScope]?.length || 0) > 0
  );

  const displayedGroups =
    activeFacet === "all"
      ? matchingCategories
      : matchingCategories.filter((k) => k === activeFacet);

  return (
    <div className="search-results-container" aria-label="Search Results">
      {/* Meta Bar & Facets */}
      <div className="search-meta-bar">
        <div>
          <strong>{totalCount} {totalCount === 1 ? "match" : "matches"}</strong>
          <span> · {latencyMs}ms</span>
        </div>

        {matchingCategories.length > 1 && (
          <div className="search-facets-row">
            <button
              type="button"
              className={`search-facet-pill ${activeFacet === "all" ? "active" : ""}`}
              onClick={() => setActiveFacet("all")}
            >
              All ({totalCount})
            </button>
            {matchingCategories.map((cat) => {
              const count = groupedResults[cat as SearchScope]?.length || 0;
              const config = ENTITY_GROUP_CONFIG[cat] || { label: cat };
              return (
                <button
                  key={cat}
                  type="button"
                  className={`search-facet-pill ${activeFacet === cat ? "active" : ""}`}
                  onClick={() => setActiveFacet(cat)}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Entity Groups */}
      {displayedGroups.map((cat) => {
        const rows = groupedResults[cat as SearchScope] || [];
        const config = ENTITY_GROUP_CONFIG[cat] || {
          label: cat.toUpperCase(),
          icon: "file",
          href: `/${cat}`,
        };

        return (
          <section key={cat} className="result-group-card">
            <div className="result-group-header">
              <h3>
                <VaahanIcon name={config.icon} size={14} />
                <span>{config.label}</span>
                <span className="admin-tag" style={{ marginLeft: 6, fontSize: 10 }}>
                  {rows.length}
                </span>
              </h3>

              <Link href={config.href} className="admin-link text-xs">
                Open {config.label.toLowerCase()} workspace →
              </Link>
            </div>

            <div className="result-group-rows">
              {rows.map((result) => (
                <SearchResultRow
                  key={`${result.entityType}-${result.id}`}
                  result={result}
                  onInspect={onInspect}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
