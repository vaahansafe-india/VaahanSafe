"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@vaahansafe/ui/components/popover";
import { Calendar } from "@vaahansafe/ui/components/calendar";

export function AdminDatePicker({
  value,
  onChange,
  label,
  id,
  disabled,
  placeholder = "Pick a date",
}: {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange("");
    } else {
      onChange(format(date, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={label}
          className="admin-date-picker-trigger"
        >
          <span className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground shrink-0 opacity-70"
            >
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <span className={selectedDate ? "font-medium text-foreground" : "text-muted-foreground opacity-60"}>
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
            </span>
          </span>
          {selectedDate && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("");
                }
              }}
              title="Clear date"
              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors ml-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border border-[#deddd3] bg-[#fffefb] shadow-xl rounded-lg z-[100]"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
