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
  Input,
  Label,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { requestAccountDeletionAction } from "@/lib/settings-actions";
import { toast } from "sonner";

interface DeleteAccountAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveVehicles: boolean;
}

export function DeleteAccountAlert({
  open,
  onOpenChange,
  hasActiveVehicles,
}: DeleteAccountAlertProps) {
  const [confirmText, setConfirmText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (open) {
      setConfirmText("");
      setError(null);
    }
  }, [open]);

  const handleDelete = () => {
    if (confirmText.trim() !== "DELETE") {
      setError('Please type "DELETE" exactly to confirm.');
      return;
    }

    startTransition(async () => {
      const res = await requestAccountDeletionAction(confirmText.trim());
      if (res.success) {
        toast.success(res.message || "Account closure request registered.");
        onOpenChange(false);
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <VaahanIcon name="warning" size={16} />
            </div>
            <AlertDialogTitle className="font-serif text-lg font-medium text-destructive">
              Close VaahanSafe Account
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
            Permanently closing your account will revoke all sessions and disable account sign-in.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {hasActiveVehicles ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-400 space-y-1">
              <span className="font-mono font-semibold uppercase tracking-wider text-[10px]">
                Active Vehicle Protection Bound
              </span>
              <p className="text-[11px] leading-relaxed">
                You have active registered vehicles with QR emergency stickers. To prevent leaving vehicles unprotected, you must unbind or transfer them before account closure.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-1 text-muted-foreground text-[11px] leading-relaxed">
              <span className="font-mono uppercase font-semibold text-[10px] text-foreground">
                Consequences of closure:
              </span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Access to the customer dashboard will be terminated.</li>
                <li>Financial transaction and tax invoices are retained as required by Indian GST laws.</li>
              </ul>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <Label htmlFor="delete-confirm-input" className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Type <span className="text-destructive font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm-input"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              placeholder="DELETE"
              disabled={isPending || hasActiveVehicles}
              className="h-8 text-xs font-mono"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending || confirmText.trim() !== "DELETE" || hasActiveVehicles}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
          >
            {isPending ? "Processing..." : "Permanently Close Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
