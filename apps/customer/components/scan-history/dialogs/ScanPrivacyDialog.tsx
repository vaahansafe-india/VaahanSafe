"use client";

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

interface ScanPrivacyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScanPrivacyDialog({ isOpen, onClose }: ScanPrivacyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border-border bg-card p-6 shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-wider">
            <VaahanIcon name="shield" size={14} />
            <span>Architectural Guarantee</span>
          </div>
          <DialogTitle className="font-serif text-2xl font-medium text-foreground">
            Privacy &amp; Telemetry Policy
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            VaahanSafe is built as an emergency safety identity platform, not a surveillance mechanism.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 pt-2 text-xs">
          {/* Guarantee 1: Zero GPS tracking */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-background/50">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <VaahanIcon name="location" size={14} />
            </span>
            <div>
              <div className="font-semibold text-foreground">
                No Precise GPS or Location Tracking
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                We never request, track, or record the scanner&apos;s physical GPS coordinates. Any geographic metadata shown is coarse edge-network region only.
              </p>
            </div>
          </div>

          {/* Guarantee 2: Zero raw IP storage */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-background/50">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <VaahanIcon name="lock" size={14} />
            </span>
            <div>
              <div className="font-semibold text-foreground">
                No Raw IP or Device Fingerprints
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Passerby scanner IP addresses, canvas fingerprints, and private identifiers are never stored or exposed in scan history.
              </p>
            </div>
          </div>

          {/* Guarantee 3: Masked Emergency Relay */}
          <div className="flex items-start gap-3 p-3 rounded-xl border border-border/70 bg-background/50">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <VaahanIcon name="phone" size={14} />
            </span>
            <div>
              <div className="font-semibold text-foreground">
                Privacy-Preserving Contact Relay
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Emergency calls are relayed through secure routing. The scanning finder never sees the owner&apos;s personal mobile number.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
