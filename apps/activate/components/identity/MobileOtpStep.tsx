"use client";

import React, { useState, useEffect } from "react";
import { Input, Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

interface MobileOtpStepProps {
  maskedPhone: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onChangePhone: () => void;
  isLoading: boolean;
  error?: string | null;
}

export function MobileOtpStep({
  maskedPhone,
  onVerify,
  onResend,
  onChangePhone,
  isLoading,
  error,
}: MobileOtpStepProps) {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(numeric);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      await onVerify(otp);
    }
  };

  const handleResendClick = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await onResend();
      setCountdown(30);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Verification Code Sent To
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-foreground">
            {maskedPhone}
          </span>
          <button
            type="button"
            onClick={onChangePhone}
            disabled={isLoading}
            className="text-xs text-primary hover:underline transition-colors"
          >
            Change Number
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="otp-input"
          className="block text-xs font-mono font-medium text-foreground tracking-wide uppercase text-center"
        >
          Enter 6-Digit SMS Code
        </label>
        <Input
          id="otp-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={otp}
          onChange={handleOtpChange}
          placeholder="••••••"
          disabled={isLoading}
          autoFocus
          autoComplete="one-time-code"
          className="h-14 font-mono text-2xl tracking-[0.5em] text-center rounded-xl border-border bg-background focus-visible:ring-primary"
        />

        {error && (
          <p className="text-xs text-destructive text-center flex items-center justify-center gap-1.5 font-medium pt-1">
            <VaahanIcon name="alert" size={13} />
            <span>{error}</span>
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || otp.length < 6}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>Verifying SMS Code...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Verify & Continue</span>
            <VaahanIcon name="arrow-right" size={15} />
          </div>
        )}
      </Button>

      {/* Resend Cooldown */}
      <div className="text-center pt-1 text-xs text-muted-foreground">
        {countdown > 0 ? (
          <span>Resend code in 00:{countdown < 10 ? `0${countdown}` : countdown}</span>
        ) : (
          <button
            type="button"
            onClick={handleResendClick}
            disabled={isResending || isLoading}
            className="font-medium text-primary hover:underline"
          >
            {isResending ? "Sending code..." : "Resend Verification Code"}
          </button>
        )}
      </div>
    </form>
  );
}
