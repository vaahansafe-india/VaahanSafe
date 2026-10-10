"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminDialog } from "../../../components/AdminDialog";
import { EmailVerification } from "../../../components/EmailVerification";
import type { InventorySelection } from "../inventory.types";
import { postInventory } from "./PrintDialog";
export function BlockDialog({
  selection,
  onClose,
  onComplete,
}: {
  selection: InventorySelection;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false);
  const query = useQuery({
    queryKey: ["inventory-block-preview", selection],
    queryFn: () =>
      postInventory<{
        previewId: string;
        count: number;
        rows: { id: string; visible_code: string; status: string }[];
      }>("/api/inventory/preview", { selection }),
    retry: false,
    staleTime: 0,
  });
  async function block() {
    setBusy(true);
    setError("");
    try {
      await postInventory("/api/inventory/block", {
        previewId: query.data?.previewId,
        reason,
        confirmed,
      });
      onComplete();
      onClose();
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminDialog
      title="Review inventory block"
      description="Review the affected identities before changing resolver access."
      onClose={onClose}
      footer={
        <div className="admin-dialog-action-row">
          <button className="admin-button" onClick={onClose}>
            Cancel
          </button>
          {!stepUp && (
            <button
              className="admin-button danger"
              disabled={
                busy || !query.data || !confirmed || reason.trim().length < 10
              }
              onClick={() => void block()}
            >
              {busy ? "Applying…" : "Confirm block"}
            </button>
          )}
        </div>
      }
    >
      {stepUp ? (
        <EmailVerification stepUp onVerified={() => setStepUp(false)} />
      ) : (
        <>
          <p>
            This action makes the safety resolver unavailable for the affected
            identities. The server rechecks this preview before applying the
            block.
          </p>
          {query.isPending ? (
            <p>Preparing preview…</p>
          ) : query.isError ? (
            <p role="alert">{query.error.message}</p>
          ) : (
            <div className="inventory-print-review">
              {query.data.rows.map((r) => (
                <div key={r.id}>
                  <strong>{r.visible_code}</strong>
                  <span>{r.status}</span>
                </div>
              ))}
            </div>
          )}
          <label className="inventory-form-label">
            Operational reason
            <textarea
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <label className="inventory-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I reviewed all {query.data?.count ?? 0} affected identities.
            </span>
          </label>
          {error && (
            <p className="admin-notice error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </AdminDialog>
  );
}
