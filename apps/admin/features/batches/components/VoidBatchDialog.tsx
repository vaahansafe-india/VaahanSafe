"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@vaahansafe/ui/components/alert-dialog";
import type { BatchItem } from "../batches.types";
import { formatQuantity } from "../batches.presentation";

interface VoidBatchDialogProps {
  batch: BatchItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VoidBatchDialog({
  batch,
  open,
  onOpenChange,
  onSuccess,
}: VoidBatchDialogProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!batch) return null;

  const handleVoid = async () => {
    if (!reason.trim()) {
      setError("Please provide an operational reason for voiding this lot.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/batches/${batch.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), mode: "VOIDED" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to void batch.");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to void lot.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="batches-dialog-content">
        <AlertDialogHeader>
          <AlertDialogTitle>Void batch {batch.reference}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will mark the manufacturing lot as VOIDED.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="batches-void-body">
          <div className="batches-void-warning">
            <p>
              <strong>{formatQuantity(batch.quantity)} QR identities</strong> are associated with this lot.
            </p>
            <p>
              Voiding prevents these identities from entering active distribution or retail activation.
              This action is logged in the security audit trail.
            </p>
          </div>

          {error && (
            <div className="admin-notice error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <div className="batches-form-field">
            <label htmlFor="void-batch-reason">Reason for voiding (required)</label>
            <textarea
              id="void-batch-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Printing vendor damaged substrates; barcode contrast defect; duplicate job."
              rows={3}
              className="batches-form-textarea"
              required
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep lot</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || !reason.trim()}
            onClick={(e) => {
              e.preventDefault();
              void handleVoid();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? "Voiding lot…" : "Void batch"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
