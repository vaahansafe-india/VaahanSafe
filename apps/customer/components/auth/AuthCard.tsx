"use client";

import * as React from "react";
import { AuthBrand } from "./AuthBrand";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { MobileSignInForm } from "./MobileSignInForm";
import { OtpVerificationForm } from "./OtpVerificationForm";
import { AuthLegalNotice } from "./AuthLegalNotice";
import { safeReturnUrl } from "@/lib/auth-navigation";

export type AuthState = "sign-in" | "sending-otp" | "verify-otp" | "verifying" | "authenticated";

interface AuthCardProps {
  returnUrl?: string;
  mode?: "login" | "onboarding";
  userEmail?: string;
  userName?: string;
}

export function AuthCard({
  returnUrl = "/",
  mode = "login",
  userEmail,
  userName,
}: AuthCardProps) {
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
        } else if (err === "auth_failed" || err === "auth_unconfigured") {
          setErrorMessage("We couldn't complete sign-in right now. Please try again.");
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
        body: JSON.stringify({ phone: phoneNumber, otp, returnUrl: safeReturnUrl(returnUrl) }),
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
      const targetDestination = typeof data.redirectTo === "string" && data.redirectTo.startsWith("/onboarding/verification?")
        ? data.redirectTo : safeReturnUrl(data.redirectTo || returnUrl);

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
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error("Resend unavailable");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Could not resend code right now. Try again in a moment.");
      throw new Error("Resend unavailable");
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
      className="w-full"
    >
      {/* 01. Brand Header */}
      <AuthBrand
        view={state === "sending-otp" ? "sign-in" : state}
        maskedPhone={maskedPhone}
        mode={mode}
      />

      {/* 01.1 Google Account Connected indicator in onboarding mode */}
      {mode === "onboarding" && (
        <div className="mt-[clamp(12px,2vh,28px)] flex items-center justify-between gap-3 border-l-2 border-[#325763] bg-[#f5f0e8] px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#325763]" />
            <span className="break-all text-xs font-medium text-[#1b1c1a]">
              {userEmail ? `Google: ${userEmail}` : "Google Account Connected"}
            </span>
          </div>
          <a
            href="/api/auth/logout"
            className="shrink-0 text-xs text-[#a9583e] underline underline-offset-4 hover:text-[#1b1c1a]"
          >
            Switch
          </a>
        </div>
      )}

      {/* 02. Success Confirmation View */}
      {state === "authenticated" ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 border-t border-[#e2dcd2] py-5"
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#325763]">
            Identity verified
          </div>
          <p className="mt-3 font-serif text-3xl text-[#1b1c1a]">
            Opening your account…
          </p>
        </div>
      ) : (
        <>
          {/* 03. Dynamic State: Sign In Form or OTP Form */}
          <div className="mt-[clamp(16px,3vh,36px)]">
            {state === "sign-in" || state === "sending-otp" ? (
              <div>
                {mode !== "onboarding" && (
                  <GoogleSignInButton
                    isLoading={isGoogleLoading}
                    onClick={() => {
                      setGoogleLoading(true);
                      window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(safeReturnUrl(returnUrl))}`;
                    }}
                  />
                )}

                <MobileSignInForm
                  isLoading={isMobileSending}
                  onSubmitMobile={handleSendOtp}
                  errorMessage={errorMessage}
                  onClearError={() => setErrorMessage(null)}
                  showDivider={mode !== "onboarding"}
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

          {mode === "onboarding" && (
            <div className="pt-3 text-center">
              <a
                href={safeReturnUrl(returnUrl)}
                className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[#615f59] underline underline-offset-4 transition-colors hover:text-[#a9583e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] focus-visible:ring-offset-2"
              >
                Verify later — continue to your account →
              </a>
            </div>
          )}

          <div className="mt-[clamp(16px,3vh,32px)] border-t border-[#e2dcd2] pt-[clamp(10px,2vh,20px)]">
            <AuthLegalNotice type="in-card" />
          </div>
        </>
      )}
    </div>
  );
}
