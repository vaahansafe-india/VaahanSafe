"use client";

import React, { useState } from "react";
import { Input } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  isActivationProofInput,
  MAX_ACTIVATION_PROOF_INPUT_LENGTH,
} from "@/lib/activation-proof-input";

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
    onChange(e.target.value.toUpperCase());
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
          disabled={disabled}
          aria-controls="scratch-code-input"
          aria-label={
            showSecret ? "Hide activation code" : "Show activation code"
          }
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
          placeholder="Enter the complete printed code"
          disabled={disabled}
          maxLength={MAX_ACTIVATION_PROOF_INPUT_LENGTH}
          aria-invalid={!!error || (!!value && !isActivationProofInput(value))}
          aria-describedby="scratch-code-help"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-13 min-w-0 w-full px-3 sm:px-4 font-mono text-sm sm:text-lg tracking-[0.05em] sm:tracking-[0.15em] uppercase text-center rounded-sm border-border bg-background focus-visible:ring-[#cc785c]"
        />
      </div>

      {error ? (
        <p
          id="scratch-code-help"
          role="alert"
          className="text-xs text-destructive flex items-center gap-1.5 font-medium pt-0.5"
        >
          <VaahanIcon name="alert" size={13} />
          <span>{error}</span>
        </p>
      ) : (
        <p
          id="scratch-code-help"
          className="text-[11px] font-mono text-muted-foreground pt-0.5"
        >
          {value && !isActivationProofInput(value)
            ? "Enter the complete printed letters and numbers. Spaces and hyphens are accepted."
            : "Use the full private activation code printed under the scratch panel. Hyphens and spaces are optional."}
        </p>
      )}
    </div>
  );
}
