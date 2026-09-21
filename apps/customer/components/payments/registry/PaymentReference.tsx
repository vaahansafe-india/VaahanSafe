"use client";

import { useState } from "react";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";

interface PaymentReferenceProps {
  reference: string;
  copyValue?: string;
  label?: string;
}

export function PaymentReference({ reference, copyValue, label }: PaymentReferenceProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(copyValue || reference);
    setCopied(true);
    toast.success("Reference copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors group"
      title={`Copy reference: ${copyValue || reference}`}
    >
      {label && <span className="text-[10px] uppercase text-muted-foreground">{label}:</span>}
      <span className="font-semibold text-foreground">{reference}</span>
      <VaahanIcon
        name={copied ? "check" : "copy"}
        size={11}
        className={copied ? "text-[#5db8a6]" : "opacity-50 group-hover:opacity-100 text-[#cc785c]"}
      />
    </button>
  );
}
