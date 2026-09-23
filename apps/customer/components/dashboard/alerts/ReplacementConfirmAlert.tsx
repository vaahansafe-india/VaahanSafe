"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui";
import type { DashboardQrSticker, DashboardVehicle } from "@/lib/dashboard-types";

interface ReplacementConfirmAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrSticker: DashboardQrSticker | null;
  vehicle: DashboardVehicle | null;
}

export function ReplacementConfirmAlert({
  open,
  onOpenChange,
  qrSticker,
  vehicle,
}: ReplacementConfirmAlertProps) {
  const router = useRouter();

  const handleProceed = () => {
    onOpenChange(false);
    router.push(`/qr/buy?replace=${qrSticker?.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md bg-card p-4 sm:p-6 border border-[#c64545]/30">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2 text-[#c64545]">
            <VaahanIcon name="warning" size={18} />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
              REPLACEMENT CONSEQUENCE AUDIT
            </span>
          </div>
          <DialogTitle className="font-serif text-lg sm:text-xl font-medium text-foreground">
            Replace Active QR Sticker?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Please review the security and operational impact of retiring sticker {qrSticker?.visibleCode}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-xl border border-[#c64545]/30 bg-[#c64545]/5 p-3.5 space-y-2">
            <div className="font-mono text-xs font-bold text-[#c64545]">
              CRITICAL SECURITY CONSEQUENCE:
            </div>
            <p className="text-foreground leading-relaxed">
              Requesting a replacement sticker will permanently invalidate the current physical sticker ({qrSticker?.visibleCode}) attached to vehicle{" "}
              <strong>{vehicle?.registrationNumber}</strong>. Anyone scanning the retired sticker will receive a <em>Retired / Replaced</em> advisory notice.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3 text-muted-foreground space-y-1">
            <div className="font-mono text-[10px] uppercase text-foreground">Next Steps:</div>
            <p>1. A new tamper-evident QR sticker will be dispatched to your delivery address.</p>
            <p>2. Your emergency contacts and medical profiles will automatically carry over to the new sticker upon activation.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Keep Current Sticker
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#c64545] px-4 py-2 font-mono text-xs font-semibold text-white hover:bg-[#a93838]"
          >
            Confirm &amp; Proceed →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
