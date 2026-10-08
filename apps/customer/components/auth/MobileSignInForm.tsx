"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { AuthLoader } from "./AuthLoader";
import { useOtpAvailability } from "@vaahansafe/ui/lib/use-otp-availability";

export type LoginOtpChannel = "WHATSAPP" | "SMS";

interface MobileSignInFormProps {
  isLoading?: boolean;
  onSubmitMobile: (phone: string, channel: LoginOtpChannel) => Promise<void>;
  errorMessage?: string | null;
  onClearError?: () => void;
  showDivider?: boolean;
}

function WhatsAppIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

export function MobileSignInForm({
  isLoading = false,
  onSubmitMobile,
  errorMessage,
  onClearError,
  showDivider = true,
}: MobileSignInFormProps) {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [channel, setChannel] = React.useState<LoginOtpChannel>("WHATSAPP");
  const availability = useOtpAvailability("/api/auth/send-otp");
  React.useEffect(() => {
    if (!availability.channels[channel]) {
      setChannel(availability.channels.WHATSAPP ? "WHATSAPP" : availability.channels.SMS ? "SMS" : "WHATSAPP");
    }
  }, [availability.channels, channel]);
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
    await onSubmitMobile(`+91${phoneNumber}`, channel);
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
              Or continue with mobile
            </span>
          </div>
        </div>
      )}

      {/* 02. Field Label & Channel Switcher */}
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="mobile-number-input"
          className="text-sm font-semibold text-[#1b1c1a]"
        >
          Mobile number
        </label>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#77736c]">
          {channel === "WHATSAPP" ? "WhatsApp OTP" : "SMS OTP"}
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

      {/* 04. Modern Delivery Channel Selector */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-[#77736c] mb-1.5">
          <span>Deliver verification code via</span>
        </div>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="OTP delivery channel">
          <button
            type="button"
            role="radio"
            aria-checked={channel === "WHATSAPP"}
            disabled={isLoading || !availability.channels.WHATSAPP}
            onClick={() => {
              setChannel("WHATSAPP");
              onClearError?.();
            }}
            className={`
              flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-medium transition-all
              ${
                channel === "WHATSAPP"
                  ? "border-[#25d366] bg-[#25d366]/10 text-[#0f6b31] font-semibold ring-1 ring-[#25d366]/30"
                  : "border-[#e2dcd2] bg-white text-[#615f59] hover:border-[#cfc6ba] hover:bg-[#faf9f5]"
              }
            `}
          >
            <WhatsAppIcon size={14} className={channel === "WHATSAPP" ? "text-[#0f6b31]" : "text-[#77736c]"} />
            <span>WhatsApp</span>
            <span className="rounded bg-[#f0ede6] px-1 py-0.2 text-[9px] font-medium uppercase text-[#77736c]">
              {availability.channels.WHATSAPP ? "Available" : "Unavailable"}
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={channel === "SMS"}
            disabled={isLoading || !availability.channels.SMS}
            onClick={() => {
              setChannel("SMS");
              onClearError?.();
            }}
            className={`
              flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] border text-xs font-medium transition-all
              ${
                channel === "SMS"
                  ? "border-[#a9583e] bg-[#cc785c]/10 text-[#8c3e25] font-semibold ring-1 ring-[#cc785c]/30"
                  : "border-[#e2dcd2] bg-white text-[#615f59] hover:border-[#cfc6ba] hover:bg-[#faf9f5]"
              }
            `}
          >
            <VaahanIcon name="sms" size={14} className={channel === "SMS" ? "text-[#8c3e25]" : "text-[#77736c]"} />
            <span>SMS Message</span>
          </button>
        </div>
      </div>

      <p role="status" className="mt-3 text-xs leading-relaxed text-[#77736c]">
        {availability.loading ? "Checking verification methods…" : availability.anyAvailable
          ? "Your verification code expires in five minutes. Never share it with anyone."
          : "Mobile verification is temporarily unavailable. Please try again later."}
        {!availability.loading && !availability.anyAvailable && (
          <button type="button" onClick={() => void availability.refresh()} className="ml-2 underline underline-offset-4">Check again</button>
        )}
      </p>

      {/* Inline Error Message */}
      {activeError && (
        <p
          id="mobile-error-message"
          role="alert"
          aria-live="polite"
          className="mt-2.5 flex items-center gap-1.5 text-xs text-[#c64545]"
        >
          <VaahanIcon name="error" size={13} className="shrink-0" aria-hidden="true" />
          <span>{activeError}</span>
        </p>
      )}

      {/* 05. Primary Action Button */}
      <div className="mt-4">
        <button
          type="submit"
          disabled={isLoading || phoneNumber.length < 10 || availability.loading || !availability.channels[channel]}
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
