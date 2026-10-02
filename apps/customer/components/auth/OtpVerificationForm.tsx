"use client";

import * as React from "react";
import { AuthLoader } from "./AuthLoader";

interface OtpVerificationFormProps {
  isLoading?: boolean;
  onVerifyOtp: (otp: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onChangeNumber: () => void;
  errorMessage?: string | null;
  onClearError?: () => void;
}

export function OtpVerificationForm({ isLoading = false, onVerifyOtp, onResendOtp, onChangeNumber, errorMessage, onClearError }: OtpVerificationFormProps) {
  const [code, setCode] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(30);
  const [resending, setResending] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const submitting = React.useRef(false);
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || isLoading || submitting.current) return;
    submitting.current = true;
    try { await onVerifyOtp(code); } finally { submitting.current = false; }
  }

  async function resend() {
    if (cooldown || resending || isLoading) return;
    setResending(true);
    try {
      await onResendOtp();
      setCode(""); setCooldown(30); inputRef.current?.focus();
    } catch {
      // The parent displays the recoverable provider error.
    } finally { setResending(false); }
  }

  return <form onSubmit={submit} className="w-full">
    <div className="mb-3 flex items-center justify-between gap-2">
      <label htmlFor="verification-code" className="text-sm font-semibold text-[#1b1c1a]">Verification code</label>
      <button type="button" onClick={onChangeNumber} disabled={isLoading || resending} className="text-xs text-[#a9583e] underline-offset-4 hover:underline disabled:opacity-50">Change number</button>
    </div>
    <div className="relative">
      {/* One native input supports SMS autofill, paste and normal cursor editing. */}
      <input ref={inputRef} id="verification-code" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus
        maxLength={6} pattern="[0-9]{6}" value={code} disabled={isLoading || resending}
        onChange={event => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); onClearError?.(); }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        aria-invalid={Boolean(errorMessage)} aria-describedby={errorMessage ? "otp-error" : "otp-hint"}
        className="absolute inset-0 z-10 h-full w-full cursor-text text-base opacity-0 disabled:cursor-wait" />
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }, (_, index) => <span key={index}
          className={`flex h-12 min-w-0 items-center justify-center rounded-[3px] border bg-white font-mono text-2xl font-semibold text-[#1b1c1a] sm:h-14 ${errorMessage ? "border-[#c64545]" : focused && index === Math.min(code.length, 5) ? "border-[#a9583e] ring-2 ring-[#cc785c]/20" : code[index] ? "border-[#cc785c]" : "border-[#d8d0c5]"}`}>{code[index] || ""}</span>)}
      </div>
    </div>
    {errorMessage ? <p id="otp-error" role="alert" className="mt-3 text-xs leading-relaxed text-[#b13c3c]">{errorMessage}</p>
      : <p id="otp-hint" className="mt-3 text-xs text-[#77736c]">Enter or paste the six-digit SMS code.</p>}
    <button type="submit" disabled={isLoading || resending || code.length !== 6} aria-busy={isLoading}
      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-[#252320] text-sm font-semibold text-[#faf9f5] hover:bg-[#3a3833] focus-visible:ring-2 focus-visible:ring-[#cc785c] disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? <><AuthLoader /><span>Verifying…</span></> : "Verify & continue →"}</button>
    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[#615f59]">
      <span>Didn't receive a code?</span>
      {cooldown > 0 ? <span className="font-mono">Resend in 0:{String(cooldown).padStart(2, "0")}</span>
        : <button type="button" onClick={resend} disabled={resending || isLoading} aria-busy={resending} className="inline-flex items-center gap-2 text-[#a9583e] hover:underline disabled:opacity-50">{resending ? <><AuthLoader /><span>Sending…</span></> : "Resend code"}</button>}
    </div>
  </form>;
}
