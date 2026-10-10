"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import type { BatchFilters } from "../batches.types";
import { AdminDatePicker } from "../../../components/AdminDatePicker";

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: BatchFilters;
  onChange: (f: BatchFilters) => void;
  onReset: () => void;
  matchingCount?: number;
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

export function MobileFilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  onReset,
  matchingCount,
}: MobileFilterSheetProps) {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="batches-mobile-filter-sheet">
        <SheetHeader className="batches-sheet-header">
          <SheetTitle className="batches-sheet-title">Filter batches</SheetTitle>
          <SheetDescription className="batches-sheet-subtitle">
            Refine manufacturing lots by status, channel, and dates.
          </SheetDescription>
        </SheetHeader>

        <div className="batches-mobile-filter-body">
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

          {/* Print section */}
          <fieldset className="batches-filter-group">
            <legend className="batches-filter-legend">Print status</legend>
            <div className="batches-filter-options">
              <label className="batches-filter-radio">
                <input
                  type="radio"
                  name="batch_print_mobile"
                  checked={filters.print === "any"}
                  onChange={() => setPrint("any")}
                />
                <span>Any print state</span>
              </label>
              <label className="batches-filter-radio">
                <input
                  type="radio"
                  name="batch_print_mobile"
                  checked={filters.print === "printed"}
                  onChange={() => setPrint("printed")}
                />
                <span>Printed</span>
              </label>
              <label className="batches-filter-radio">
                <input
                  type="radio"
                  name="batch_print_mobile"
                  checked={filters.print === "not_printed"}
                  onChange={() => setPrint("not_printed")}
                />
                <span>Not printed</span>
              </label>
            </div>
          </fieldset>

          {/* Created date range */}
          <fieldset className="batches-filter-group">
            <legend className="batches-filter-legend">Created date</legend>
            <div className="batches-date-inputs">
              <AdminDatePicker
                id="batch-mobile-from"
                label="From"
                value={filters.from}
                onChange={(from) => onChange({ ...filters, from })}
              />
              <AdminDatePicker
                id="batch-mobile-to"
                label="To"
                value={filters.to}
                onChange={(to) => onChange({ ...filters, to })}
              />
            </div>
          </fieldset>
        </div>

        <footer className="batches-mobile-filter-footer">
          <div className="batches-mobile-filter-count">
            {typeof matchingCount === "number"
              ? `${matchingCount.toLocaleString("en-IN")} matching lots`
              : "Refine lots"}
          </div>
          <div className="batches-mobile-filter-actions">
            <button
              type="button"
              className="admin-button"
              onClick={onReset}
            >
              Reset
            </button>
            <button
              type="button"
              className="admin-button primary"
              onClick={() => onOpenChange(false)}
            >
              Show results
            </button>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
