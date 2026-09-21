import React from "react";
import { getStatusUrl, getWebUrl } from "@vaahansafe/config";

export function ResolverFooter() {
  const statusUrl = getStatusUrl();
  const webUrl = getWebUrl();

  return (
    <footer className="w-full pt-8 pb-4 border-t border-border/60 mt-10 space-y-4">
      {/* Safety Notice (Rule 25, 72) */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground/90 mb-0.5">Emergency Notice</p>
        <p>
          VaahanSafe provides an emergency vehicle safety identification and contact relay.
          It does not replace official emergency response, police, or hospital services (112 / 108).
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-muted-foreground font-mono">
        <span>&copy; {new Date().getFullYear()} VaahanSafe</span>
        <div className="flex items-center gap-3">
          <a
            href={`${webUrl}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <span>&bull;</span>
          <a
            href={statusUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            System Status
          </a>
          <span>&bull;</span>
          <a
            href={`${webUrl}/help`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
