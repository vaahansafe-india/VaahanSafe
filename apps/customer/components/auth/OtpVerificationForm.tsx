"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface OtpVerificationFormProps {
  isLoading?: boolean;
  onVerifyOtp: (otp: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onChangeNumber: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 30;

export function OtpVerificationForm({
  isLoading = false,
  onVerifyOtp,
  onResendOtp,
  onChangeNumber,
  errorMessage,
  onClearError,
}: OtpVerificationFormProps) {
  const [digits, setDigits] = React.useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [cooldown, setCooldown] = React.useState(COOLDOWN_SECONDS);
  const [isResending, setIsResending] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus the first empty input on mount
  React.useEffect(() => {
    const firstEmpty = digits.findIndex((d) => !d);
    const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
    inputRefs.current[targetIdx]?.focus();
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMessage && onClearError) {
      onClearError();
    }

    const val = e.target.value.replace(/\D/g, "");
    if (!val) {
      // Clear current digit
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    // Handle single digit or multiple digits (typing quickly)
    const nextDigits = [...digits];
    const incomingChars = val.split("");
    for (let i = 0; i < incomingChars.length && index + i < OTP_LENGTH; i++) {
      const char = incomingChars[i];
      if (char !== undefined) {
        nextDigits[index + i] = char;
      }
    }
    setDigits(nextDigits);

    // Auto-advance focus
    const nextIndex = Math.min(index + incomingChars.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();

    // If all digits filled, auto-submit
    if (nextDigits.every((d) => d !== "") && nextDigits.length === OTP_LENGTH) {
      onVerifyOtp(nextDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous and clear
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        setDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (errorMessage && onClearError) {
      onClearError();
    }

    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      const char = pastedData[i];
      if (char !== undefined) {
        nextDigits[i] = char;
      }
    }
    setDigits(nextDigits);

    const focusIdx = Math.min(pastedData.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pastedData.length === OTP_LENGTH) {
      onVerifyOtp(pastedData);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join("");
    if (otpCode.length === OTP_LENGTH) {
      onVerifyOtp(otpCode);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResendOtp();
      setCooldown(COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = digits.every((d) => d.length === 1);

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      {/* Visual Instruction Label */}
      <div className="mb-4 flex items-center justify-between">
        <label
          htmlFor="otp-digit-0"
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          6-Digit verification code
        </label>
        <button
          type="button"
          onClick={onChangeNumber}
          className="font-mono text-[9px] uppercase tracking-wider text-[#cc785c] hover:underline"
        >
          Change number
        </button>
      </div>

      {/* 01. Six Individual Digit Input Boxes */}
      <div
        className="flex items-center justify-between gap-1.5 sm:gap-2"
        role="group"
        aria-labelledby="otp-group-label"
      >
        <span id="otp-group-label" className="sr-only">
          Enter 6 digit verification code
        </span>
        {digits.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            id={`otp-digit-${idx}`}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? "one-time-code" : "off"}
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            aria-label={`Digit ${idx + 1} of 6`}
            aria-invalid={Boolean(errorMessage)}
            className={`
              h-11 w-10 sm:h-11 sm:w-11 text-center
              rounded-lg border bg-background
              font-mono text-xl font-bold text-foreground
              shadow-2xs transition-all duration-150
              focus:outline-none focus:ring-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                errorMessage
                  ? "border-[#c64545] focus:border-[#c64545] focus:ring-[#c64545]/25"
                  : digit
                    ? "border-[#cc785c] focus:border-[#cc785c] focus:ring-[#cc785c]/30"
                    : "border-border focus:border-[#cc785c] focus:ring-[#cc785c]/30"
              }
            `}
          />
        ))}
      </div>

      {/* Inline Error State */}
      {errorMessage && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-3 flex items-center gap-1.5 text-xs text-[#c64545]"
        >
          <VaahanIcon name="error" size={13} className="shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* 02. Verify Action Button */}
      <div className="mt-3.5">
        <button
          type="submit"
          disabled={isLoading || !isComplete}
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
              <span>Verifying code...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
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

      {/* 03. Resend Code & Cooldown */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Didn&apos;t receive code?</span>
        {cooldown > 0 ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            Resend in 0:{cooldown < 10 ? `0${cooldown}` : cooldown}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isLoading}
            className="font-mono text-xs font-medium text-[#cc785c] hover:underline focus:outline-none disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>
    </form>
  );
}
