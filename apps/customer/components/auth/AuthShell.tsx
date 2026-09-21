import * as React from "react";
import { AuthIdentityField } from "./AuthIdentityField";
import { AuthCard } from "./AuthCard";
import { AuthLegalNotice } from "./AuthLegalNotice";

interface AuthShellProps {
  returnUrl?: string;
  mode?: "login" | "onboarding";
  userEmail?: string;
  userName?: string;
}

/**
 * AuthShell
 *
 * Full-viewport centered authentication layout for app.vaahansafe.com.
 *
 * Design Invariants:
 * - min-height: 100dvh
 * - Background: Zinc canvas / bg-background
 * - display: grid; place-items: center;
 * - Card centered horizontally and vertically
 * - Subtle background identity field (aria-hidden="true")
 * - Outside-card minimalist footer
 */
export function AuthShell({
  returnUrl,
  mode = "login",
  userEmail,
  userName,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="
        relative isolate flex min-h-[100dvh] w-full
        flex-col items-center justify-start sm:justify-center
        overflow-x-hidden overflow-y-auto
        bg-background px-4 py-5 sm:px-6 sm:py-8
        text-foreground antialiased
      "
    >
      {/* 01. Low-opacity decorative background identity field */}
      <AuthIdentityField />

      {/* 02. Visually Centered & Scrollable Login Card */}
      <div className="relative z-10 my-auto flex w-full flex-col items-center justify-center">
        <AuthCard
          returnUrl={returnUrl}
          mode={mode}
          userEmail={userEmail}
          userName={userName}
        />

        {/* 03. Restrained Outside-Card Footer */}
        <AuthLegalNotice type="outside-card" />
      </div>
    </main>
  );
}
