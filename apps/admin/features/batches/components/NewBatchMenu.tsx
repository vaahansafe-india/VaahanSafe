"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@vaahansafe/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@vaahansafe/ui/components/sheet";

interface NewBatchMenuProps {
  onCreateOnline: () => void;
  onImportOffline: () => void;
  disabled?: boolean;
}

export function NewBatchMenu({
  onCreateOnline,
  onImportOffline,
  disabled,
}: NewBatchMenuProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="batches-new-menu-desktop">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="admin-button primary"
              disabled={disabled}
            >
              + New batch ▾
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="batches-new-menu-content">
            <DropdownMenuItem
              onClick={onCreateOnline}
              className="batches-new-menu-item"
            >
              <div>
                <strong>Create online batch</strong>
                <p>Generate a new controlled manufacturing lot.</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onImportOffline}
              className="batches-new-menu-item"
            >
              <div>
                <strong>Import offline batch</strong>
                <p>Validate and import an external lot from CSV.</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Trigger */}
      <div className="batches-new-menu-mobile">
        <button
          type="button"
          className="admin-button primary"
          disabled={disabled}
          onClick={() => setMobileSheetOpen(true)}
        >
          + New batch
        </button>

        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="bottom" className="batches-new-sheet-mobile">
            <SheetHeader className="batches-sheet-header">
              <SheetTitle>New manufacturing batch</SheetTitle>
              <SheetDescription>
                Select the batch creation workflow for this lot.
              </SheetDescription>
            </SheetHeader>
            <div className="batches-new-sheet-options">
              <button
                type="button"
                className="batches-new-sheet-option"
                onClick={() => {
                  setMobileSheetOpen(false);
                  onCreateOnline();
                }}
              >
                <div>
                  <strong>Create online batch</strong>
                  <p>Generate a new controlled manufacturing lot.</p>
                </div>
                <span>→</span>
              </button>
              <button
                type="button"
                className="batches-new-sheet-option"
                onClick={() => {
                  setMobileSheetOpen(false);
                  onImportOffline();
                }}
              >
                <div>
                  <strong>Import offline batch</strong>
                  <p>Validate and import an external lot from CSV.</p>
                </div>
                <span>→</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
