"use client";
import { useEffect, useId, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vaahansafe/ui/components/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@vaahansafe/ui/components/command";
import { Calendar } from "@vaahansafe/ui/components/calendar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";
import { getAdminData } from "../../../lib/client-api";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  CustodianOption,
  ReconciliationRow,
} from "../reconciliation.types";
import {
  reconciliationLabel,
  varianceDescription,
} from "../reconciliation.types";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
export const reconciliationKeys = {
  all: ["reconciliation"] as const,
  scope: (i: AdminIdentity) =>
    ["reconciliation", i.id, i.role, i.sessionId] as const,
  list: (i: AdminIdentity, f: string) => [
    ...reconciliationKeys.scope(i),
    "list",
    f,
  ],
  detail: (i: AdminIdentity, id: string) => [
    ...reconciliationKeys.scope(i),
    "detail",
    id,
  ],
  history: (i: AdminIdentity, id: string, section: string, q = "") => [
    ...reconciliationKeys.scope(i),
    "history",
    id,
    section,
    q,
  ],
};
export const canManageReconciliation = (i: AdminIdentity) =>
  ["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role);
export function useReconciliationRefresh(i: AdminIdentity) {
  const c = useQueryClient();
  return async (inventory = false) => {
    await c.invalidateQueries({ queryKey: reconciliationKeys.scope(i) });
    if (inventory)
      await Promise.all(
        ["inventory", "batches", "distributors", "retailers", "transfers"].map(
          (k) => c.invalidateQueries({ queryKey: [k] }),
        ),
      );
  };
}
export const reconciliationDate = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(v))
    : "Not recorded";
export const custodianLocation = (
  r: Pick<ReconciliationRow, "city" | "district_name" | "state_name">,
) =>
  Array.from(
    new Set([r.city, r.district_name, r.state_name].filter(Boolean)),
  ).join(", ") || "Location not recorded";
