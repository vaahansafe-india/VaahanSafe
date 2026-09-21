"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { parseVaahanSafeQrPayload } from "@vaahansafe/qr-core/client";

interface ManualIdFallbackProps {
  onClose?: () => void;
}

export function ManualIdFallback({ onClose }: ManualIdFallbackProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = parseVaahanSafeQrPayload(inputValue);

    if (!result.valid || !result.publicId) {
      setError("Please enter a valid VaahanSafe ID (e.g. VS-7F3K-9021 or 7F3K9021)");
      return;
    }

    setError(null);
    if (onClose) onClose();
    router.push(`/${result.publicId}`);
  }

  return (
    <div className="w-full p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
      <div className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
          Direct Alphanumeric Resolution
        </span>
        <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
          Enter VaahanSafe ID
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Type the visible identifier printed beneath the QR code on the vehicle pass.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. VS-7F3K-9021 or 7F3K9021"
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background font-mono text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all shadow-xs cursor-pointer"
        >
          <span>Resolve Safety Identity</span>
          <VaahanIcon name="arrow-right" size={14} />
        </button>
      </form>
    </div>
  );
}
