import React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

export function ResolverHeader() {
  return (
    <header className="w-full flex items-center justify-between pb-6 border-b border-border/60">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
          <VaahanIcon name="shield" size={18} />
        </div>
        <div>
          <span className="font-serif text-base font-semibold tracking-tight text-foreground block leading-tight">
            VAAHANSAFE
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
            Vehicle Safety Identity
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px] tracking-wider text-muted-foreground border-border px-2 py-0.5">
          Public Resolver
        </Badge>
        <a
          href="https://vaahansafe.com/help"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted/50 inline-flex items-center gap-1"
          aria-label="VaahanSafe Safety & Help Support"
        >
          <VaahanIcon name="help" size={15} />
        </a>
      </div>
    </header>
  );
}