export function ReconciliationError({
  message,
  retry,
}: {
  message: string;
  retry: () => unknown;
}) {
  return (
    <div className="rc-error" role="alert">
      <p>{message}</p>
      <button className="rc-button" onClick={() => void retry()}>
        Try again
      </button>
    </div>
  );
}
export function ReconciliationSkeleton({ view = "grid" }: { view?: string }) {
  return (
    <div
      className={`rc-skeleton ${view === "grid" ? "rc-grid" : ""}`}
      role="status"
      aria-label="Loading reconciliations"
    >
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <span />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function ReconciliationBadge({ row }: { row: ReconciliationRow }) {
  return (
    <span
      className={`rc-badge ${row.outcome === "MATCHED" ? "matched" : row.attention ? "attention" : ""}`}
    >
      <VaahanIcon
        name={
          row.outcome === "MATCHED"
            ? "check"
            : row.attention
              ? "alert"
              : "clock"
        }
        size={12}
      />
      {reconciliationLabel(
        row.phase === "TRANSFER_CONTROL" ? row.status : row.phase,
      )}
    </span>
  );
}
export function StockBalance({
  row,
  large = false,
}: {
  row: ReconciliationRow;
  large?: boolean;
}) {
  const pending = row.phase === "COUNTING",
    max = Math.max(
      row.expected_quantity,
      pending ? 0 : row.counted_quantity,
      1,
    );
  return (
    <div className={`rc-balance ${large ? "large" : ""}`}>
      <div>
        <span>Authoritative ledger</span>
        <strong>{row.expected_quantity.toLocaleString("en-IN")}</strong>
        <i
          aria-hidden="true"
          style={{ width: `${(100 * row.expected_quantity) / max}%` }}
        />
      </div>
      <div>
        <span>Physical count</span>
        <strong>
          {pending ? "Pending" : row.counted_quantity.toLocaleString("en-IN")}
        </strong>
        <i
          aria-hidden="true"
          style={{
            width: `${(100 * (pending ? 0 : row.counted_quantity)) / max}%`,
          }}
        />
      </div>
      <p className={row.variance && !pending ? "rc-variance" : ""}>
        <VaahanIcon
          name={row.variance && !pending ? "alert" : "check"}
          size={15}
        />
        <b>
          {pending ? "—" : row.variance > 0 ? `+${row.variance}` : row.variance}
        </b>
        <span>{varianceDescription(row)}</span>
      </p>
    </div>
  );
}
export function CustodianPicker({
  identity,
  value,
  label = "Custodian",
  onChange,
  allowAll = false,
}: {
  identity: AdminIdentity;
  value: string;
  label?: string;
  onChange: (id: string, item: CustodianOption | null) => void;
  allowAll?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [q, setQ] = useState(""),
    [chosen, setChosen] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const query = useQuery({
    queryKey: [...reconciliationKeys.scope(identity), "partners", q],
    queryFn: ({ signal }) =>
      getAdminData<CustodianOption[]>(
        `/api/reconciliation/partners?q=${encodeURIComponent(q)}`,
        signal,
      ),
    enabled: open,
    staleTime: 30000,
  });
  const selected = query.data?.find((r) => r.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          className="rc-button rc-picker"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-label={label}
        >
          <span>
            {value === "central"
              ? "VaahanSafe central inventory"
              : selected?.name ||
                (value
                  ? chosen || "Selected custodian"
                  : allowAll
                    ? "All custodians"
                    : "Choose custodian")}
          </span>
          <VaahanIcon name="chevron-down" size={13} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="rc-combo">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search name or reference…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList id={listId}>
            {allowAll && (
              <CommandItem
                onSelect={() => {
                  onChange("", null);
                  setOpen(false);
                }}
              >
                All custodians
              </CommandItem>
            )}
            {(!q ||
              "vaahansafe central inventory".includes(q.toLowerCase())) && (
              <CommandItem
                onSelect={() => {
                  onChange("central", null);
                  setOpen(false);
                }}
              >
                VaahanSafe central inventory · Warehouse
              </CommandItem>
            )}
            {query.isPending ? (
              <p role="status">Loading custodians…</p>
            ) : query.isError ? (
              <ReconciliationError
                message="Custodians unavailable."
                retry={query.refetch}
              />
            ) : (
              query.data?.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.id}
                  onSelect={() => {
                    setChosen(r.name);
                    onChange(r.id, r);
                    setOpen(false);
                  }}
                >
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {reconciliationLabel(r.kind)} · {r.city}
                      {r.state_name ? `, ${r.state_name}` : ""} ·{" "}
                      {r.reference_code}
                      {r.status !== "ACTIVE" ? " · Suspended" : ""}
                    </small>
                  </div>
                </CommandItem>
              ))
            )}
            {!query.isPending && !query.data?.length && (
              <p>No matching partners.</p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
const asDate = (v: string) => (v ? new Date(`${v}T12:00:00`) : undefined);
export function ReconciliationDateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false),
    [range, setRange] = useState<DateRange | undefined>();
  const id = useId();
  const begin = () => {
    setRange({ from: asDate(from), to: asDate(to) });
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    setOpen(true);
  };
  const isNarrow = typeof window !== "undefined" && window.innerWidth < 860;
  const preset = (days: number | null) => {
    const now = new Date(),
      today = asDate(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(now),
      )!;
    const first = new Date(today);
    if (days === null) first.setDate(1);
    else first.setDate(today.getDate() - days + 1);
    setRange({ from: first, to: today });
  };
  const content = (
    <div className="rc-calendar">
      <div className="rc-presets">
        {[
          [1, "Today"],
          [7, "7 days"],
          [30, "30 days"],
          [null, "This month"],
        ].map(([days, label]) => (
          <button
            type="button"
            className="rc-button rc-preset-btn"
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
        numberOfMonths={mobile || isNarrow ? 1 : 2}
      />
      <div className="rc-calendar-range-label" id={id}>
        <VaahanIcon name="calendar" size={13} />
        <span>
          {range?.from ? format(range.from, "dd MMM yyyy") : "Start date"} →{" "}
          {range?.to ? format(range.to, "dd MMM yyyy") : "End date"}
        </span>
      </div>
      <div className="rc-actions rc-calendar-actions">
        <button
          className="rc-button"
          onClick={() => {
            onChange("", "");
            setOpen(false);
          }}
        >
          Clear
        </button>
        <button
          className="rc-button rc-primary"
          disabled={!range?.from}
          onClick={() => {
            onChange(
              format(range!.from!, "yyyy-MM-dd"),
              format(range!.to || range!.from!, "yyyy-MM-dd"),
            );
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
          if (!v) setOpen(false);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rc-button rc-picker"
            aria-label="Filter date range"
            onClick={begin}
          >
            <VaahanIcon name="calendar" size={15} />
            <span>
              {from || to
                ? `${from || "Any"} – ${to || "Any"}`
                : "Any date range"}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="rc-calendar-popover">
          {content}
        </PopoverContent>
      </Popover>
      <Sheet open={open && mobile} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rc-mobile-calendar">
          <SheetTitle>Date range</SheetTitle>
          <SheetDescription>
            Operational dates in India Standard Time.
          </SheetDescription>
          {content}
        </SheetContent>
      </Sheet>
    </>
  );
}
