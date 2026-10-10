"use client";
import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vaahansafe/ui/components/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@vaahansafe/ui/components/command";
import { getAdminData } from "../../../lib/client-api";
import type { DistributorOption } from "../retailer.types";
import { normalizeRetailerSearch } from "../retailer.filters";
export function DistributorCombobox({
  value,
  onChange,
  onOption,
  initial,
  label = "Supplying distributor",
  allowClear = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onOption?: (v: DistributorOption | null) => void;
  initial?: DistributorOption | null;
  label?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [term, setTerm] = useState(""),
    [selected, setSelected] = useState<DistributorOption | null>(
      initial || null,
    ),
    id = useId();
  useEffect(() => {
    const t = setTimeout(() => setTerm(normalizeRetailerSearch(search)), 300);
    return () => clearTimeout(t);
  }, [search]);
  const detail = useQuery({
    queryKey: ["retailer-distributor", value],
    queryFn: ({ signal }) =>
      getAdminData<DistributorOption[]>(
        `/api/retailers/distributors?id=${encodeURIComponent(value)}`,
        signal,
      ),
    enabled: !!value && !selected,
    staleTime: 60000,
  });
  const current = selected?.id === value ? selected : detail.data?.[0];
  const query = useQuery({
    queryKey: ["retailer-distributor-search", term],
    queryFn: ({ signal }) =>
      getAdminData<DistributorOption[]>(
        `/api/retailers/distributors?q=${encodeURIComponent(term)}`,
        signal,
      ),
    enabled: open && (term.length === 0 || term.length >= 2),
    staleTime: 30000,
  });
  return (
    <div className="dist-field">
      <label id={`${id}-label`}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={`${id}-label`}
            aria-controls={`${id}-list`}
            className="dist-combobox"
          >
            {value
              ? current?.name || "Selected distributor"
              : "Search distributors…"}
            <span aria-hidden>⌄</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="dist-combobox-popover retail-command"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              aria-label="Search distributors"
              placeholder="Name, reference or locality…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList id={`${id}-list`}>
              <CommandEmpty>
                {term.length === 1
                  ? "Enter at least two characters."
                  : query.isError
                    ? "Distributors could not load. Close and try again."
                    : query.isFetching
                      ? "Searching distributors…"
                      : "No active distributors match. Add a distributor first if the network is empty."}
              </CommandEmpty>
              {allowClear && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("");
                    setSelected(null);
                    onOption?.(null);
                    setOpen(false);
                  }}
                >
                  All distributors
                </CommandItem>
              )}
              {query.data?.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={() => {
                    setSelected(o);
                    onChange(o.id);
                    onOption?.(o);
                    setOpen(false);
                  }}
                >
                  <div>
                    <strong>{o.name}</strong>
                    <small>
                      {o.reference_code} · {o.city} ·{" "}
                      {o.state_name || "Location setup required"}
                    </small>
                  </div>
                  {value === o.id && <span aria-hidden>✓</span>}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {current && (
        <small>
          {current.reference_code} ·{" "}
          {current.status === "ACTIVE" ? "Active" : "Suspended"}
        </small>
      )}
    </div>
  );
}
