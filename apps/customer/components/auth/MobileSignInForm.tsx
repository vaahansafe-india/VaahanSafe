"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { AuthLoader } from "./AuthLoader";

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
        <div className="relative my-[clamp(12px,2vh,28px)] flex items-center justify-center">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#e2dcd2]" />
          </div>
          <div className="relative bg-[#faf9f5] px-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#77736c]">
              Or
            </span>
          </div>
        </div>
      )}

      {/* 02. Field Label */}
      <div className="mb-2.5 flex items-center justify-between">
        <label
          htmlFor="mobile-number-input"
          className="text-sm font-semibold text-[#1b1c1a]"
        >
          Mobile number
        </label>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#77736c]">
          SMS code
        </span>
      </div>

      {/* 03. Unified Input Container with +91 country prefix */}
      <div
        className={`
          group relative flex h-12 w-full items-center
          rounded-[3px] border bg-white transition-colors
          ${
            activeError
              ? "border-[#c64545] ring-2 ring-[#c64545]/20"
              : "border-[#d8d0c5] focus-within:border-[#a9583e] focus-within:ring-2 focus-within:ring-[#cc785c]/20"
          }
        `}
      >
        {/* Distinguishable +91 Country Badge */}
        <div className="flex h-full items-center gap-1.5 pl-3.5 pr-2.5 text-sm font-medium text-[#1b1c1a] select-none">
          <span className="font-mono text-xs tracking-wider text-[#77736c]">
            IN
          </span>
          <span className="font-mono text-[13px] font-semibold text-[#1b1c1a]">
            +91
          </span>
        </div>

        {/* Subtle Vertical Inset Hairline */}
        <div className="h-5 w-px bg-[#e2dcd2]" aria-hidden="true" />

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
          style={{ WebkitTextFillColor: "#1b1c1a" }}
          className="h-full min-w-0 w-full bg-transparent px-3 font-mono text-base font-medium tracking-wide text-[#1b1c1a] placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-[#9a968e] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="mt-4">
        <button
          type="submit"
          disabled={isLoading || phoneNumber.length < 10}
          aria-busy={isLoading}
          className="
            group flex h-12 w-full items-center justify-center gap-2
            rounded-[3px] bg-[#252320] px-4
            text-sm font-semibold text-[#faf9f5]
            transition-colors duration-200
            hover:bg-[#3a3833]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]/45 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {isLoading ? (
            <>
              <AuthLoader />
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
