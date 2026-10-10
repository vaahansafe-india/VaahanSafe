"use client";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vaahansafe/ui/components/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@vaahansafe/ui/components/command";
import { getAdminData } from "../../lib/client-api";
import type { GeographyOption } from "./geography.types";
import { VaahanIcon } from "@vaahansafe/icons";
export function GeographyCombobox({
  label,
  value,
  onChange,
  state,
  required = false,
  allowClear = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  state?: string;
  required?: boolean;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false),
    id = useId(),
    isDistrict = state !== undefined;
  const query = useQuery({
    queryKey: ["admin-geography", isDistrict ? state : "states"],
    queryFn: ({ signal }) =>
      getAdminData<GeographyOption[]>(
        `/api/geography${isDistrict ? `?state=${encodeURIComponent(state!)}` : ""}`,
        signal,
      ),
    enabled: !isDistrict || !!state,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const disabled = isDistrict && !state;
  return (
    <div className="dist-field">
      <label id={`${id}-label`}>
        {label}
        {required ? " *" : ""}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="dist-combobox"
            role="combobox"
            aria-expanded={open}
            aria-labelledby={`${id}-label`}
            aria-controls={`${id}-options`}
            disabled={disabled}
          >
            {disabled
              ? "Select a state first"
              : query.data?.find((v) => v.code === value)?.name ||
                `Select ${label.toLowerCase()}…`}
            <VaahanIcon
              name="chevron-down"
              size={11}
              className="opacity-60 shrink-0"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="dist-combobox-popover" align="start">
          <Command>
            <CommandInput
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder={`Search ${label.toLowerCase()}…`}
            />
            <CommandList id={`${id}-options`}>
              <CommandEmpty>
                {query.isError
                  ? "Locations could not load. Close and try again."
                  : query.isPending
                    ? "Loading locations…"
                    : "No matching locations."}
              </CommandEmpty>
              <CommandGroup>
                {allowClear && (
                  <CommandItem
                    value="all locations"
                    onSelect={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    All {isDistrict ? "districts" : "states"}
                  </CommandItem>
                )}
                {query.data?.map((option) => (
                  <CommandItem
                    key={option.code}
                    value={option.name}
                    onSelect={() => {
                      onChange(option.code);
                      setOpen(false);
                    }}
                  >
                    <span>{option.name}</span>
                    {value === option.code && <span aria-hidden>✓</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
