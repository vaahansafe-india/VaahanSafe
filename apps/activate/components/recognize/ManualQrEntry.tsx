"use client";

import React, { useState } from "react";
import { Input, Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface ManualQrEntryProps {
  initialValue?: string;
  onSubmit: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function ManualQrEntry({ initialValue = "", onSubmit, isLoading }: ManualQrEntryProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter the QR identifier printed on your sticker.");
      return;
    }
    setError(null);
    await onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="qr-public-id"
          className="block text-xs font-mono font-medium text-foreground tracking-wide uppercase"
        >
          VaahanSafe QR Identifier
        </label>
        <div className="relative">
          <Input
            id="qr-public-id"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. VS-7F3K-9021 or vs_99a8b7c6d5e4"
            disabled={isLoading}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="font-mono text-sm tracking-wider uppercase h-12 px-4 rounded-xl border-border bg-background focus-visible:ring-primary"
          />
          {value && !isLoading && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              aria-label="Clear input"
            >
              <VaahanIcon name="close" size={14} />
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
            <VaahanIcon name="alert" size={13} />
            <span>{error}</span>
          </p>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Printed on the lower-left corner of your physical sticker or packaging card.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>Recognizing QR...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Continue to Possession Verification</span>
            <VaahanIcon name="arrow-right" size={15} />
          </div>
        )}
      </Button>
    </form>
  );
}
