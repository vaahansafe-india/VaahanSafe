"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui";
import type { SafetyContactItem } from "@/lib/contacts-types";
import { setPrimaryContactAction } from "@/lib/contacts-actions";

interface ChangePrimaryContactAlertProps {
  contact: SafetyContactItem | null;
  currentPrimary: SafetyContactItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ChangePrimaryContactAlert({
  contact,
  currentPrimary,
  open,
  onOpenChange,
  onSuccess,
}: ChangePrimaryContactAlertProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!contact) return null;

  const handleConfirmPrimary = async () => {
    setIsUpdating(true);
    try {
      const res = await setPrimaryContactAction(contact.id);
      if (res.success) {
        toast.success(`${contact.name} is now your primary safety contact.`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to update primary contact.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
        <AlertDialogHeader className="text-left space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#cc785c]/15 text-[#cc785c]">
            <VaahanIcon name="shield" size={20} />
          </div>
          <AlertDialogTitle className="font-serif text-2xl font-medium text-foreground">
            Change Primary Contact?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{contact.name}</span> will become your primary safety contact and will receive initial emergency pings first.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {currentPrimary && (
          <div className="my-2 rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Current Primary Contact:
            </span>
            <div className="mt-1 font-medium text-foreground">
              {currentPrimary.name} ({currentPrimary.relationshipLabel})
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {currentPrimary.name} will transition to secondary priority (Priority 02).
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-4 flex sm:justify-between gap-2">
          <AlertDialogCancel
            disabled={isUpdating}
            className="rounded-xl border border-input font-mono text-xs font-medium text-foreground hover:bg-muted/40"
          >
            Keep Current
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmPrimary}
            disabled={isUpdating}
            className="rounded-xl bg-[#cc785c] font-mono text-xs font-semibold text-white hover:bg-[#a9583e] transition-colors"
          >
            {isUpdating ? "Updating..." : "Make Primary"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
