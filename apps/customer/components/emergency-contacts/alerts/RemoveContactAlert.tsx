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
import { removeSafetyContactAction } from "@/lib/contacts-actions";

interface RemoveContactAlertProps {
  contact: SafetyContactItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RemoveContactAlert({
  contact,
  open,
  onOpenChange,
  onSuccess,
}: RemoveContactAlertProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  if (!contact) return null;

  const handleConfirmRemove = async () => {
    setIsRemoving(true);
    try {
      const res = await removeSafetyContactAction(contact.id);
      if (res.success) {
        toast.success(`${contact.name} was removed from your safety contacts.`);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "Failed to remove contact.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
        <AlertDialogHeader className="text-left space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#c64545]/15 text-[#c64545]">
            <VaahanIcon name="alert" size={20} />
          </div>
          <AlertDialogTitle className="font-serif text-2xl font-medium text-foreground">
            Remove Safety Contact?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{contact.name}</span> will be removed from your VaahanSafe emergency network.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-2 space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-3.5 text-xs">
          <div>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Affected Vehicles ({contact.associatedVehicles.length}):
            </span>
            <div className="mt-1 space-y-1">
              {contact.associatedVehicles.map((v) => (
                <div key={v.vehicleId} className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-semibold text-foreground">{v.maskedPlate}</span>
                  <span className="text-muted-foreground">{v.makeModel}</span>
                </div>
              ))}
            </div>
          </div>

          {contact.isPubliclyAvailable && (
            <div className="pt-2 border-t border-border/60 text-[#cc785c] font-medium text-[11px]">
              &bull; This contact will no longer be available through the affected public safety QR views.
            </div>
          )}
        </div>

        <AlertDialogFooter className="mt-4 flex sm:justify-between gap-2">
          <AlertDialogCancel
            disabled={isRemoving}
            className="rounded-xl border border-input font-mono text-xs font-medium text-foreground hover:bg-muted/40"
          >
            Keep Contact
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmRemove}
            disabled={isRemoving}
            className="rounded-xl bg-[#c64545] font-mono text-xs font-semibold text-white hover:bg-[#a53636] transition-colors"
          >
            {isRemoving ? "Removing..." : "Remove Contact"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
