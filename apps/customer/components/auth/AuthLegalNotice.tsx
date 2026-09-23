import * as React from "react";
import { DOMAINS } from "@vaahansafe/config";
import { VaahanIcon } from "@vaahansafe/icons";

interface AuthLegalNoticeProps {
  type: "in-card" | "outside-card";
}

export function AuthLegalNotice({ type }: AuthLegalNoticeProps) {
  const webUrl = DOMAINS.web || "https://vaahansafe.com";
  const termsUrl = `${webUrl}/terms`;
  const privacyUrl = `${webUrl}/privacy`;
  const helpUrl = `${webUrl}/how-it-works`;

  if (type === "in-card") {
    return (
      <p className="text-center text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
        By continuing, you agree to the VaahanSafe{" "}
        <a
          href={termsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-border underline-offset-2 hover:text-[#cc785c]"
        >
          Terms of Service
        </a>{" "}
        and acknowledge the{" "}
        <a
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-border underline-offset-2 hover:text-[#cc785c]"
        >
          Privacy Policy
        </a>
        .
      </p>
    );
  }

  return (
    <footer className="mt-3.5 sm:mt-5 flex flex-col items-center gap-1.5 sm:gap-2 text-center select-none">
      {/* Subtle brand identifier */}
      <div className="font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.22em] text-muted-foreground/80">
        VAAHANSAFE / VEHICLE SAFETY IDENTITY
      </div>

      {/* External reference navigation */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <a
          href={webUrl}
          className="inline-flex items-center gap-1.5 font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          <VaahanIcon name="arrow-left" size={11} aria-hidden="true" />
          <span>Back to VaahanSafe</span>
        </a>
        <span className="text-border">•</span>
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          Help
        </a>
      </div>
    </footer>
  );
}
