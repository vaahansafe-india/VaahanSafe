import * as React from "react";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";

interface AuthBrandProps {
  view: "sign-in" | "verify-otp" | "verifying" | "authenticated";
  maskedPhone?: string;
}

export function AuthBrand({ view, maskedPhone }: AuthBrandProps) {
  const isOtp = view === "verify-otp" || view === "verifying";

  return (
    <div className="flex flex-col items-center text-center">
      {/* 01. Brand Mark & Wordmark (symbol approx 32px) */}
      <div className="flex items-center justify-center">
        <VaahanSafeLogo
          size="md"
          variant="brand"
          showTagline={false}
          className="transition-transform duration-200"
        />
      </div>

      {/* 02. Signature Mono Identity Rail */}
      <div className="mt-2.5 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span className="h-px w-6 bg-[#cc785c]/40" />
        <span>VEHICLE IDENTITY</span>
      </div>

      {/* 03. Heading (Cormorant Garamond) */}
      <h1 className="mt-3 font-serif text-[1.65rem] font-normal leading-tight tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
        {isOtp ? "Verify your number." : "Welcome to VaahanSafe."}
      </h1>

      {/* 04. Supporting Copy */}
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[13.5px]">
        {isOtp ? (
          <>
            We sent a verification code to{" "}
            <span className="font-mono font-medium text-foreground">
              {maskedPhone || "+91 ••••• •••••"}
            </span>
          </>
        ) : (
          "Sign in to access and manage your vehicle identity."
        )}
      </p>
    </div>
  );
}
