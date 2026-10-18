"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateReplacement } from "./actions";
export function ReplacementActivation({ id }: { id: string }) {
  const [proof, setProof] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    router = useRouter();
  return (
    <form
      className="space-y-5 rounded-xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await activateReplacement(id, proof);
          if (r.success) {
            setProof("");
            router.refresh();
          } else setError(r.error || "Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-serif text-2xl">Verify your delivered kit</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Reveal the private activation code under the scratch panel. Enter it in
        full, with or without hyphens. This connects the replacement to your
        existing vehicle.
      </p>
      <label className="grid gap-2 text-sm">
        Private activation code
        <input
          type="password"
          autoComplete="off"
          maxLength={40}
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          className="min-h-12 rounded-md border border-border bg-background px-3 font-mono"
          required
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          required
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 size-4 shrink-0"
        />
        <span>
          I received this replacement kit and will use it on the same vehicle.
        </span>
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !confirmed || !proof.trim()}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Verifying…" : "Activate replacement"}
      </button>
    </form>
  );
}
