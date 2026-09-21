"use client";

import React, { useState, useEffect } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui";
import type {
  ContactsFilterState,
  VehicleOption,
  ContactRoleType,
} from "@/lib/contacts-types";
import { ROLE_DEFINITIONS } from "../roles/ContactRoleIcon";

interface ContactFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ContactsFilterState;
  vehicles: VehicleOption[];
  onApplyFilters: (filters: ContactsFilterState) => void;
}

export function ContactFiltersSheet({
  open,
  onOpenChange,
  filters,
  vehicles,
  onApplyFilters,
}: ContactFiltersSheetProps) {
  const [draftFilters, setDraftFilters] = useState<ContactsFilterState>(filters);

  useEffect(() => {
    if (open) {
      setDraftFilters(filters);
    }
  }, [open, filters]);

  const handleReset = () => {
    const resetState: ContactsFilterState = {
      search: "",
      role: "all",
      vehicleId: "all",
      visibility: "all",
    };
    setDraftFilters(resetState);
    onApplyFilters(resetState);
    onOpenChange(false);
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-background border-l border-border"
      >
        <div className="p-6 pr-16 border-b border-border/70 bg-card/60">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
            Filter Registry
          </div>
          <SheetHeader className="mt-1 text-left">
            <SheetTitle className="font-serif text-2xl font-medium text-foreground">
              Filter Contacts
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Filter contacts by relationship role, vehicle coverage, or public visibility.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. RELATIONSHIP ROLE */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              01 &bull; Relationship Role
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setDraftFilters({ ...draftFilters, role: "all" })}
                className={`rounded-xl border p-2.5 text-left text-xs transition-colors ${
                  draftFilters.role === "all"
                    ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                    : "border-border/60 hover:bg-muted/40 text-foreground"
                }`}
              >
                All Roles
              </button>
              {ROLE_DEFINITIONS.map((r) => (
                <button
                  key={r.type}
                  type="button"
                  onClick={() =>
                    setDraftFilters({
                      ...draftFilters,
                      role: r.type as ContactRoleType,
                    })
                  }
                  className={`rounded-xl border p-2.5 text-left text-xs transition-colors truncate ${
                    draftFilters.role === r.type
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border/60 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. VEHICLE SCOPE */}
          {vehicles.length > 1 && (
            <div className="space-y-2">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                02 &bull; Vehicle Association
              </div>
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDraftFilters({ ...draftFilters, vehicleId: "all" })}
                  className={`w-full rounded-xl border p-2.5 text-left text-xs transition-colors ${
                    draftFilters.vehicleId === "all"
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border/60 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  All Vehicles
                </button>
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setDraftFilters({ ...draftFilters, vehicleId: v.id })
                    }
                    className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-colors ${
                      draftFilters.vehicleId === v.id
                        ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                        : "border-border/60 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span className="font-mono font-bold">{v.maskedPlate}</span>
                    <span className="text-muted-foreground">{v.makeModel}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. PUBLIC SAFETY VIEW */}
          <div className="space-y-2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              03 &bull; Public Safety View
            </div>
            <div className="space-y-1.5 pt-1">
              {[
                { id: "all", label: "All Contacts (Public & Private)" },
                { id: "public", label: "Publicly Available Only (QR Scan Enabled)" },
                { id: "private", label: "Private Only (Hidden from Public View)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setDraftFilters({
                      ...draftFilters,
                      visibility: opt.id as "all" | "public" | "private",
                    })
                  }
                  className={`w-full rounded-xl border p-2.5 text-left text-xs transition-colors ${
                    draftFilters.visibility === opt.id
                      ? "border-[#cc785c] bg-[#cc785c]/10 text-[#cc785c] font-semibold"
                      : "border-border/60 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-border/70 bg-card/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 rounded-xl bg-[#cc785c] px-6 py-2.5 font-mono text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors shadow-xs"
          >
            <span>Apply Filters</span>
            <VaahanIcon name="check" size={13} />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
