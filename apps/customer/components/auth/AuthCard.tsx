"use client";

import * as React from "react";
import { AuthBrand } from "./AuthBrand";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { MobileSignInForm } from "./MobileSignInForm";
import { OtpVerificationForm } from "./OtpVerificationForm";
import { AuthProgressRail } from "./AuthProgressRail";
import { AuthLegalNotice } from "./AuthLegalNotice";

export type AuthState = "sign-in" | "sending-otp" | "verify-otp" | "verifying" | "authenticated";

interface AuthCardProps {
  returnUrl?: string;
}

export function AuthCard({ returnUrl = "/" }: AuthCardProps) {
  const [state, setState] = React.useState<AuthState>("sign-in");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [maskedPhone, setMaskedPhone] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "google_cancelled") {
          setErrorMessage("Google sign-in was cancelled. Please try again.");
        } else if (err === "token_exchange_failed") {
          setErrorMessage("We couldn't verify your Google account. Please try again.");
        } else if (err === "identity_missing") {
          setErrorMessage("Your Google account did not return an email. Please try again.");
        } else if (err === "auth_failed") {
          setErrorMessage("Authentication service unavailable. Please check your network or try again.");
        }
      }
    }
  }, []);

  // Send Mobile OTP Handler
  const handleSendOtp = async (phone: string) => {
    setState("sending-otp");
    setErrorMessage(null);
    setPhoneNumber(phone);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "We couldn't use that mobile number. Check it and try again.");
        setState("sign-in");
        return;
      }

      setMaskedPhone(data.maskedPhone || `${phone.slice(0, 3)} ••••• ${phone.slice(-4)}`);
      setState("verify-otp");
    } catch {
      setErrorMessage("We couldn't complete sign-in right now. Please try again.");
      setState("sign-in");
    }
  };

  // Verify OTP Handler
  const handleVerifyOtp = async (otp: string) => {
    setState("verifying");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "That code couldn't be verified. Check the code and try again.");
        setState("verify-otp");
        return;
      }

      // Success Transition
      setState("authenticated");

      // Redirect to customer dashboard
      const targetDestination =
        returnUrl && returnUrl !== "/" && returnUrl !== "/login"
          ? returnUrl
          : "/dashboard";

      // Subtle pause for tactile confirmation
      setTimeout(() => {
        window.location.href = targetDestination;
      }, 500);
    } catch {
      setErrorMessage("We couldn't complete sign-in right now. Please try again.");
      setState("verify-otp");
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
    } catch {
      setErrorMessage("Could not resend code right now. Try again in a moment.");
    }
  };

  // Switch back to mobile entry
  const handleChangeNumber = () => {
    setErrorMessage(null);
    setState("sign-in");
  };

  const isGoogleLoading = googleLoading;
  const isMobileSending = state === "sending-otp";
  const isOtpVerifying = state === "verifying";

  return (
    <div
      role="region"
      aria-label="Customer authentication"
      className="
        relative z-10 w-full
        max-w-[430px]
        rounded-2xl border border-border
        bg-card p-6 shadow-sm sm:px-8 sm:py-7
        transition-all duration-300
      "
    >
      {/* 01. Brand Header */}
      <AuthBrand
        view={state === "sending-otp" ? "sign-in" : state}
        maskedPhone={maskedPhone}
      />

      {/* 02. Success Confirmation View */}
      {state === "authenticated" ? (
        <div
          role="status"
          aria-live="polite"
          className="my-8 flex flex-col items-center justify-center py-6 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5db872]/15 text-[#5db872]">
            <span className="h-3 w-3 rounded-full bg-[#5db872] animate-ping" />
          </div>
          <div className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-[#5db872]">
            ● Identity Verified
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Opening your vehicle identity...
          </p>
        </div>
      ) : (
        <>
          {/* 03. Dynamic State: Sign In Form or OTP Form */}
          <div className="mt-4 sm:mt-5">
            {state === "sign-in" || state === "sending-otp" ? (
              <div className="space-y-4">
                <GoogleSignInButton
                  isLoading={isGoogleLoading}
                  onClick={() => {
                    setGoogleLoading(true);
                    window.location.href = "/api/auth/google";
                  }}
                />

                <MobileSignInForm
                  isLoading={isMobileSending}
                  onSubmitMobile={handleSendOtp}
                  errorMessage={errorMessage}
                  onClearError={() => setErrorMessage(null)}
                />
              </div>
            ) : (
              <OtpVerificationForm
                isLoading={isOtpVerifying}
                onVerifyOtp={handleVerifyOtp}
                onResendOtp={handleResendOtp}
                onChangeNumber={handleChangeNumber}
                errorMessage={errorMessage}
                onClearError={() => setErrorMessage(null)}
              />
            )}
          </div>

          {/* 04. In-Card Footer: Legal Notice & Signature Progress Rail */}
          <div className="mt-4.5 space-y-3 border-t border-[#f0eae1] pt-3.5 dark:border-white/[0.06]">
            <AuthLegalNotice type="in-card" />
            <AuthProgressRail
              currentStage={
                state === "verify-otp" || state === "verifying"
                  ? "verify-otp"
                  : "sign-in"
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
