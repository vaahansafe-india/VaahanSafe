"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { VaahanIcon } from "@vaahansafe/icons";
import { getAdminData } from "../../../lib/client-api";
import type { AdminIdentity } from "../../../lib/contracts";
import type {
  PartnerOption,
  InventoryOption,
  TransferRow,
} from "../transfer.types";
import { transferLabel } from "../transfer.types";
export const transferScope = (i: AdminIdentity) =>
  ["transfers", i.id, i.role, i.sessionId] as const;
export const canManageTransfers = (i: AdminIdentity) =>
  ["SUPER_ADMIN", "OPS_ADMIN"].includes(i.role);
export function useTransferRefresh(i: AdminIdentity) {
  const c = useQueryClient();
  return async () => {
    await Promise.all([
      c.invalidateQueries({ queryKey: transferScope(i) }),
      ...[
        "inventory",
        "distributors",
        "retailers",
        "batches",
        "reconciliation",
      ].map((k) => c.invalidateQueries({ queryKey: [k] })),
    ]);
  };
}
export function TransferError({
  message,
  retry,
}: {
  message: string;
  retry: () => unknown;
}) {
  return (
    <div className="tr-error" role="alert">
      <p>{message}</p>
      <button type="button" onClick={() => void retry()}>
        Try again
      </button>
    </div>
  );
}
export function TransferSkeleton() {
  return (
    <div
      className="tr-skeleton"
      aria-label="Loading transfer workspace"
      role="status"
    >
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export const transferDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : "Not recorded";
export function TransferBadge({ row }: { row: TransferRow }) {
  return (
    <span
      className={`tr-badge ${row.attention ? "attention" : ["RECEIVED", "RECONCILED", "CLOSED"].includes(row.status) ? "success" : ""}`}
    >
      {transferLabel(row.status)}
      {row.overdue ? " · Overdue" : ""}
    </span>
  );
}
export function TransferRail({ row }: { row: TransferRow }) {
  const stages = [
    "Requested",
    "Approved",
    "Dispatched",
    "Received",
    "Reconciled",
    "Closed",
  ];
  const current = (
    {
      REQUESTED: 0,
      APPROVED: 1,
      IN_TRANSIT: 2,
      PARTIALLY_RECEIVED: 2,
      DISCREPANCY: 2,
      RECEIVED: 3,
      RECONCILED: 4,
      CLOSED: 5,
      CANCELLED: -1,
      REJECTED: -1,
    } as const
  )[row.status];
  return (
    <ol
      className="tr-rail"
      aria-label={`Transfer progress: ${transferLabel(row.status)}`}
    >
      {stages.map((s, i) => (
        <li
          key={s}
          className={i <= current ? "done" : ""}
          aria-current={i === current ? "step" : undefined}
        >
          <span>{i + 1}</span>
          <small>{s}</small>
        </li>
      ))}
    </ol>
  );
}
export function TransferPicker({
  identity,
  label,
  value,
  onChange,
  kind = "partners",
  source = "",
  predicate,
  initialLabel,
  partnerKind,
  active = false,
  extraOptions,
}: {
  identity: AdminIdentity;
  label: string;
  value: string;
  onChange: (
    value: string,
    item: PartnerOption | InventoryOption | null,
  ) => void;
  kind?: "partners" | "inventory" | "batches";
  source?: string;
  predicate?: (p: PartnerOption) => boolean;
  initialLabel?: string;
  partnerKind?: string;
  active?: boolean;
  extraOptions?: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [chosen, setChosen] = useState(initialLabel || "");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const query = useQuery({
    queryKey: [
      ...transferScope(identity),
      "options",
      kind,
      source,
      debounced,
      partnerKind,
      active,
    ],
    queryFn: ({ signal }) =>
      getAdminData<(PartnerOption | InventoryOption)[]>(
        `/api/transfers/options?kind=${kind}&source=${encodeURIComponent(source)}&q=${encodeURIComponent(debounced)}&partnerKind=${partnerKind || ""}&active=${active}`,
        signal,
      ),
    enabled: open,
    staleTime: 15000,
  });
  const rows = (query.data || []).filter(
    (p) => kind !== "partners" || !predicate || predicate(p as PartnerOption),
  );
  const selected = rows.find((p) => p.id === value);
  const extraSelected = extraOptions?.find((o) => o.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className="tr-picker"
        >
          <span className="truncate">
            {value
              ? selected
                ? optionLabel(selected)
                : extraSelected
                  ? extraSelected.label
                  : chosen ||
                    `Selected ${kind === "partners" ? "partner" : "batch"}`
              : label}
          </span>
          <VaahanIcon name="chevron-down" size={11} className="opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="tr-combo" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${kind === "partners" ? "name or reference" : "batches"}…`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {query.isPending ? (
              <p role="status">Loading options…</p>
            ) : query.isError ? (
              <TransferError
                message="Options unavailable."
                retry={query.refetch}
              />
            ) : (
              <>
                {rows.length === 0 && !extraOptions?.length && (
                  <p role="status" className="tr-muted">
                    No matching{" "}
                    {kind === "partners"
                      ? "partners"
                      : kind === "inventory"
                        ? "eligible stock"
                        : "batches"}
                    .
                  </p>
                )}
                <CommandItem
                  onSelect={() => {
                    onChange("", null);
                    setChosen("");
                    setOpen(false);
                  }}
                >
                  Clear selection
                </CommandItem>
                {extraOptions?.map((o) => (
                  <CommandItem
                    key={o.id}
                    value={o.label}
                    onSelect={() => {
                      onChange(o.id, null);
                      setChosen(o.label);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <VaahanIcon name="database" size={13} className="text-amber-800 shrink-0" />
                      <strong>{o.label}</strong>
                    </div>
                  </CommandItem>
                ))}
                {rows.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onChange(p.id, p);
                      setChosen(optionLabel(p));
                      setOpen(false);
                    }}
                  >
                    {optionLabel(p)}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
function optionLabel(p: PartnerOption | InventoryOption) {
  return "name" in p
    ? `${p.name} · ${p.reference_code}`
    : `${p.reference_code} · ${p.available.toLocaleString("en-IN")} available`;
}
