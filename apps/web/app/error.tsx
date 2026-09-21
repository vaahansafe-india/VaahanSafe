"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Redact or report error safely without leaking sensitive information
    console.error("[VaahanSafe Web Error]", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
          <VaahanIcon name="alert" size={32} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this page. Our platform monitoring has logged
            the event.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} className="w-full sm:w-auto font-semibold">
            <VaahanIcon name="refresh" size={16} className="mr-2" />
            Try again
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">
              <VaahanIcon name="home" size={16} className="mr-2" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
