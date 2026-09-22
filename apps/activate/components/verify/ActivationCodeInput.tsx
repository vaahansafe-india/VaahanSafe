"use client";

import React, { useState } from "react";
import { Input } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface ActivationCodeInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function ActivationCodeInput({
  value,
  onChange,
  disabled = false,
  error,
}: ActivationCodeInputProps) {
  const [showSecret, setShowSecret] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    onChange(cleaned);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="scratch-code-input"
          className="text-xs font-mono font-medium text-foreground uppercase tracking-wider"
        >
          Activation Proof
        </label>
        <button
          type="button"
          onClick={() => setShowSecret((prev) => !prev)}
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          tabIndex={-1}
        >
          <VaahanIcon name={showSecret ? "eye-off" : "eye"} size={13} />
          <span>{showSecret ? "Hide" : "Show"}</span>
        </button>
      </div>

      <div className="relative">
        <Input
          id="scratch-code-input"
          type={showSecret ? "text" : "password"}
          value={value}
          onChange={handleInputChange}
          placeholder="•••• ••••"
          disabled={disabled}
          maxLength={12}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-13 px-4 font-mono text-base sm:text-lg tracking-[0.3em] uppercase text-center rounded-lg border-border bg-background focus-visible:ring-[#cc785c]"
        />
      </div>

      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1.5 font-medium pt-0.5">
          <VaahanIcon name="alert" size={13} />
          <span>{error}</span>
        </p>
      ) : (
        <p className="text-[11px] font-mono text-muted-foreground pt-0.5">
          This code verifies possession of the physical QR.
        </p>
      )}
    </div>
  );
}
