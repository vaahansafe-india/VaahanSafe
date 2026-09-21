"use client";

import React, { useEffect } from "react";
import { ResolverShell } from "../components/shell/ResolverShell";
import { ResolverErrorState } from "../components/states/ResolverErrorState";

export default function ResolverErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Redacted error logging (Rule 95: Never log PII, tokens, or activation secrets)
    console.error("[VaahanSafe QR Error Boundary]:", error.message);
  }, [error]);

  return (
    <ResolverShell>
      <ResolverErrorState
        onRetry={reset}
        title="Safety View Interrupted"
        description="We couldn't complete this safety view request. Please try again in a moment."
      />
    </ResolverShell>
  );
}
