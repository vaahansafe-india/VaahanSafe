"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@vaahansafe/ui/lib/utils";

export interface DatePickerProps {
  value?: string;
  onChange?: (dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  clearable?: boolean;
}

function parseDate(val?: string): Date | undefined {
  if (!val) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (match && match[1] && match[2] && match[3]) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(() => parseDate(value), [value]);

  const displayLabel = React.useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal border-input bg-background px-3 hover:bg-muted/50 focus-visible:ring-[#cc785c]",
            !value && "text-muted-foreground",
            className
          )}
        >
          <VaahanIcon
            name="calendar"
            size={15}
            className="mr-2 text-muted-foreground shrink-0"
          />
          <span className="flex-1 truncate text-xs sm:text-sm">
            {displayLabel ?? placeholder}
          </span>
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange?.("");
                }
              }}
              className="ml-auto p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <VaahanIcon name="close" size={13} />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            if (d) {
              onChange?.(formatDate(d));
            } else {
              onChange?.("");
            }
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
