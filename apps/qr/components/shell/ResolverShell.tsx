import React from "react";
import { ResolverHeader } from "./ResolverHeader";
import { ResolverFooter } from "./ResolverFooter";
import { OfflineBanner } from "../states/OfflineBanner";

export interface ResolverShellProps {
  children: React.ReactNode;
  verified?: boolean;
}

export function ResolverShell({
  children,
  verified = false,
}: ResolverShellProps) {
  return (
    <div className="qr-resolver min-h-dvh flex flex-col justify-between text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <ResolverHeader verified={verified} />
      <div className="mx-auto flex w-full min-w-0 max-w-[728px] flex-1 flex-col px-4 pb-6 sm:px-6">
        <OfflineBanner />
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full flex-1 pt-6 pb-2"
        >
          {children}
        </main>
        <ResolverFooter />
      </div>
    </div>
  );
}
