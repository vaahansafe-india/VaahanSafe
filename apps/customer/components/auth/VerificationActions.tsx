"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthLoader } from "./AuthLoader";

interface VerificationActionsProps {
  needsPhone: boolean;
  verifyUrl: string;
  returnUrl: string;
}

export function VerificationActions({ needsPhone, verifyUrl, returnUrl }: VerificationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<"verify" | "later" | null>(null);
  const [leavingForGoogle, setLeavingForGoogle] = useState(false);
  const busy = isPending || leavingForGoogle;

  function navigate(action: "verify" | "later") {
    if (busy) return;
    setActiveAction(action);
    const destination = action === "verify" ? verifyUrl : returnUrl;
    if (action === "verify" && !needsPhone) {
      setLeavingForGoogle(true);
      window.location.assign(destination);
      return;
    }
    startTransition(() => router.push(destination));
  }

  return <div className="mt-7 grid gap-3">
    <button type="button" onClick={() => navigate("verify")} disabled={busy} aria-busy={busy && activeAction === "verify"}
      className="flex h-12 items-center justify-center gap-2 rounded-[3px] bg-[#252320] text-sm font-semibold text-[#faf9f5] hover:bg-[#3a3833] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
      {busy && activeAction === "verify" ? <><AuthLoader /><span>{needsPhone ? "Opening verification…" : "Connecting Google…"}</span></>
        : <span>{needsPhone ? "Verify now" : "Connect Google now"} →</span>}
    </button>
    <button type="button" onClick={() => navigate("later")} disabled={busy} aria-busy={busy && activeAction === "later"}
      className="flex h-12 items-center justify-center gap-2 rounded-[3px] border border-[#d8d0c5] text-sm font-medium text-[#1b1c1a] hover:bg-[#f1ece3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
      {busy && activeAction === "later" ? <><AuthLoader /><span>Opening your app…</span></> : <span>Later — continue to app</span>}
    </button>
    <span className="sr-only" role="status">{busy ? "Please wait while we continue." : ""}</span>
  </div>;
}
