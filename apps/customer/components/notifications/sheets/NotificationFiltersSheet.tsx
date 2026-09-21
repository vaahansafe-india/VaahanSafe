"use client";

import React from "react";
import type { NotificationFiltersState } from "@/lib/notifications-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@vaahansafe/ui";

interface NotificationFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: NotificationFiltersState;
  onApplyFilters: (filters: NotificationFiltersState) => void;
  vehicles: Array<{ id: string; registrationNumber: string; make: string; model: string }>;
  resultsCount: number;
}

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "safety", label: "QR & Safety" },
  { id: "commerce", label: "Payments & Invoices" },
  { id: "fulfilment", label: "Orders & Shipping" },
  { id: "subscription", label: "Subscriptions" },
  { id: "security", label: "Security & Logins" },
  { id: "account", label: "Account & Profile" },
];

export function NotificationFiltersSheet({
  open,
  onOpenChange,
  filters,
  onApplyFilters,
  vehicles,
  resultsCount,
}: NotificationFiltersSheetProps) {
  const [draft, setDraft] = React.useState<NotificationFiltersState>(filters);

  React.useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  const handleReset = () => {
    const resetState: NotificationFiltersState = {
      ...draft,
      status: "all",
      category: "all",
      vehicleId: "all",
      attention: "all",
      search: "",
    };
    setDraft(resetState);
    onApplyFilters(resetState);
    onOpenChange(false);
  };

  const handleApply = () => {
    onApplyFilters(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-card text-foreground"
      >
        <div className="p-6 overflow-y-auto space-y-6">
          <SheetHeader className="text-left pr-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
              Activity Filter
            </span>
            <SheetTitle className="font-serif text-2xl font-medium tracking-tight text-foreground">
              Filter Notifications
            </SheetTitle>
          </SheetHeader>

          {/* 1. Status Filter */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Read State
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "read", label: "Read" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, status: s.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                    draft.status === s.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-bold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Action / Attention Filter */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Action Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "All" },
                { id: "action_required", label: "Action" },
                { id: "informational", label: "Info Only" },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, attention: a.id as any })}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all ${
                    draft.attention === a.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-bold"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category Filter */}
          <div className="space-y-2">
            <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Domain Category
            </label>
            <div className="space-y-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, category: c.id })}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-xs transition-all text-left ${
                    draft.category === c.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  <span>{c.label}</span>
                  {draft.category === c.id && <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Vehicle Filter (if user has vehicles) */}
          {vehicles.length > 0 && (
            <div className="space-y-2">
              <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Associated Vehicle
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, vehicleId: "all" })}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-xs transition-all text-left ${
                    draft.vehicleId === "all"
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  }`}
                >
                  <span>All Vehicles</span>
                  {draft.vehicleId === "all" && <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />}
                </button>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, vehicleId: v.id })}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-xs transition-all text-left ${
                      draft.vehicleId === v.id
                        ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                    }`}
                  >
                    <span>{v.make} {v.model} ({v.registrationNumber})</span>
                    {draft.vehicleId === v.id && <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer with Results Count */}
        <div className="p-4 sm:p-6 border-t border-border/70 bg-card/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-border bg-background px-4 py-2 font-mono text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center justify-center rounded-xl bg-[#cc785c] px-4 py-2 font-mono text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#a9583e] active:scale-98"
          >
            <span>Show Results ({resultsCount})</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
