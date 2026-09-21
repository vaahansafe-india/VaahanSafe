"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui";
import type { SessionItem } from "@/lib/settings-types";
import { revokeSingleSessionAction } from "@/lib/settings-actions";
import { toast } from "sonner";

interface RevokeSessionAlertProps {
  session: SessionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (sessionId: string) => void;
}

export function RevokeSessionAlert({
  session,
  open,
  onOpenChange,
  onSuccess,
}: RevokeSessionAlertProps) {
  const [isPending, startTransition] = React.useTransition();

  if (!session) return null;

  const handleRevoke = () => {
    startTransition(async () => {
      const res = await revokeSingleSessionAction(session.id);
      if (res.success) {
        toast.success("Session signed out.");
        onSuccess(session.id);
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif text-lg font-medium text-foreground">
            Sign out this session?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            This will immediately terminate the session for <span className="font-medium text-foreground">{session.browser} on {session.os}</span>. That device will need to authenticate again using mobile OTP or Google sign-in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Keep Session
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleRevoke();
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs"
          >
            {isPending ? "Signing Out..." : "Sign Out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
