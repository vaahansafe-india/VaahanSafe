"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui/components/select";
import type { CreateBatchInput } from "../batches.types";
import { formatQuantity } from "../batches.presentation";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateBatchInput) => Promise<void>;
}

export function CreateBatchDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateBatchDialogProps) {
  const [reference, setReference] = useState("");
  const [channel, setChannel] = useState<"ONLINE_SYSTEM" | "OFFLINE_RETAIL">("ONLINE_SYSTEM");
  const [quantity, setQuantity] = useState(1000);
  const [manufacturer, setManufacturer] = useState("VaahanSafe Secure Print");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Safety confirmation for large lots
  const isHighVolume = quantity >= 10000;
  const [highVolumeConfirmed, setHighVolumeConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Please enter a valid batch reference code.");
      return;
    }
    if (quantity < 1 || quantity > 200000) {
      setError("Quantity must be between 1 and 2,00,000 identities.");
      return;
    }
    if (isHighVolume && !highVolumeConfirmed) {
      setError("Please check the high-volume lot confirmation.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSubmit({
        reference: reference.trim().toUpperCase(),
        channel,
        quantity,
        manufacturerName: manufacturer.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed creating batch.");
    } finally {
      setBusy(false);
    }
  };

  const generateAutoRef = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.random().toString(36).slice(2, 6).toUpperCase();
    setReference(`VS-${channel === "OFFLINE_RETAIL" ? "RET" : "ONL"}-${dateStr}-${randomHex}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="batches-dialog-content">
        <DialogHeader>
          <DialogTitle>Create manufacturing batch</DialogTitle>
          <DialogDescription>
            Register a controlled QR identity manufacturing lot.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="batches-dialog-form">
          {error && (
            <div className="admin-notice error" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* REFERENCE CODE */}
          <div className="batches-form-field">
            <div className="batches-form-label-row">
              <label htmlFor="create-batch-ref">Batch reference code</label>
              <button
                type="button"
                className="batches-link-btn"
                onClick={generateAutoRef}
              >
                Auto-generate
              </button>
            </div>
            <input
              id="create-batch-ref"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="e.g. VS-ONL-20261010-001"
              maxLength={64}
              required
              className="batches-form-input batches-mono"
            />
            <small>Must be uppercase alphanumeric, unique across all batches.</small>
          </div>

          {/* CHANNEL */}
          <div className="batches-form-field">
            <label htmlFor="create-batch-channel">Inventory channel</label>
            <Select
              value={channel}
              onValueChange={(val) => setChannel(val as any)}
            >
              <SelectTrigger id="create-batch-channel" className="batches-form-select">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE_SYSTEM">
                  Online system (E-commerce kit fulfillment)
                </SelectItem>
                <SelectItem value="OFFLINE_RETAIL">
                  Offline retail (Packaging scratch cards)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* QUANTITY */}
          <div className="batches-form-field">
            <label htmlFor="create-batch-qty">Planned lot quantity</label>
            <div className="batches-qty-input-row">
              <input
                id="create-batch-qty"
                type="number"
                min={1}
                max={200000}
                value={quantity}
                onChange={(e) => {
                  setQuantity(parseInt(e.target.value) || 0);
                  setHighVolumeConfirmed(false);
                }}
                className="batches-form-input batches-qty-input"
                required
              />
              <span className="batches-qty-formatted">
                = {formatQuantity(quantity)} identities
              </span>
            </div>
            <div className="batches-qty-preset-row">
              {[500, 1000, 5000, 10000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="batches-qty-preset-btn"
                  onClick={() => {
                    setQuantity(preset);
                    setHighVolumeConfirmed(false);
                  }}
                >
                  {formatQuantity(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* HIGH VOLUME SAFETY CONFIRMATION */}
          {isHighVolume && (
            <div className="batches-high-volume-warning">
              <strong>High-volume batch ({formatQuantity(quantity)} credentials)</strong>
              <p>
                This operation will reserve a major lot block in the manufacturing schedule.
              </p>
              <label className="batches-safety-check">
                <input
                  type="checkbox"
                  checked={highVolumeConfirmed}
                  onChange={(e) => setHighVolumeConfirmed(e.target.checked)}
                />
                <span>I confirm this planned manufacturing volume is authorized.</span>
              </label>
            </div>
          )}

          {/* MANUFACTURER */}
          <div className="batches-form-field">
            <label htmlFor="create-batch-mfg">Manufacturer partner</label>
            <input
              id="create-batch-mfg"
              type="text"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. VaahanSafe Secure Print"
              className="batches-form-input"
            />
          </div>

          {/* INTERNAL NOTES */}
          <div className="batches-form-field">
            <label htmlFor="create-batch-notes">Production notes / lot description</label>
            <textarea
              id="create-batch-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal manufacturing job reference or quality requirements…"
              rows={2}
              className="batches-form-textarea"
            />
          </div>

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
              type="submit"
              className="admin-button primary"
              disabled={busy || !reference || (isHighVolume && !highVolumeConfirmed)}
            >
              {busy ? "Registering lot…" : "Create batch"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
