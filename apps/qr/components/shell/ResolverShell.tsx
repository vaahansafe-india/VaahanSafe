import React from "react";
import { ResolverHeader } from "./ResolverHeader";
import { ResolverFooter } from "./ResolverFooter";
import { OfflineBanner } from "../states/OfflineBanner";

export interface ResolverShellProps {
  children: React.ReactNode;
}

export function ResolverShell({ children }: ResolverShellProps) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-lg mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col">
        <ResolverHeader />
        <OfflineBanner />
        <main className="w-full flex-1 pt-6 pb-2">{children}</main>
        <ResolverFooter />
      </div>
    </div>
  );
}
