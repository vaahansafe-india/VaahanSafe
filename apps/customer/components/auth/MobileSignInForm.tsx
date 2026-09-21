"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface MobileSignInFormProps {
  isLoading?: boolean;
  onSubmitMobile: (phone: string) => Promise<void>;
  errorMessage?: string | null;
  onClearError?: () => void;
  showDivider?: boolean;
}

export function MobileSignInForm({
  isLoading = false,
  onSubmitMobile,
  errorMessage,
  onClearError,
  showDivider = true,
}: MobileSignInFormProps) {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Format phone display with clean spacing: 98765 43210
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMessage && onClearError) {
      onClearError();
    }
    if (localError) {
      setLocalError(null);
    }

    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(raw);
  };

  const formattedDisplay = React.useMemo(() => {
    if (phoneNumber.length > 5) {
      return `${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
    }
    return phoneNumber;
  }, [phoneNumber]);

  const isValidPhone = phoneNumber.length === 10 && /^[6-9]/.test(phoneNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) {
      setLocalError("We couldn't use that mobile number. Check it and try again.");
      return;
    }
    setLocalError(null);
    await onSubmitMobile(`+91${phoneNumber}`);
  };

  const activeError = errorMessage || localError;

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      {/* 01. Restrained Divider */}
      {showDivider && (
        <div className="relative my-3 sm:my-3.5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative bg-card px-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              Or
            </span>
          </div>
        </div>
      )}

      {/* 02. Field Label */}
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor="mobile-number-input"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-foreground"
        >
          Mobile number
        </label>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          SMS / WhatsApp OTP
        </span>
      </div>

      {/* 03. Unified Input Container with +91 country prefix */}
      <div
        className={`
          group relative flex h-11 w-full items-center
          rounded-lg border bg-background transition-all duration-200
          ${
            activeError
              ? "border-[#c64545] ring-2 ring-[#c64545]/20"
              : "border-border focus-within:border-[#cc785c] focus-within:ring-2 focus-within:ring-[#cc785c]/30"
          }
        `}
      >
        {/* Distinguishable +91 Country Badge */}
        <div className="flex h-full items-center gap-1.5 pl-3.5 pr-2.5 text-sm font-medium text-foreground select-none">
          <span className="font-mono text-xs tracking-wider text-muted-foreground">
            IN
          </span>
          <span className="font-mono text-[13px] font-semibold text-foreground">
            +91
          </span>
        </div>

        {/* Subtle Vertical Inset Hairline */}
        <div className="h-5 w-px bg-border" aria-hidden="true" />

        {/* Numeric Mobile Input */}
        <input
          id="mobile-number-input"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={formattedDisplay}
          onChange={handlePhoneChange}
          disabled={isLoading}
          placeholder="98765 43210"
          aria-invalid={Boolean(activeError)}
          aria-describedby={activeError ? "mobile-error-message" : undefined}
          className="
            h-full w-full bg-transparent px-3
            font-mono text-[15px] font-medium tracking-wide text-foreground
            placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground
            focus:outline-none
            disabled:cursor-not-allowed disabled:opacity-50
          "
        />

        {/* Clear / valid checkmark badge */}
        {isValidPhone && !activeError && (
          <div className="pr-3 text-[#5db872]" aria-hidden="true">
            <VaahanIcon name="check" size={16} />
          </div>
        )}
      </div>

      {/* Inline Error Message */}
      {activeError && (
        <p
          id="mobile-error-message"
          role="alert"
          aria-live="polite"
          className="mt-2 flex items-center gap-1.5 text-xs text-[#c64545]"
        >
          <VaahanIcon name="error" size={13} className="shrink-0" aria-hidden="true" />
          <span>{activeError}</span>
        </p>
      )}

      {/* 04. Primary Action Button */}
      <div className="mt-3">
        <button
          type="submit"
          disabled={isLoading || phoneNumber.length < 10}
          aria-busy={isLoading}
          className="
            group flex h-11 w-full items-center justify-center gap-2
            rounded-lg bg-[#cc785c] px-4
            font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white
            shadow-xs transition-all duration-200
            hover:bg-[#a9583e] hover:shadow-sm
            active:scale-[0.99]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]/45 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Sending code...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <VaahanIcon
                name="arrow-right"
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
