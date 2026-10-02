import * as React from "react";
import { DOMAINS } from "@vaahansafe/config";

interface AuthLegalNoticeProps {
  type: "in-card" | "outside-card";
}

export function AuthLegalNotice({ type }: AuthLegalNoticeProps) {
  const termsUrl = `${DOMAINS.web || "https://vaahansafe.com"}/terms`;
  const privacyUrl = `${DOMAINS.web || "https://vaahansafe.com"}/privacy`;
  const helpUrl = `${DOMAINS.web || "https://vaahansafe.com"}/help`;

  if (type === "in-card") {
    return (
      <p className="text-xs leading-relaxed text-[#77736c]">
        By continuing, you agree to the VaahanSafe{" "}
        <a
          href={termsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#44413c] underline decoration-[#c9bfb4] underline-offset-2 hover:text-[#a9583e]"
        >
          Terms of Service
        </a>{" "}
        and acknowledge the{" "}
        <a
          href={privacyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#44413c] underline decoration-[#c9bfb4] underline-offset-2 hover:text-[#a9583e]"
        >
          Privacy Policy
        </a>
        .
      </p>
    );
  }

  return (
    <footer className="flex items-center justify-between gap-4 border-t border-[#e2dcd2] py-[clamp(12px,2vh,24px)] text-[11px] text-[#77736c]">
      <span>© VaahanSafe</span>
      <div className="flex items-center gap-4">
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#615f59] hover:text-[#a9583e]"
        >
          Help
        </a>
        <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#615f59] hover:text-[#a9583e]">
          Privacy
        </a>
      </div>
    </footer>
  );
}
