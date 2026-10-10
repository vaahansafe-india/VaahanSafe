import React from "react";
import { ResolverHeader } from "./ResolverHeader";
import { ResolverFooter } from "./ResolverFooter";
import { OfflineBanner } from "../states/OfflineBanner";

export interface ResolverShellProps {
  children: React.ReactNode;
}

export function ResolverShell({ children }: ResolverShellProps) {
  return (
    <div className="qr-resolver min-h-screen flex flex-col justify-between text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <div className="mx-auto flex w-full min-w-0 max-w-xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
        <ResolverHeader />
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
