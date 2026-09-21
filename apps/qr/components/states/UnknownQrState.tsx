import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getWebUrl } from "@vaahansafe/config";

export interface UnknownQrStateProps {
  publicId?: string;
}

export function UnknownQrState({ publicId }: UnknownQrStateProps) {
  const webUrl = getWebUrl();

  return (
    <div className="w-full p-6 rounded-2xl border border-border/80 bg-card text-center space-y-5 shadow-xs animate-in fade-in duration-300">
      <div className="mx-auto size-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
        <VaahanIcon name="error" size={24} />
      </div>

      <div className="space-y-1.5">
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider text-destructive border-destructive/30 uppercase px-2.5 py-0.5"
        >
          Not Recognized
        </Badge>
        <h1 className="text-xl font-serif font-medium text-foreground tracking-tight">
          QR Code Not Recognized
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          This identifier was not found in the authentic VaahanSafe registry.
          Please check the physical sticker or rescan the code.
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
          <span>Need Help? Contact VaahanSafe</span>
        </a>
      </div>

      {publicId && (
        <div className="border-t border-border/60 pt-3 text-[11px] font-mono text-muted-foreground">
          Lookup Reference: <span className="text-foreground">{publicId}</span>
        </div>
      )}
    </div>
  );
}
