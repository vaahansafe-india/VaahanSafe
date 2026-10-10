"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import { formatQuantity } from "../batches.presentation";

interface ImportOfflineBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ValidationPreview {
  reference: string;
  count: number;
  alreadyImported: boolean;
  channel: string;
}

export function ImportOfflineBatchDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportOfflineBatchDialogProps) {
  const [step, setStep] = useState<"UPLOAD" | "VALIDATING" | "REVIEW" | "IMPORTING" | "COMPLETE">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ValidationPreview | null>(null);
  const [error, setError] = useState("");

  const resetState = () => {
    setStep("UPLOAD");
    setFile(null);
    setPreview(null);
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError("");
    }
  };

  // Step 2: Validate file on server
  const validateFile = async () => {
    if (!file) return;
    setStep("VALIDATING");
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("confirmed", "false");

      const res = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "File validation failed.");
      }

      setPreview(data.data);
      setStep("REVIEW");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed.");
      setStep("UPLOAD");
    }
  };

  // Step 3: Atomic Commit Import
  const commitImport = async () => {
    if (!file || !preview) return;
    setStep("IMPORTING");
    setError("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("confirmed", "true");

      const res = await fetch("/api/inventory/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Import failed.");
      }

      setStep("COMPLETE");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
      setStep("REVIEW");
    }
  };

  const downloadTemplate = () => {
    const csv = "serial,public_id\nB002-0001,8F7K9021\nB002-0002,8F7K9022\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vaahansafe_offline_batch_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="batches-dialog-content">
        <DialogHeader>
          <DialogTitle>Import offline manufacturing lot</DialogTitle>
          <DialogDescription>
            Multi-step validated import of physical offline retail lots.
          </DialogDescription>
        </DialogHeader>

        {/* STEP PROGRESS INDICATOR */}
        <div className="batches-wizard-steps" aria-label="Wizard steps">
          <div className={`batches-wizard-step ${step === "UPLOAD" ? "is-active" : "is-done"}`}>
            <span className="batches-step-num">1</span>
            <span>Upload</span>
          </div>
          <div className={`batches-wizard-step ${step === "VALIDATING" || step === "REVIEW" ? "is-active" : step === "COMPLETE" ? "is-done" : ""}`}>
            <span className="batches-step-num">2</span>
            <span>Validate</span>
          </div>
          <div className={`batches-wizard-step ${step === "REVIEW" || step === "IMPORTING" ? "is-active" : step === "COMPLETE" ? "is-done" : ""}`}>
            <span className="batches-step-num">3</span>
            <span>Review</span>
          </div>
          <div className={`batches-wizard-step ${step === "COMPLETE" ? "is-active is-done" : ""}`}>
            <span className="batches-step-num">4</span>
            <span>Committed</span>
          </div>
        </div>

        {error && (
          <div className="admin-notice error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === "UPLOAD" && (
          <div className="batches-wizard-content">
            <div className="batches-dropzone">
              <input
                type="file"
                id="batch-csv-upload"
                accept=".csv"
                onChange={handleFileChange}
                className="sr-only"
              />
              <label htmlFor="batch-csv-upload" className="batches-dropzone-label">
                <span className="batches-dropzone-icon">📁</span>
                <strong>{file ? file.name : "Choose CSV or drag and drop"}</strong>
                <p>Standard offline packaging lot manifest (max 5,000 rows)</p>
              </label>
            </div>

            <div className="batches-wizard-meta-row">
              <button
                type="button"
                className="batches-link-btn"
                onClick={downloadTemplate}
              >
                Download sample template CSV
              </button>
            </div>

            <div className="batches-dialog-footer">
              <button
                type="button"
                className="admin-button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-button primary"
                disabled={!file}
                onClick={validateFile}
              >
                Validate file →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VALIDATING SPINNER */}
        {step === "VALIDATING" && (
          <div className="batches-wizard-loading">
            <div className="batches-spinner" />
            <strong>Validating manifest format and uniqueness…</strong>
            <p>Checking rows against cryptographic constraints in D1/Supabase.</p>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === "REVIEW" && preview && (
          <div className="batches-wizard-content">
            <div className="batches-review-summary">
              <div className="batches-review-stat">
                <span>Lot Reference</span>
                <strong>{preview.reference}</strong>
              </div>
              <div className="batches-review-stat">
                <span>Identities</span>
                <strong>{formatQuantity(preview.count)}</strong>
              </div>
              <div className="batches-review-stat">
                <span>Channel</span>
                <strong>Offline retail</strong>
              </div>
              <div className="batches-review-stat">
                <span>Status</span>
                <strong>Unactivated Inventory</strong>
              </div>
            </div>

            {preview.alreadyImported ? (
              <div className="admin-notice" role="status">
                <span>
                  This batch was previously recorded. All {formatQuantity(preview.count)} records remain secure.
                </span>
              </div>
            ) : (
              <div className="batches-review-checklist">
                <p>✓ All {formatQuantity(preview.count)} rows parsed successfully</p>
                <p>✓ Serial numbers match expected lot pattern ({preview.reference}-XXXX)</p>
                <p>✓ Zero duplicate public identifiers found</p>
                <p>✓ All QR codes will be staged as UNACTIVATED inventory</p>
              </div>
            )}

            <div className="batches-dialog-footer">
              <button
                type="button"
                className="admin-button"
                onClick={() => setStep("UPLOAD")}
              >
                ← Back
              </button>
              <button
                type="button"
                className="admin-button primary"
                onClick={commitImport}
              >
                {preview.alreadyImported ? "Confirm & Close" : `Confirm & import ${formatQuantity(preview.count)} identities`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: IMPORTING SPINNER */}
        {step === "IMPORTING" && (
          <div className="batches-wizard-loading">
            <div className="batches-spinner" />
            <strong>Importing physical batch…</strong>
            <p>Atomic insert of identities into database and audit log.</p>
          </div>
        )}

        {/* COMPLETE */}
        {step === "COMPLETE" && preview && (
          <div className="batches-wizard-complete">
            <span className="batches-complete-icon">✓</span>
            <strong>Batch import confirmed</strong>
            <p>
              {preview.reference}: {formatQuantity(preview.count)} physical retail QR identities successfully recorded.
            </p>
            <div className="batches-dialog-footer">
              <button
                type="button"
                className="admin-button primary"
                onClick={() => {
                  resetState();
                  onOpenChange(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
