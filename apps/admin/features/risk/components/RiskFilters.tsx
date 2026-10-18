"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@vaahansafe/ui/components/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@vaahansafe/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import { VaahanIcon } from "@vaahansafe/icons";
import { AdminSelect } from "../../../components/AdminSelect";
import {
  EMPTY_RISK_FILTERS,
  RISK_SEVERITIES,
  RISK_STATUSES,
  RISK_CATEGORIES,
  riskLabel,
  type RiskFilters,
} from "../risk.types";
const asDate = (v: string) => (v ? new Date(`${v}T12:00:00`) : undefined);
export function RiskDateRange({
  f,
  change,
}: {
  f: RiskFilters;
  change: (f: RiskFilters) => void;
}) {
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false),
    [range, setRange] = useState<DateRange | undefined>();
  const begin = () => {
    setRange({ from: asDate(f.from), to: asDate(f.to) });
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    setOpen(true);
  };
  const preset = (days: number | null) => {
    const today = asDate(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    )!;
    const first = new Date(today);
    first.setDate(days === null ? 1 : today.getDate() - days + 1);
    setRange({ from: first, to: today });
  };
  const content = (
    <div className="risk-calendar">
      <p className="risk-muted">Observation dates · India Standard Time</p>
      <div className="risk-actions">
        <button
          className="risk-button"
          onClick={() => {
            change({ ...f, period: "24h", from: "", to: "" });
            setOpen(false);
          }}
        >
          24 hours
        </button>
        {[
          [1, "Today"],
          [7, "7 days"],
          [30, "30 days"],
          [null, "This month"],
        ].map(([days, label]) => (
          <button
            className="risk-button"
            key={String(label)}
            onClick={() => preset(days as number | null)}
          >
            {label}
          </button>
        ))}
      </div>
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={mobile ? 1 : 2}
      />
      <div className="risk-actions">
        <button
          className="risk-button"
          onClick={() => {
            change({ ...f, from: "", to: "", period: "" });
            setOpen(false);
          }}
        >
          Clear dates
        </button>
        <button
          className="risk-button primary"
          disabled={!range?.from}
          onClick={() => {
            change({
              ...f,
              period: "",
              from: format(range!.from!, "yyyy-MM-dd"),
              to: format(range!.to || range!.from!, "yyyy-MM-dd"),
            });
            setOpen(false);
          }}
        >
          Apply range
        </button>
      </div>
    </div>
  );
  return (
    <>
      <Popover
        open={open && !mobile}
        onOpenChange={(v) => {
          if (v) begin();
          else setOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button className="risk-button" onClick={begin}>
            <VaahanIcon name="calendar" size={15} />
            {f.period === "24h"
              ? "Last 24 hours"
              : f.from
                ? `${f.from}${f.to && f.to !== f.from ? " – " + f.to : ""}`
                : "Date"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="risk-calendar-popover" align="start">
          {content}
        </PopoverContent>
      </Popover>
      <Sheet open={open && mobile} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="risk-date-sheet">
          <SheetTitle>Observation dates</SheetTitle>
          <SheetDescription>
            Choose a range in India Standard Time.
          </SheetDescription>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
export function RiskFilterFields({
  f,
  change,
  advanced = false,
}: {
  f: RiskFilters;
  change: (f: RiskFilters) => void;
  advanced?: boolean;
}) {
  const select = (k: keyof RiskFilters, label: string, values: string[]) => (
    <AdminSelect
      value={f[k]}
      label={label}
      options={values.map((v) => ({
        value: v,
        label: v ? riskLabel(v) : `All ${label.toLowerCase()}`,
      }))}
      onValueChange={(v) => change({ ...f, [k]: v })}
    />
  );
  return (
    <>
      <div className="risk-filter-field">
        <label>Severity</label>
        {select("severity", "Severity", ["", ...RISK_SEVERITIES])}
      </div>
      <div className="risk-filter-field">
        <label>Source</label>
        {select("category", "Sources", ["", ...RISK_CATEGORIES])}
      </div>
      <div className="risk-filter-field">
        <label>Review state</label>
        {select("status", "Review states", ["", ...RISK_STATUSES])}
      </div>
      {advanced && (
        <>
          <div className="risk-filter-field">
            <label>QR lifecycle</label>
            {select("lifecycle", "Lifecycles", [
              "",
              "PRINTED",
              "DISTRIBUTED",
              "ACTIVATED",
              "REPLACED",
              "BLOCKED",
              "RETIRED",
              "LOST",
              "DAMAGED",
            ])}
          </div>
          <div className="risk-filter-field">
            <label>Assignment</label>
            {select("assignment", "Assignments", ["", "mine", "unassigned"])}
          </div>
          <div className="risk-filter-field">
            <label>Investigation case</label>
            <AdminSelect
              value={f.hasCase}
              label="Investigation case"
              options={[
                { value: "", label: "With or without case" },
                { value: "yes", label: "Has a case" },
                { value: "no", label: "No case" },
              ]}
              onValueChange={(v) => change({ ...f, hasCase: v })}
            />
          </div>
        </>
      )}
      <RiskDateRange f={f} change={change} />
    </>
  );
}
export function RiskFilterSheet({
  open,
  onClose,
  f,
  change,
}: {
  open: boolean;
  onClose: () => void;
  f: RiskFilters;
  change: (f: RiskFilters) => void;
}) {
  const [draft, setDraft] = useState(f);
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="risk-sheet">
        <SheetTitle>Filter risk signals</SheetTitle>
        <SheetDescription>
          Focus the investigation queue. Filters are applied on the server.
        </SheetDescription>
        <div className="risk-filter-form">
          <RiskFilterFields f={draft} change={setDraft} advanced />
        </div>
        <div className="risk-sheet-footer">
          <button
            className="risk-button"
            onClick={() => setDraft({ ...EMPTY_RISK_FILTERS })}
          >
            Reset
          </button>
          <button
            className="risk-button primary"
            onClick={() => {
              change(draft);
              onClose();
            }}
          >
            Apply filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
