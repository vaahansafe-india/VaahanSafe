"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  SafetyContactNetworkData,
  SafetyContactItem,
  ContactsFilterState,
} from "@/lib/contacts-types";
import { EmergencyContactsHeader } from "./EmergencyContactsHeader";
import { SafetyContactNetwork } from "./network/SafetyContactNetwork";
import { MobileSafetyContactRail } from "./network/MobileSafetyContactRail";
import { ContactSignalRail } from "./signals/ContactSignalRail";
import { PrimaryContactPanel } from "./primary/PrimaryContactPanel";
import { ContactRegistry } from "./registry/ContactRegistry";
import { AddContactSheet } from "./sheets/AddContactSheet";
import { ContactDetailsSheet } from "./sheets/ContactDetailsSheet";
import { EditContactSheet } from "./sheets/EditContactSheet";
import { ContactFiltersSheet } from "./sheets/ContactFiltersSheet";
import { PublicSafetyPreviewDialog } from "./dialogs/PublicSafetyPreviewDialog";
import { RemoveContactAlert } from "./alerts/RemoveContactAlert";
import { ChangePrimaryContactAlert } from "./alerts/ChangePrimaryContactAlert";
import { ContactsEmptyState } from "./states/ContactsEmptyState";

interface EmergencyContactsControllerProps {
  initialData: SafetyContactNetworkData;
}

export function EmergencyContactsController({
  initialData,
}: EmergencyContactsControllerProps) {
  const router = useRouter();

  // Sheet & Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Selected contact interaction targets
  const [detailsContact, setDetailsContact] = useState<SafetyContactItem | null>(null);
  const [editContact, setEditContact] = useState<SafetyContactItem | null>(null);
  const [removeContact, setRemoveContact] = useState<SafetyContactItem | null>(null);
  const [primaryContactTarget, setPrimaryContactTarget] = useState<SafetyContactItem | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ContactsFilterState>(initialData.appliedFilters);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSelectContactForDetails = (contact: SafetyContactItem) => {
    setDetailsContact(contact);
  };

  const handleEditContact = (contact: SafetyContactItem) => {
    setEditContact(contact);
  };

  const handleSetPrimary = (contact: SafetyContactItem) => {
    setPrimaryContactTarget(contact);
  };

  const handleRemoveContact = (contact: SafetyContactItem) => {
    setRemoveContact(contact);
  };

  const handleToggleVisibility = async (contact: SafetyContactItem) => {
    setDetailsContact(contact);
  };

  const hasContacts = initialData.contacts.length > 0;

  return (
    <div className="space-y-6">
      {!hasContacts ? (
        /* Empty State */
        <div className="space-y-6">
          <EmergencyContactsHeader onAddContact={() => setIsAddOpen(true)} />
          <ContactsEmptyState
            vehicles={initialData.vehicles}
            onAddContact={() => setIsAddOpen(true)}
          />
        </div>
      ) : (
        <>
          {/* 1. Hero Grid: Header & Story (Left 7 cols) + Constellation (Right 5 cols on lg) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
            {/* Left: Editorial Header & Safety Boundaries */}
            <div className="lg:col-span-7">
              <EmergencyContactsHeader onAddContact={() => setIsAddOpen(true)} />
            </div>

            {/* Right Desktop: Compact Interactive Constellation */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#cc785c]">
                    Safety Network Topology
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Interactive Orbit
                  </span>
                </div>
                <SafetyContactNetwork
                  contacts={initialData.contacts}
                  vehicles={initialData.vehicles}
                  onSelectContact={handleSelectContactForDetails}
                  onAddContact={() => setIsAddOpen(true)}
                />
              </div>
            </div>
          </div>

          {/* Mobile / Tablet: Vertical Safety Network Rail */}
          <div className="block lg:hidden">
            <MobileSafetyContactRail
              contacts={initialData.contacts}
              vehicles={initialData.vehicles}
              onSelectContact={handleSelectContactForDetails}
              onAddContact={() => setIsAddOpen(true)}
            />
          </div>

          {/* 2. Real Contact Signal Rail */}
          <ContactSignalRail signals={initialData.signals} />

          {/* 3. Primary Contact & Public Safety View Panels (Full width: 1 col on mobile, 2 cols on md+) */}
          <PrimaryContactPanel
            primaryContact={initialData.primaryContact}
            vehicles={initialData.vehicles}
            onManageContact={handleSelectContactForDetails}
            onPreviewPublicView={() => setIsPreviewOpen(true)}
            onAddContact={() => setIsAddOpen(true)}
          />

          {/* 4. Editorial Contact Registry */}
          <ContactRegistry
            contacts={initialData.contacts}
            allVehicles={initialData.vehicles}
            filters={filters}
            onFilterChange={setFilters}
            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
            onManageContact={handleSelectContactForDetails}
            onEditContact={handleEditContact}
            onToggleVisibility={handleToggleVisibility}
            onSetPrimary={handleSetPrimary}
            onRemoveContact={handleRemoveContact}
            onAddContact={() => setIsAddOpen(true)}
          />
        </>
      )}

      {/* 5. Modals & Sheets */}
      <AddContactSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        vehicles={initialData.vehicles}
        onSuccess={handleRefresh}
      />

      <ContactDetailsSheet
        contact={detailsContact}
        open={!!detailsContact}
        onOpenChange={(open) => !open && setDetailsContact(null)}
        vehicles={initialData.vehicles}
        onEdit={handleEditContact}
        onSetPrimary={handleSetPrimary}
        onRemove={handleRemoveContact}
        onSuccess={handleRefresh}
      />

      <EditContactSheet
        contact={editContact}
        open={!!editContact}
        onOpenChange={(open) => !open && setEditContact(null)}
        vehicles={initialData.vehicles}
        onSuccess={handleRefresh}
      />

      <ContactFiltersSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={filters}
        vehicles={initialData.vehicles}
        onApplyFilters={setFilters}
      />

      <PublicSafetyPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        vehicles={initialData.vehicles}
      />

      <RemoveContactAlert
        contact={removeContact}
        open={!!removeContact}
        onOpenChange={(open) => !open && setRemoveContact(null)}
        onSuccess={handleRefresh}
      />

      <ChangePrimaryContactAlert
        contact={primaryContactTarget}
        currentPrimary={initialData.primaryContact}
        open={!!primaryContactTarget}
        onOpenChange={(open) => !open && setPrimaryContactTarget(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
