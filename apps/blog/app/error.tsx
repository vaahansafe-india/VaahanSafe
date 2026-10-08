"use client";

import * as React from "react";
import { JournalSystemState } from "../components/system/JournalSystemState";
import { SystemStateActions } from "../components/system/SystemStateActions";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function JournalError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    // Safely log operational context server-side/client console without leaking sensitive data
    if (process.env.NODE_ENV === "development") {
      console.error("[Journal Operational Error]", {
        digest: error?.digest,
        name: error?.name,
      });
    }
  }, [error]);

  return (
    <JournalSystemState
      statusCode="500"
      stateLabel="SYSTEM / 500 • SIGNAL INTERRUPTED"
      headline={
        <>
          The Journal couldn&apos;t
          <br className="hidden sm:inline" /> complete this request.
        </>
      }
      description="We couldn’t load this page right now. Please try again, or return to the Journal to explore another story."
      railType="500"
      referenceId={error?.digest}
      actions={
        <SystemStateActions
          primary={{
            label: "Try again",
            onClick: () => reset(),
          }}
          secondary={{
            label: "Journal Home →",
            href: "/",
          }}
        />
      }
    />
  );
}
