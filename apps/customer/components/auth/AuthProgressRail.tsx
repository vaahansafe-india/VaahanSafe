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
      className="flex w-full items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 font-mono text-[8px] xs:text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.06em] xs:tracking-[0.12em] sm:tracking-[0.2em] text-muted-foreground select-none overflow-hidden"
    >
      {/* 01 SIGN IN */}
      <span
        className={`flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors duration-200 ${
          isSignIn ? "font-semibold text-foreground" : ""
        }`}
      >
        {isSignIn && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc785c]" />}
        <span>01 SIGN IN</span>
      </span>

      <span className="shrink-0 text-muted-foreground/40 text-[7px] sm:text-[9px] select-none">•</span>

      {/* 02 VERIFY */}
      <span
        className={`flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors duration-200 ${
          isVerify ? "font-semibold text-foreground" : ""
        }`}
      >
        {isVerify && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#cc785c]" />}
        <span>02 VERIFY</span>
      </span>

      <span className="shrink-0 text-muted-foreground/40 text-[7px] sm:text-[9px] select-none">•</span>

      {/* 03 IDENTITY */}
      <span
        className={`flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap transition-colors duration-200 ${
          isIdentity ? "font-semibold text-foreground" : ""
        }`}
      >
        {isIdentity && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5db8a6]" />}
        <span>03 IDENTITY</span>
      </span>
    </div>
  );
}
