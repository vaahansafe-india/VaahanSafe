import * as React from "react";
import { JournalSystemState } from "./JournalSystemState";
import { SystemStateActions } from "./SystemStateActions";

interface ForbiddenStateProps {
  showSignIn?: boolean;
  signInUrl?: string;
  returnUrl?: string;
  customDescription?: string;
}

export function ForbiddenState({
  showSignIn = true,
  signInUrl = "https://app.vaahansafe.com/login",
  returnUrl = "/",
  customDescription,
}: ForbiddenStateProps) {
  return (
    <JournalSystemState
      statusCode="403"
      stateLabel="SECURITY / 403 • ACCESS BOUNDARY"
      headline={
        <>
          This area isn&apos;t available
          <br className="hidden sm:inline" /> to this session.
        </>
      }
      description={
        customDescription ||
        "You do not have permission to view this resource with your current session credentials. If you are an authorized editor or administrator, please authenticate to continue."
      }
      railType="403"
      actions={
        <SystemStateActions
          primary={{
            label: "Return to Journal",
            href: returnUrl,
          }}
          secondary={
            showSignIn
              ? {
                  label: "Sign in →",
                  href: signInUrl,
                  external: true,
                }
              : undefined
          }
        />
      }
    />
  );
}
