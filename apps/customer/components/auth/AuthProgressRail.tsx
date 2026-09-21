import * as React from "react";

interface AuthProgressRailProps {
  currentStage: "sign-in" | "verify-otp" | "authenticated";
}

export function AuthProgressRail({ currentStage }: AuthProgressRailProps) {
  const isSignIn = currentStage === "sign-in";
  const isVerify = currentStage === "verify-otp";
  const isIdentity = currentStage === "authenticated";

  return (
    <div
      aria-label="Authentication progress"
      className="flex items-center justify-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground select-none"
    >
      {/* 01 SIGN IN */}
      <span
        className={`flex items-center gap-1.5 transition-colors duration-200 ${
          isSignIn ? "font-semibold text-foreground" : ""
        }`}
      >
        {isSignIn && <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />}
        <span>01 SIGN IN</span>
      </span>

      <span className="text-muted-foreground/40">•</span>

      {/* 02 VERIFY */}
      <span
        className={`flex items-center gap-1.5 transition-colors duration-200 ${
          isVerify ? "font-semibold text-foreground" : ""
        }`}
      >
        {isVerify && <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />}
        <span>02 VERIFY</span>
      </span>

      <span className="text-muted-foreground/40">•</span>

      {/* 03 IDENTITY */}
      <span
        className={`flex items-center gap-1.5 transition-colors duration-200 ${
          isIdentity ? "font-semibold text-foreground" : ""
        }`}
      >
        {isIdentity && <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />}
        <span>03 IDENTITY</span>
      </span>
    </div>
  );
}
