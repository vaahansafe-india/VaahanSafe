"use client";
import { useState } from "react";
export function ReportLinkControls({ reportId }: { reportId: string }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function revoke() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/scan-reports/${encodeURIComponent(reportId)}/links/revoke`,
        { method: "POST" },
      );
      if (!response.ok)
        throw new Error(
          "We couldn’t revoke the report links. Please try again.",
        );
      setMessage(
        "Existing report links have been revoked. New links cannot be issued for these alerts.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs text-muted-foreground">
        Shared report links expire after 24 hours. You can end access earlier;
        your account keeps access to the saved report.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={revoke}
        className="min-h-11 text-xs font-semibold text-primary underline underline-offset-4"
      >
        {busy ? "Revoking links…" : "Revoke shared report links"}
      </button>
      {message && (
        <p role="status" className="text-xs">
          {message}
        </p>
      )}
    </div>
  );
}
