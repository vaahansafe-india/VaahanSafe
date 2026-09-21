"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

interface RemoveVehicleAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: {
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
  } | null;
  onSuccess?: () => void;
}

export function RemoveVehicleAlert({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: RemoveVehicleAlertProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!vehicle) return null;

  const handleConfirmRemove = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove vehicle");
      }

      toast.success("Vehicle removed.");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/vehicles");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove vehicle. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
            CONSEQUENTIAL ACTION
          </div>
          <AlertDialogTitle>
            Remove {vehicle.make} {vehicle.model}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2 text-xs">
            <p>
              This action will remove vehicle <strong className="font-mono text-foreground">{vehicle.registrationNumber}</strong> from your active VaahanSafe identity registry.
            </p>
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-destructive dark:text-red-400 space-y-1 text-xs">
              <div className="font-semibold">Security & Safety Effects:</div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Any active QR sticker connected to this vehicle will be unlinked immediately.</li>
                <li>Emergency scans by finders will no longer resolve emergency contact alerts.</li>
                <li>Past scan telemetry and historical order records remain archived for security compliance.</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirmRemove();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-mono text-xs uppercase"
          >
            {isDeleting ? "Removing..." : "Remove vehicle"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
