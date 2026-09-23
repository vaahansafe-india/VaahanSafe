"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@vaahansafe/ui";
import type { SafetyContactItem } from "@/lib/contacts-types";
import { ContactRoleMark } from "../roles/ContactRoleMark";

interface ContactRecordProps {
  contact: SafetyContactItem;
  index: number;
  onManage: (contact: SafetyContactItem) => void;
  onEdit: (contact: SafetyContactItem) => void;
  onToggleVisibility: (contact: SafetyContactItem) => void;
  onSetPrimary: (contact: SafetyContactItem) => void;
  onRemove: (contact: SafetyContactItem) => void;
}

export function ContactRecord({
  contact,
  index,
  onManage,
  onEdit,
  onToggleVisibility,
  onSetPrimary,
  onRemove,
}: ContactRecordProps) {
  const indexNumber = String(index + 1).padStart(2, "0");

  const actionMenuContent = (
    <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
      <DropdownMenuItem
        onClick={() => onManage(contact)}
        className="gap-2 text-xs font-medium cursor-pointer"
      >
        <VaahanIcon name="eye" size={14} />
        <span>View Details</span>
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => onEdit(contact)}
        className="gap-2 text-xs font-medium cursor-pointer"
      >
        <VaahanIcon name="settings" size={14} />
        <span>Edit Contact</span>
      </DropdownMenuItem>

      {!contact.isPrimary && (
        <DropdownMenuItem
          onClick={() => onSetPrimary(contact)}
          className="gap-2 text-xs font-medium cursor-pointer text-[#cc785c]"
        >
          <VaahanIcon name="shield" size={14} />
          <span>Set as Primary</span>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        onClick={() => onToggleVisibility(contact)}
        className="gap-2 text-xs font-medium cursor-pointer"
      >
        <VaahanIcon
          name={contact.isPubliclyAvailable ? "eye-off" : "eye"}
          size={14}
        />
        <span>
          {contact.isPubliclyAvailable
            ? "Hide from Public View"
            : "Show in Public View"}
        </span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => onRemove(contact)}
        className="gap-2 text-xs font-medium text-[#c64545] focus:text-[#c64545] cursor-pointer"
      >
        <VaahanIcon name="close" size={14} />
        <span>Remove Contact</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:py-4 sm:px-4 rounded-2xl border border-border/50 sm:border-transparent bg-card/60 sm:bg-transparent hover:bg-muted/30 transition-all shadow-2xs sm:shadow-none">
      {/* Identity block */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        <span className="font-mono text-xs font-bold text-muted-foreground w-5 sm:w-6 shrink-0 pt-0.5 sm:pt-0">
          {indexNumber}
        </span>

        {/* Responsive role mark */}
        <ContactRoleMark
          role={contact.role}
          size="sm"
          className="shrink-0 sm:hidden mt-0.5"
          isPrimary={contact.isPrimary}
        />
        <ContactRoleMark
          role={contact.role}
          size="md"
          className="shrink-0 hidden sm:inline-flex"
          isPrimary={contact.isPrimary}
        />

        {/* Person details: Unclamped full name and metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h4 className="font-serif text-sm sm:text-base font-semibold text-foreground group-hover:text-[#cc785c] transition-colors leading-snug break-words">
              {contact.name}
            </h4>
            {contact.isPrimary && (
              <span className="rounded-full bg-[#cc785c]/15 px-1.5 sm:px-2 py-0.5 font-mono text-[8px] sm:text-[9px] font-bold text-[#cc785c] shrink-0">
                PRIMARY
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="font-mono font-medium text-foreground/80">
              {contact.relationshipLabel}
            </span>
            <span className="text-muted-foreground/40">&bull;</span>
            <span className="font-mono">{contact.maskedPhone}</span>
          </div>
        </div>

        {/* Mobile top-right menu trigger */}
        <div className="sm:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground transition-colors hover:text-foreground hover:border-border shrink-0"
                aria-label="More contact actions"
              >
                <VaahanIcon name="more" size={14} />
              </button>
            </DropdownMenuTrigger>
            {actionMenuContent}
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Bottom Row: Public safety status and Manage button */}
      <div className="sm:hidden flex items-center justify-between gap-2 pt-2.5 border-t border-border/30">
        <div className="flex items-center gap-2 font-mono text-[10.5px]">
          {contact.isPubliclyAvailable ? (
            <span className="inline-flex items-center gap-1 text-[#5db8a6] font-medium">
              <VaahanIcon name="check" size={11} />
              <span>Public View</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Private</span>
          )}
          <span className="text-muted-foreground/40">&bull;</span>
          <span className="text-muted-foreground">
            {contact.associatedVehicles.length}{" "}
            {contact.associatedVehicles.length === 1 ? "vehicle" : "vehicles"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onManage(contact)}
          className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background px-2.5 py-1 font-mono text-[11px] font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c] active:scale-95 shrink-0"
        >
          <span>Manage</span>
          <VaahanIcon name="arrow-right" size={10} />
        </button>
      </div>

      {/* Middle: Desktop/Tablet Columns */}
      <div className="hidden sm:flex items-center gap-6 shrink-0">
        {/* Public Safety View state */}
        <div className="flex flex-col items-end">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Public Safety View
          </span>
          {contact.isPubliclyAvailable ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-[#5db8a6]">
              <VaahanIcon name="check" size={11} />
              Available
            </span>
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              Not shown
            </span>
          )}
        </div>

        {/* Vehicles linked */}
        <div className="hidden md:flex flex-col items-end">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Vehicles
          </span>
          <span className="font-mono text-xs font-medium text-foreground">
            {contact.associatedVehicles.length}{" "}
            {contact.associatedVehicles.length === 1 ? "vehicle" : "vehicles"}
          </span>
        </div>

        {/* Desktop Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onManage(contact)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 sm:px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c]"
          >
            <span>Manage</span>
            <VaahanIcon name="arrow-right" size={11} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground shrink-0"
                aria-label="More contact actions"
              >
                <VaahanIcon name="more" size={14} />
              </button>
            </DropdownMenuTrigger>
            {actionMenuContent}
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
