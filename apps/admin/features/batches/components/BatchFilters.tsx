"use client";

import React from "react";
import type { BatchFilters } from "../batches.types";
import { AdminDatePicker } from "../../../components/AdminDatePicker";

interface BatchFiltersProps {
  filters: BatchFilters;
  onChange: (f: BatchFilters) => void;
  onReset: () => void;
}

const ALL_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "GENERATING", label: "Generating" },
  { value: "GENERATED", label: "Generated" },
  { value: "VALIDATED", label: "Validated" },
  { value: "PRINT_READY", label: "Print ready" },
  { value: "PRINTED", label: "Printed" },
  { value: "RECEIVED", label: "Received" },
  { value: "CLOSED", label: "Closed" },
  { value: "FAILED", label: "Failed" },
  { value: "QUARANTINED", label: "Quarantined" },
  { value: "VOIDED", label: "Voided" },
];

const CHANNELS = [
  { value: "ONLINE_SYSTEM", label: "Online system" },
  { value: "OFFLINE_RETAIL", label: "Offline retail" },
];

export function BatchFilterRail({
  filters,
  onChange,
  onReset,
}: BatchFiltersProps) {
  const toggleStatus = (status: string) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  };

  const toggleChannel = (channel: string) => {
    const next = filters.channels.includes(channel)
      ? filters.channels.filter((c) => c !== channel)
      : [...filters.channels, channel];
    onChange({ ...filters, channels: next });
  };

  const setPrint = (print: BatchFilters["print"]) => {
    onChange({ ...filters, print });
  };

  const hasActiveFilters =
    filters.statuses.length > 0 ||
    filters.channels.length > 0 ||
    filters.print !== "any" ||
    !!filters.from ||
    !!filters.to;

  return (
    <aside className="batches-filter-rail" aria-label="Batch filters">
      <div className="batches-filter-header">
        <strong>Filter batches</strong>
        {hasActiveFilters && (
          <button
            type="button"
            className="batches-filter-reset"
            onClick={onReset}
          >
            Reset
          </button>
        )}
      </div>

      {/* Status section */}
      <fieldset className="batches-filter-group">
        <legend className="batches-filter-legend">Status</legend>
        <div className="batches-filter-options">
          {ALL_STATUSES.map((st) => (
            <label key={st.value} className="batches-filter-checkbox">
              <input
                type="checkbox"
                checked={filters.statuses.includes(st.value)}
                onChange={() => toggleStatus(st.value)}
              />
              <span>{st.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Channel section */}
      <fieldset className="batches-filter-group">
        <legend className="batches-filter-legend">Channel</legend>
        <div className="batches-filter-options">
          {CHANNELS.map((ch) => (
            <label key={ch.value} className="batches-filter-checkbox">
              <input
                type="checkbox"
                checked={filters.channels.includes(ch.value)}
                onChange={() => toggleChannel(ch.value)}
              />
              <span>{ch.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Print state */}
      <fieldset className="batches-filter-group">
        <legend className="batches-filter-legend">Print</legend>
        <div className="batches-filter-options">
          <label className="batches-filter-radio">
            <input
              type="radio"
              name="batch_print_rail"
              checked={filters.print === "any"}
              onChange={() => setPrint("any")}
            />
            <span>Any print state</span>
          </label>
          <label className="batches-filter-radio">
            <input
              type="radio"
              name="batch_print_rail"
              checked={filters.print === "printed"}
              onChange={() => setPrint("printed")}
            />
            <span>Printed</span>
          </label>
          <label className="batches-filter-radio">
            <input
              type="radio"
              name="batch_print_rail"
              checked={filters.print === "not_printed"}
              onChange={() => setPrint("not_printed")}
            />
            <span>Not printed</span>
          </label>
          <label className="batches-filter-radio">
            <input
              type="radio"
              name="batch_print_rail"
              checked={filters.print === "print_ready"}
              onChange={() => setPrint("print_ready")}
            />
            <span>Print ready</span>
          </label>
        </div>
      </fieldset>

      {/* Created date range */}
      <fieldset className="batches-filter-group">
        <legend className="batches-filter-legend">Created date</legend>
        <div className="batches-date-inputs">
          <AdminDatePicker
            id="batch-from-date"
            label="From"
            value={filters.from}
            onChange={(from) => onChange({ ...filters, from })}
          />
          <AdminDatePicker
            id="batch-to-date"
            label="To"
            value={filters.to}
            onChange={(to) => onChange({ ...filters, to })}
          />
        </div>
      </fieldset>
    </aside>
  );
}
