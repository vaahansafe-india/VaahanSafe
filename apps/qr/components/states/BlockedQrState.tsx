import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getWebUrl } from "@vaahansafe/config";

export interface BlockedQrStateProps {
  publicId: string;
}

export function BlockedQrState({ publicId }: BlockedQrStateProps) {
  const webUrl = getWebUrl();

  return (
    <div className="w-full p-6 rounded-2xl border border-border/80 bg-card text-center space-y-5 shadow-xs animate-in fade-in duration-300">
      <div className="mx-auto size-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
        <VaahanIcon name="alert" size={24} />
      </div>

      <div className="space-y-1.5">
        <Badge
          variant="destructive"
          className="font-mono text-[10px] tracking-wider uppercase px-2.5 py-0.5"
        >
          Identity Unavailable
        </Badge>
        <h1 className="text-xl font-serif font-medium text-foreground tracking-tight">
          QR Service Inactive
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          We are unable to display safety records for this QR code at this time.
        </p>
      </div>

      <div className="pt-2">
        <a
          href={`${webUrl}/help`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-border w-full"
        >
          <VaahanIcon name="help" size={15} />
          <span>Contact VaahanSafe Help</span>
        </a>
      </div>

      <div className="border-t border-border/60 pt-3 text-[11px] font-mono text-muted-foreground">
        Reference ID: <span className="text-foreground">{publicId}</span>
      </div>
    </div>
  );
}
