"use client";

import * as React from "react";
import { AuthLoader } from "./AuthLoader";
import { VaahanIcon } from "@vaahansafe/icons";
import { useOtpAvailability } from "@vaahansafe/ui/lib/use-otp-availability";

export const OTP_LENGTH = 6;

interface OtpVerificationFormProps {
  isLoading?: boolean;
  channel?: "WHATSAPP" | "SMS";
  maskedPhone?: string;
  onVerifyOtp: (otp: string) => Promise<void>;
  onResendOtp: (channel?: "WHATSAPP" | "SMS") => Promise<void>;
  onChangeNumber: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

function WhatsAppIcon({ size = 15, className }: { size?: number; className?: string }) {
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

export function OtpVerificationForm({
  isLoading = false,
  channel = "WHATSAPP",
  maskedPhone,
  onVerifyOtp,
  onResendOtp,
  onChangeNumber,
  errorMessage,
  onClearError,
}: OtpVerificationFormProps) {
  const availability = useOtpAvailability("/api/auth/send-otp");
  const [code, setCode] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(30);
  const [resending, setResending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const submitting = React.useRef(false);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== OTP_LENGTH || isLoading || submitting.current) return;
    submitting.current = true;
    try {
      await onVerifyOtp(code);
    } finally {
      submitting.current = false;
    }
  }

  async function resend(targetChannel?: "WHATSAPP" | "SMS") {
    if (cooldown > 0 || resending || isLoading) return;
    setResending(true);
    try {
      await onResendOtp(targetChannel);
      setCode("");
      setCooldown(30);
      inputRef.current?.focus();
    } catch {
      // The parent displays the recoverable provider error.
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full">
      {/* Channel Delivery Header Banner */}
      <div className="mb-3.5 flex items-center justify-between rounded-[3px] border border-[#e2dcd2] bg-[#f5f2ea] px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          {channel === "WHATSAPP" ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25d366]/20 text-[#0f6b31]">
                <WhatsAppIcon size={12} />
              </span>
              <span className="text-[#1b1c1a]">
                Code sent via <strong>WhatsApp</strong> {maskedPhone ? `to ${maskedPhone}` : ""}
              </span>
            </>
          ) : (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#cc785c]/20 text-[#8c3e25]">
                <VaahanIcon name="sms" size={12} />
              </span>
              <span className="text-[#1b1c1a]">
                Code sent via <strong>SMS</strong> {maskedPhone ? `to ${maskedPhone}` : ""}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onChangeNumber}
          disabled={isLoading || resending}
          className="text-xs font-semibold text-[#a9583e] underline-offset-4 hover:underline disabled:opacity-50"
        >
          Change number
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor="verification-code" className="text-sm font-semibold text-[#1b1c1a]">
          Verification code
        </label>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#77736c]">
          6 digits
        </span>
      </div>

      <div className="relative">
        {/* One native input supports SMS autofill, paste and normal cursor editing */}
        <input
          ref={inputRef}
          id="verification-code"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={OTP_LENGTH}
          pattern="[0-9]{6}"
          value={code}
          disabled={isLoading || resending}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
            onClearError?.();
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "otp-error" : "otp-hint"}
          className="absolute inset-0 z-10 h-full w-full cursor-text text-base opacity-0 disabled:cursor-wait"
        />
        <div aria-hidden="true" className="grid grid-cols-6 gap-2">
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <span
              key={index}
              className={`flex h-12 min-w-0 items-center justify-center rounded-[3px] border bg-white font-mono text-2xl font-semibold text-[#1b1c1a] sm:h-14 ${
                errorMessage
                  ? "border-[#c64545]"
                  : focused && index === Math.min(code.length, OTP_LENGTH - 1)
                  ? "border-[#a9583e] ring-2 ring-[#cc785c]/20"
                  : code[index]
                  ? "border-[#cc785c]"
                  : "border-[#d8d0c5]"
              }`}
            >
              {code[index] || ""}
            </span>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p id="otp-error" role="alert" className="mt-3 text-xs leading-relaxed text-[#b13c3c]">
          {errorMessage}
        </p>
      ) : (
        <p id="otp-hint" className="mt-3 text-xs text-[#77736c]">
          {channel === "WHATSAPP"
            ? "Enter the code sent from VaahanSafe on WhatsApp."
            : "Enter the code sent via SMS."}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading || resending || code.length !== OTP_LENGTH}
        aria-busy={isLoading}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#252320] text-sm font-semibold text-[#faf9f5] hover:bg-[#3a3833] focus-visible:ring-2 focus-visible:ring-[#cc785c] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <AuthLoader />
            <span>Verifying…</span>
          </>
        ) : (
          <span>Verify & Continue →</span>
        )}
      </button>

      {/* Resend actions supporting both channels */}
      <div className="mt-4 flex flex-col gap-2 rounded-[3px] border border-[#e2dcd2] bg-white p-2.5 text-xs text-[#615f59]">
        <div className="flex items-center justify-between">
          <span>Didn&apos;t receive a code?</span>
          {cooldown > 0 ? (
            <span className="font-mono text-[#77736c]">
              Resend in 0:{String(cooldown).padStart(2, "0")}
            </span>
          ) : (
            <span className="text-[#a9583e] font-semibold">Resend options:</span>
          )}
        </div>

        {cooldown === 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-[#f0ede6]">
            <button
              type="button"
              onClick={() => resend("WHATSAPP")}
              disabled={resending || isLoading || !availability.channels.WHATSAPP}
              className="flex items-center gap-1.5 rounded-[3px] bg-[#25d366]/10 px-2 py-1 text-[#0f6b31] font-medium hover:bg-[#25d366]/20 disabled:opacity-50"
            >
              <WhatsAppIcon size={12} />
              <span>Resend via WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => resend("SMS")}
              disabled={resending || isLoading || !availability.channels.SMS}
              className="flex items-center gap-1.5 rounded-[3px] bg-[#cc785c]/10 px-2 py-1 text-[#8c3e25] font-medium hover:bg-[#cc785c]/20 disabled:opacity-50"
            >
              <VaahanIcon name="sms" size={12} />
              <span>Resend code via SMS</span>
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
