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
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
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
    <footer className="mt-4 sm:mt-5 flex flex-col items-center gap-2 text-center">
      {/* Subtle brand identifier */}
      <div className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground">
        VAAHANSAFE / VEHICLE SAFETY IDENTITY
      </div>

      {/* External reference links */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#cc785c]"
        >
          Help
        </a>
        <span className="text-border">•</span>
        <a
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#cc785c]"
        >
          Privacy
        </a>
        <span className="text-border">•</span>
        <a
          href={termsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#cc785c]"
        >
          Terms
        </a>
      </div>

      {/* Return to marketing website */}
      <a
        href={webUrl}
        className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-[#cc785c]"
      >
        <VaahanIcon name="arrow-left" size={11} aria-hidden="true" />
        <span>Back to VaahanSafe</span>
      </a>
    </footer>
  );
}
