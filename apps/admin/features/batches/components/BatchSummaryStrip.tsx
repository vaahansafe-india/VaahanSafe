"use client";

import React from "react";
import type { BatchSummary, BatchFilters } from "../batches.types";
import { formatQuantity } from "../batches.presentation";

interface BatchSummaryStripProps {
  summary: BatchSummary | null;
  filters: BatchFilters;
  onChange: (f: BatchFilters) => void;
  isLoading?: boolean;
}

export function BatchSummaryStrip({
  summary,
  filters,
  onChange,
  isLoading,
}: BatchSummaryStripProps) {
  const s = summary || {
    totalBatches: 0,
    totalIdentities: 0,
    draft: 0,
    generating: 0,
    printReady: 0,
    printed: 0,
    attention: 0,
  };

  const isSelected = (key: string) => {
    if (key === "total") return filters.statuses.length === 0;
    if (key === "draft") return filters.statuses.includes("DRAFT");
    if (key === "print_ready") return filters.statuses.includes("PRINT_READY");
    if (key === "printed") return filters.statuses.includes("PRINTED");
    if (key === "attention")
      return (
        filters.statuses.includes("FAILED") ||
        filters.statuses.includes("QUARANTINED") ||
        filters.statuses.includes("VOIDED")
      );
    return false;
  };

  const handleCardClick = (key: string) => {
    if (key === "total") {
      onChange({ ...filters, statuses: [] });
    } else if (key === "draft") {
      onChange({
        ...filters,
        statuses: filters.statuses.includes("DRAFT") ? [] : ["DRAFT"],
      });
    } else if (key === "print_ready") {
      onChange({
        ...filters,
        statuses: filters.statuses.includes("PRINT_READY")
          ? []
          : ["PRINT_READY"],
      });
    } else if (key === "printed") {
      onChange({
        ...filters,
        statuses: filters.statuses.includes("PRINTED") ? [] : ["PRINTED"],
      });
    } else if (key === "attention") {
      onChange({
        ...filters,
        statuses: isSelected("attention")
          ? []
          : ["FAILED", "QUARANTINED", "VOIDED"],
      });
    }
  };

  return (
    <div className="batches-summary" aria-label="Batch manufacturing overview">
      <button
        type="button"
        className={`batches-summary-card ${isSelected("total") ? "is-selected" : ""}`}
        onClick={() => handleCardClick("total")}
      >
        <span>TOTAL BATCHES</span>
        <strong>{isLoading ? "—" : formatQuantity(s.totalBatches)}</strong>
        <small className="batches-summary-sub">Across all channels</small>
      </button>

      <div className="batches-summary-card is-metric-only">
        <span>QR IDENTITIES</span>
        <strong>{isLoading ? "—" : formatQuantity(s.totalIdentities)}</strong>
        <small className="batches-summary-sub">Planned lot volume</small>
      </div>

      <button
        type="button"
        className={`batches-summary-card ${isSelected("draft") ? "is-selected" : ""}`}
        onClick={() => handleCardClick("draft")}
      >
        <span>DRAFT</span>
        <strong>{isLoading ? "—" : formatQuantity(s.draft)}</strong>
        <small className="batches-summary-sub">Pending generation</small>
      </button>

      <button
        type="button"
        className={`batches-summary-card ${isSelected("print_ready") ? "is-selected" : ""}`}
        onClick={() => handleCardClick("print_ready")}
      >
        <span>PRINT READY</span>
        <strong>{isLoading ? "—" : formatQuantity(s.printReady)}</strong>
        <small className="batches-summary-sub">Approved for spooling</small>
      </button>

      <button
        type="button"
        className={`batches-summary-card ${isSelected("printed") ? "is-selected" : ""}`}
        onClick={() => handleCardClick("printed")}
      >
        <span>PRINTED</span>
        <strong>{isLoading ? "—" : formatQuantity(s.printed)}</strong>
        <small className="batches-summary-sub">Physical run confirmed</small>
      </button>

      <button
        type="button"
        className={`batches-summary-card is-attention ${isSelected("attention") ? "is-selected" : ""}`}
        onClick={() => handleCardClick("attention")}
      >
        <span>ATTENTION</span>
        <strong>{isLoading ? "—" : formatQuantity(s.attention)}</strong>
        <small className="batches-summary-sub">Failed or quarantined</small>
      </button>
    </div>
  );
}
