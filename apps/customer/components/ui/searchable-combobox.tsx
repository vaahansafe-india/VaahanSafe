"use client";

import * as React from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@vaahansafe/ui/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableComboboxProps {
  options: (ComboboxOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  disabled = false,
  allowCustom = false,
  required = false,
  className,
  id,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Normalize options into ComboboxOption objects
  const normalizedOptions: ComboboxOption[] = React.useMemo(() => {
    return options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    );
  }, [options]);

  // Filter options based on query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Selected option label
  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase()
    );
  }, [normalizedOptions, value]);

  const displayLabel = selectedOption ? selectedOption.label : value;

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (allowCustom && searchQuery.trim()) {
        handleSelect(searchQuery.trim());
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const hasExactMatch = React.useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.some((opt) => opt.label.toLowerCase() === q);
  }, [normalizedOptions, searchQuery]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          id={id}
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left text-xs transition-all",
          "focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]",
          disabled
            ? "cursor-not-allowed opacity-50 bg-muted/20 text-muted-foreground"
            : "cursor-pointer hover:border-border/80 text-foreground",
          isOpen && "border-[#cc785c] ring-1 ring-[#cc785c]"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={cn(
            "truncate font-medium",
            !value && "text-muted-foreground/60 font-normal"
          )}
        >
          {displayLabel || placeholder}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="flex size-4.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Clear selection"
            >
              <X className="size-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180 text-[#cc785c]"
            )}
          />
        </div>
      </button>

      {/* Floating Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[240px] rounded-2xl border border-border bg-card p-2 shadow-2xl backdrop-blur-md transition-all animate-in fade-in-0 zoom-in-95">
          {/* Search Input Box */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border/80 bg-background py-2 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto space-y-0.5 rounded-xl pr-1"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected =
                  opt.value.toLowerCase() === value.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                      isSelected
                        ? "bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                        : isHighlighted
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted/80"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-muted-foreground truncate font-normal">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="size-3.5 shrink-0 text-[#cc785c]" />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No matching results for &ldquo;{searchQuery}&rdquo;
              </div>
            )}

            {/* Custom Entry Option when allowCustom is true and no exact match exists */}
            {allowCustom && searchQuery.trim() && !hasExactMatch && (
              <div
                onClick={() => handleSelect(searchQuery.trim())}
                className="mt-1 border-t border-border/60 pt-1.5"
              >
                <div className="flex items-center gap-2 rounded-lg bg-[#cc785c]/5 px-3 py-2 text-xs text-[#cc785c] hover:bg-[#cc785c]/10 cursor-pointer font-medium">
                  <span>Use custom city:</span>
                  <span className="font-bold truncate underline">
                    &ldquo;{searchQuery.trim()}&rdquo;
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Count / Tip */}
          <div className="mt-2 border-t border-border/60 pt-1.5 px-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>
              {filteredOptions.length} available
            </span>
            <span>Type to filter</span>
          </div>
        </div>
      )}
    </div>
  );
}
