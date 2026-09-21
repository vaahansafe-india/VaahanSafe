"use client";

import * as React from "react";
import { Button } from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";

interface SettingsErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function SettingsErrorState({
  onRetry,
  message = "We couldn't load your settings right now. Please try again.",
}: SettingsErrorStateProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <VaahanIcon name="alert" size={24} />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-lg font-medium text-foreground">
          Settings Unavailable
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="text-xs border-border hover:border-[#cc785c]"
        >
          Retry &rarr;
        </Button>
      )}
    </div>
  );
}
