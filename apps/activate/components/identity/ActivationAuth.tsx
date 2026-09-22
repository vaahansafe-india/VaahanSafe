"use client";

import React, { useState } from "react";
import { Input, Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import { MobileOtpStep } from "./MobileOtpStep";
import type { ActivationSessionUserDto } from "@/lib/types";

interface ActivationAuthProps {
  onAuthenticated: (user: ActivationSessionUserDto) => void;
}

export function ActivationAuth({ onAuthenticated }: ActivationAuthProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/activate/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digitsOnly }),
      });

      const data = await res.json();
      if (data.success) {
        setMaskedPhone(data.maskedPhone || `+91 ••••• ${digitsOnly.slice(-4)}`);
        setStep("otp");
      } else {
        setError(data.error || "Could not send verification code. Check the number and try again.");
      }
    } catch {
      setError("Network error. Could not connect to verification server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/activate/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        onAuthenticated(data.user);
      } else {
        setError(data.error || "That code couldn't be verified. Check the code and try again.");
      }
    } catch {
      setError("Network error during verification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    const res = await fetch("/api/activate/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    });
    const data = await res.json();
    if (!data.success) {
      setError(data.error || "Failed to resend code.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
          Verify Your Mobile Number
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
          Enter your 10-digit mobile number to verify your account via SMS OTP. Scanners will never see this number.
        </p>
      </div>

      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="phone-input"
              className="block text-xs font-mono font-medium text-foreground uppercase tracking-wider"
            >
              Indian Mobile Number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 flex items-center gap-1.5 text-muted-foreground select-none pointer-events-none z-10">
                <VaahanIcon name="phone" size={14} className="text-primary" />
                <span className="font-mono text-sm font-semibold text-foreground">+91</span>
                <span className="text-border font-light ml-0.5">|</span>
              </div>
              <Input
                id="phone-input"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                  if (error) setError(null);
                }}
                placeholder="98765 43210"
                disabled={isLoading}
                autoFocus
                autoComplete="tel"
                className="h-13 pl-20 pr-4 font-mono text-base tracking-wider rounded-lg border-border bg-background focus-visible:ring-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5 font-medium pt-0.5">
                <VaahanIcon name="alert" size={13} />
                <span>{error}</span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || phoneNumber.length < 10}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Sending Code...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Send Verification Code</span>
                <VaahanIcon name="arrow-right" size={14} />
              </div>
            )}
          </Button>

          <p className="border-t border-border pt-3 text-[11px] font-mono text-muted-foreground">
            We will text a one-time verification code to this number.
          </p>
        </form>
      ) : (
        <MobileOtpStep
          maskedPhone={maskedPhone}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onChangePhone={() => {
            setStep("phone");
            setError(null);
          }}
          isLoading={isLoading}
          error={error}
        />
      )}
    </div>
  );
}
