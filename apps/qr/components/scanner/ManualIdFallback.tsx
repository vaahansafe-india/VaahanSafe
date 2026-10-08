"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { parseVaahanSafeQrPayload } from "@vaahansafe/qr-core/scanner";

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
      setError(
        "Enter the VaahanSafe ID printed on the sticker, or its QR link.",
      );
      return;
    }

    setError(null);
    if (onClose) onClose();
    router.push(`/${encodeURIComponent(result.publicId)}`);
  }

  return (
    <div className="w-full p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
      <div className="space-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
          Sticker lookup
        </span>
        <h3 className="font-serif text-lg font-medium text-foreground tracking-tight">
          Enter VaahanSafe ID
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Type the visible identifier printed beneath the QR code on the vehicle
          pass.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="scanner-id" className="text-sm font-medium">
            VaahanSafe ID or QR link
          </label>
          <input
            id="scanner-id"
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="ID printed on your sticker"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "scanner-id-error" : undefined}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-background font-mono text-sm uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
            autoComplete="off"
            spellCheck={false}
          />
          {error && (
            <p
              id="scanner-id-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
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
