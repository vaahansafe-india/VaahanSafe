"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type {
  SafetyContactItem,
  ContactsFilterState,
  VehicleOption,
} from "@/lib/contacts-types";
import { ContactRecord } from "./ContactRecord";
import { ContactSearch } from "./ContactSearch";
import { ContactFilters } from "./ContactFilters";
import { ActiveContactFilters } from "./ActiveContactFilters";

interface ContactRegistryProps {
  contacts: SafetyContactItem[];
  allVehicles: VehicleOption[];
  filters: ContactsFilterState;
  onFilterChange: (filters: ContactsFilterState) => void;
  onOpenFilterSheet: () => void;
  onManageContact: (contact: SafetyContactItem) => void;
  onEditContact: (contact: SafetyContactItem) => void;
  onToggleVisibility: (contact: SafetyContactItem) => void;
  onSetPrimary: (contact: SafetyContactItem) => void;
  onRemoveContact: (contact: SafetyContactItem) => void;
  onAddContact: () => void;
  className?: string;
}

export function ContactRegistry({
  contacts,
  allVehicles,
  filters,
  onFilterChange,
  onOpenFilterSheet,
  onManageContact,
  onEditContact,
  onToggleVisibility,
  onSetPrimary,
  onRemoveContact,
  onAddContact,
  className = "",
}: ContactRegistryProps) {
  // Filter contacts client-side according to active filter state
  const filteredContacts = React.useMemo(() => {
    return contacts.filter((c) => {
      // 1. Search (name, relationship label, vehicle plate, or make/model)
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesRel = c.relationshipLabel.toLowerCase().includes(q);
        const matchesVehicle = c.associatedVehicles.some(
          (v) =>
            v.plate.toLowerCase().includes(q) ||
            v.makeModel.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesRel && !matchesVehicle) return false;
      }

      // 2. Role filter
      if (filters.role !== "all" && c.role !== filters.role) {
        return false;
      }

      // 3. Vehicle filter
      if (
        filters.vehicleId !== "all" &&
        !c.associatedVehicles.some((v) => v.vehicleId === filters.vehicleId)
      ) {
        return false;
      }

      // 4. Visibility filter
      if (filters.visibility === "public" && !c.isPubliclyAvailable) {
        return false;
      }
      if (filters.visibility === "private" && c.isPubliclyAvailable) {
        return false;
      }

      return true;
    });
  }, [contacts, filters]);

  const handleRemoveFilterKey = (key: keyof ContactsFilterState) => {
    onFilterChange({
      ...filters,
      [key]: key === "search" ? "" : "all",
    });
  };

  const handleResetFilters = () => {
    onFilterChange({
      search: "",
      role: "all",
      vehicleId: "all",
      visibility: "all",
    });
  };

  return (
    <div className={`space-y-4 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs ${className}`}>
      {/* Registry Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-border/60">
        <div className="min-w-0">
          <div className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
            Contact Registry
          </div>
          <h3 className="font-serif text-lg sm:text-2xl font-medium tracking-tight text-foreground truncate">
            Your Safety Contacts
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline font-mono text-xs text-muted-foreground">
            Showing {filteredContacts.length} of {contacts.length}
          </span>
          <span className="sm:hidden font-mono text-[10px] font-medium text-muted-foreground bg-muted/60 rounded-lg px-2 py-0.5">
            {filteredContacts.length}/{contacts.length}
          </span>
          <button
            type="button"
            onClick={onAddContact}
            className="inline-flex items-center gap-1 rounded-xl bg-[#cc785c] px-2.5 sm:px-3 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#a9583e] shrink-0"
          >
            <span className="text-sm font-bold leading-none">+</span>
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Adaptive Search & Filters (shown if more than 1 contact or actively filtering) */}
      {(contacts.length > 1 || filters.search || filters.role !== "all" || filters.visibility !== "all" || filters.vehicleId !== "all") && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <ContactSearch
              value={filters.search}
              onChange={(search) => onFilterChange({ ...filters, search })}
            />
            <ContactFilters
              filters={filters}
              onFilterChange={onFilterChange}
              vehicles={allVehicles}
              onOpenFilterSheet={onOpenFilterSheet}
            />
          </div>

          <ActiveContactFilters
            filters={filters}
            vehicles={allVehicles}
            onRemoveFilter={handleRemoveFilterKey}
            onResetFilters={handleResetFilters}
          />
        </div>
      )}

      {/* Contact Records List */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/30 text-muted-foreground">
            <VaahanIcon name="search" size={20} />
          </div>
          <h4 className="mt-3 font-medium text-sm text-foreground">
            No contacts match these filters
          </h4>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Try adjusting your search keyword or clearing the active role and visibility filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 font-mono text-xs font-semibold text-[#cc785c] hover:underline"
          >
            Clear All Filters &rarr;
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-0 sm:divide-y sm:divide-border/60">
          {filteredContacts.map((contact, idx) => (
            <ContactRecord
              key={contact.id}
              contact={contact}
              index={idx}
              onManage={onManageContact}
              onEdit={onEditContact}
              onToggleVisibility={onToggleVisibility}
              onSetPrimary={onSetPrimary}
              onRemove={onRemoveContact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
