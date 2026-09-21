import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getActivateUrl } from "@vaahansafe/config";

export interface ActivationAvailableProps {
  publicId: string;
  visibleCode?: string;
}

export function ActivationAvailable({ publicId, visibleCode }: ActivationAvailableProps) {
  const displayId = visibleCode || (publicId.startsWith("VS-") ? publicId : `VS-${publicId}`);
  const activateUrl = getActivateUrl(publicId);

  return (
    <div className="w-full p-6 rounded-2xl border border-border/80 bg-card text-center space-y-5 shadow-xs animate-in fade-in duration-300">
      <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
        <VaahanIcon name="qr" size={24} />
      </div>

      <div className="space-y-1.5">
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider text-primary border-primary/30 bg-primary/5 uppercase px-2.5 py-0.5"
        >
          Unactivated Retail Pass
        </Badge>
        <h1 className="text-xl font-serif font-medium text-foreground tracking-tight">
          Ready to Activate
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          This genuine VaahanSafe physical QR sticker has not yet been linked to a vehicle.
          If you purchased this pack, activate it online using your scratch secret.
        </p>
      </div>

      <div className="pt-2">
        <a
          href={activateUrl}
          className="min-h-[48px] px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs w-full"
        >
          <VaahanIcon name="qr-scan" size={16} />
          <span>Activate this QR</span>
        </a>
      </div>

      <div className="border-t border-border/60 pt-3 text-[11px] font-mono text-muted-foreground">
        VaahanSafe ID: <span className="font-semibold text-foreground">{displayId}</span>
      </div>
    </div>
  );
}
