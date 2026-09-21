"use client";

import * as React from "react";
import { JournalSystemState } from "./JournalSystemState";
import { SystemStateActions } from "./SystemStateActions";

interface OfflineStateProps {
  onRetry?: () => void;
  returnUrl?: string;
}

export function OfflineState({ onRetry, returnUrl = "/" }: OfflineStateProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <JournalSystemState
      stateLabel="NETWORK / OFFLINE • LOCAL STATE"
      headline={
        <>
          You&apos;re offline.
          <br className="hidden sm:inline" /> The Journal will reconnect when your network returns.
        </>
      }
      description="Your browser is currently unable to reach the network. Previously loaded cached reading material may remain accessible, but new stories and live updates require an active internet connection."
      railType="OFFLINE"
      actions={
        <SystemStateActions
          primary={{
            label: "Try again",
            onClick: handleRetry,
          }}
          secondary={{
            label: "Journal Home →",
            href: returnUrl,
          }}
        />
      }
    />
  );
}
