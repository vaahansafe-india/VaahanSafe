import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getQrUrl } from "@vaahansafe/config";

export interface ReplacedQrStateProps {
  publicId: string;
  replacedByPublicId?: string;
}

export function ReplacedQrState({ publicId, replacedByPublicId }: ReplacedQrStateProps) {
  return (
    <div className="w-full p-6 rounded-2xl border border-border/80 bg-card text-center space-y-5 shadow-xs animate-in fade-in duration-300">
      <div className="mx-auto size-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
        <VaahanIcon name="warning" size={24} />
      </div>

      <div className="space-y-1.5">
        <Badge
          variant="outline"
          className="font-mono text-[10px] tracking-wider text-amber-700 dark:text-amber-400 border-amber-600/30 bg-amber-500/5 uppercase px-2.5 py-0.5"
        >
          Replaced Identity
        </Badge>
        <h1 className="text-xl font-serif font-medium text-foreground tracking-tight">
          QR Sticker Replaced
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
          This physical QR code is no longer the active safety identity for this vehicle.
          Please scan the newly affixed replacement sticker on the vehicle.
        </p>
      </div>

      {replacedByPublicId && (
        <div className="pt-2">
          <a
            href={getQrUrl(replacedByPublicId)}
            className="min-h-[44px] px-5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-border"
          >
            <span>Go to Replacement Identity</span>
            <VaahanIcon name="external-link" size={14} />
          </a>
        </div>
      )}

      <div className="border-t border-border/60 pt-3 text-[11px] font-mono text-muted-foreground">
        Retired Code: <span className="text-foreground">{publicId}</span>
      </div>
    </div>
  );
}
