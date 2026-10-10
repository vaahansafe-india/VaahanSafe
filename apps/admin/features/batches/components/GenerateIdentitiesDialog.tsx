"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import type { BatchItem } from "../batches.types";
import { formatQuantity, humanizeChannel } from "../batches.presentation";

interface GenerateIdentitiesDialogProps {
  batch: BatchItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GenerateIdentitiesDialog({
  batch,
  open,
  onOpenChange,
  onSuccess,
}: GenerateIdentitiesDialogProps) {
  const [typedConfirm, setTypedConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!batch) return null;

  const isHighRisk = batch.quantity >= 10000;
  const canProceed = !isHighRisk || typedConfirm.trim() === batch.reference;

  const handleGenerate = async () => {
    if (!canProceed) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/batches/${batch.id}/generate`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed generating identities.");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="batches-dialog-content">
        <DialogHeader>
          <DialogTitle>Generate identities — {batch.reference}</DialogTitle>
          <DialogDescription>
            Generate cryptographic identity material for this manufacturing lot.
          </DialogDescription>
        </DialogHeader>

        <div className="batches-dialog-form">
          {error && (
            <div className="admin-notice error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <div className="batches-review-summary">
            <div className="batches-review-stat">
              <span>Batch Reference</span>
              <strong className="batches-mono">{batch.reference}</strong>
            </div>
            <div className="batches-review-stat">
              <span>Lot Quantity</span>
              <strong>{formatQuantity(batch.quantity)}</strong>
            </div>
            <div className="batches-review-stat">
              <span>Channel</span>
              <strong>{humanizeChannel(batch.channel)}</strong>
            </div>
            <div className="batches-review-stat">
              <span>Current Status</span>
              <strong>{batch.status}</strong>
            </div>
          </div>

          <div className="batches-callout-box">
            <p>
              Generation will create unique, high-entropy public IDs and format visible codes
              (<code>VS-XXXXXXXX</code>) according to the VaahanSafe cryptographic specification.
            </p>
            <p>
              This action is logged in the permanent audit trail. No activation secrets or
              owner services are enabled at this stage.
            </p>
          </div>

          {/* HIGH VOLUME TYPED CONFIRMATION */}
          {isHighRisk && (
            <div className="batches-high-volume-typed-confirm">
              <label htmlFor="generate-confirm-input">
                High-volume lot: Type <strong>{batch.reference}</strong> to authorize generation:
              </label>
              <input
                id="generate-confirm-input"
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value.toUpperCase())}
                placeholder={batch.reference}
                className="batches-form-input batches-mono"
                autoComplete="off"
              />
            </div>
          )}

          <div className="batches-dialog-footer">
            <button
              type="button"
              className="admin-button"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-button primary"
              disabled={busy || !canProceed}
              onClick={handleGenerate}
            >
              {busy ? "Generating records…" : `Generate ${formatQuantity(batch.quantity)} identities`}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
