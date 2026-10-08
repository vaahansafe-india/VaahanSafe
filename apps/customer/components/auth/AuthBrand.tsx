import * as React from "react";

interface AuthBrandProps {
  view: "sign-in" | "verify-otp" | "verifying" | "authenticated";
  maskedPhone?: string;
  mode?: "login" | "onboarding";
}

export function AuthBrand({ view, maskedPhone, mode = "login" }: AuthBrandProps) {
  const isOtp = view === "verify-otp" || view === "verifying";

  return (
    <div>
      <p className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a9583e]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" aria-hidden="true" />
        {mode === "onboarding" ? "Complete your account" : "Customer account"}
      </p>
      <h1 className="mt-[clamp(10px,2vh,20px)] font-serif text-[clamp(2.8rem,7vh,4.8rem)] font-medium leading-[0.92] tracking-[-0.04em] text-[#1b1c1a]">
        {isOtp ? "Check your messages." : mode === "onboarding" ? "Verify your mobile." : "Welcome to VaahanSafe."}
      </h1>
      <p className="mt-[clamp(10px,2vh,20px)] max-w-[390px] text-sm leading-[1.6] text-[#615f59]">
        {isOtp ? (
          <>Enter the six-digit code sent to <strong className="font-medium text-[#1b1c1a]">{maskedPhone || "your mobile number"}</strong>.</>
        ) : mode === "onboarding" ? (
          "Verify your Indian mobile number to receive vehicle safety and emergency scan alerts."
        ) : (
          "Sign in to access and manage your vehicle identity."
        )}
      </p>
    </div>
  );
}
