"use client";
import { useState } from "react";
import { AdminDialog } from "./AdminDialog";

interface Preview {
  reference: string;
  count: number;
  alreadyImported: boolean;
}
export function OfflineQrImport({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false),
    [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function submit(confirmed = false) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("confirmed", String(confirmed));
      const response = await fetch("/api/inventory/import", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "We couldn't import this batch. Please try again.",
        );
      if (confirmed || result.data.alreadyImported) {
        setNotice(
          `${result.data.reference}: ${result.data.count.toLocaleString("en-IN")} offline QR identities ${result.data.alreadyImported ? "already imported" : "imported"}; no QRs activated.`,
        );
        setOpen(false);
        setPreview(null);
        setFile(null);
        onImported();
      } else setPreview(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="admin-button primary"
        onClick={() => {
          setOpen(true);
          setError("");
        }}
      >
        Import offline batch
      </button>
      {notice && <p role="status">{notice}</p>}
      {open && (
        <AdminDialog
          title="Import offline QR inventory"
          footer={
            <div className="admin-dialog-action-row">
              <button
                className="admin-button"
                disabled={busy}
                onClick={() => {
                  setOpen(false);
                  setPreview(null);
                  setFile(null);
                }}
              >
                Cancel
              </button>
              <button
                className="admin-button primary"
                disabled={!file || busy}
                onClick={() => void submit(!!preview)}
              >
                {busy
                  ? "Checking…"
                  : preview
                    ? "Add unactivated offline batch"
                    : "Review batch"}
              </button>
            </div>
          }
          onClose={() => {
            if (!busy) {
              setOpen(false);
              setPreview(null);
              setFile(null);
            }
          }}
        >
          <p>
            Import existing offline identities as unactivated inventory. Online
            orders use system-generated QRs.
          </p>
          <label className="admin-section-label" htmlFor="offline-qr-file">
            Offline batch CSV
          </label>
          <input
            id="offline-qr-file"
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setPreview(null);
              setError("");
            }}
          />
          {preview && (
            <div className="admin-notice">
              <p>
                Batch <strong>{preview.reference}</strong> ·{" "}
                {preview.count.toLocaleString("en-IN")} identities · Offline
                retail · Unactivated.
                <br />
                Activation proofs are not included. These QRs remain locked
                until proofs are configured and activation is verified.
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="admin-notice error">
              {error}
            </p>
          )}
        </AdminDialog>
      )}
    </>
  );
}
