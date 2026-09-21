"use client";

import * as React from "react";
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
import { revokeAllOtherSessionsAction } from "@/lib/settings-actions";
import { toast } from "sonner";

interface RevokeOtherSessionsAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  otherCount: number;
}

export function RevokeOtherSessionsAlert({
  open,
  onOpenChange,
  onSuccess,
  otherCount,
}: RevokeOtherSessionsAlertProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleRevokeAll = () => {
    startTransition(async () => {
      const res = await revokeAllOtherSessionsAction();
      if (res.success) {
        toast.success("All other sessions signed out.");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-lg font-medium text-foreground">
            Sign out all other sessions?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This will immediately terminate {otherCount} active {otherCount === 1 ? "session" : "sessions"} on all other browsers and devices. Your current session on this device will remain active and uninterrupted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRevokeAll();
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
          >
            {isPending ? "Signing Out All..." : "Sign Out All Other Sessions"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
