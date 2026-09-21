"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import { requestDataExportAction } from "@/lib/settings-actions";
import { toast } from "sonner";

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataExportDialog({ open, onOpenChange }: DataExportDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [isRequested, setIsRequested] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setIsRequested(false);
    }
  }, [open]);

  const handleRequest = () => {
    startTransition(async () => {
      const res = await requestDataExportAction();
      if (res.success) {
        setIsRequested(true);
        toast.success(res.message || "Data export requested.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
              <VaahanIcon name="database" size={16} />
            </div>
            <DialogTitle className="font-serif text-lg font-medium text-foreground">
              Request Your Account Data
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            VaahanSafe provides an export of your personal data, vehicles, QR identifiers, and audit records in standard machine-readable JSON format.
          </DialogDescription>
        </DialogHeader>

        {!isRequested ? (
          <div className="space-y-4 py-2 text-xs text-muted-foreground leading-relaxed">
            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2">
              <span className="font-mono text-[10px] uppercase font-semibold tracking-wider text-foreground">
                Included in export:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Account profile & verified identity timestamps</li>
                <li>Registered vehicles and vehicle safety settings</li>
                <li>Active and historical QR sticker identifiers</li>
                <li>Emergency contacts & notification channel preferences</li>
                <li>Order numbers and official GST tax receipt references</li>
              </ul>
            </div>

            <p className="text-[11px]">
              For security, the archive will be generated asynchronously and made available via a signed, time-limited download link sent to your verified email address.
            </p>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRequest}
                disabled={isPending}
                className="bg-[#cc785c] hover:bg-[#b8674d] text-white"
              >
                {isPending ? "Submitting..." : "Request Export"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <VaahanIcon name="check" size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Export Job Queued
              </p>
              <p className="text-xs text-muted-foreground">
                Your data export is being generated securely. You will receive an email once the authorized download is ready.
              </p>
            </div>
            <DialogFooter className="justify-center sm:justify-center pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="bg-[#cc785c] hover:bg-[#b8674d] text-white px-5"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
