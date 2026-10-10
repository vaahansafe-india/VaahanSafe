"use client";
import { useState } from "react";
import { AdminDialog } from "./AdminDialog";
import { AdminSelect } from "./AdminSelect";
import type { AdminRow } from "../lib/contracts";

export function OfflineActivationCodes({ batches }: { batches: AdminRow[] }) {
  const [open, setOpen] = useState(false),
    [batch, setBatch] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const offline = batches.filter(
    (b) => b.inventory_channel === "OFFLINE_RETAIL",
  );
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/batches/${encodeURIComponent(batch)}/activation-codes`,
        { method: "POST" },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error?.message ||
            "We couldn't configure activation codes. Please try again.",
        );
      setNotice(
        `${result.data.reference}: ${result.data.count.toLocaleString("en-IN")} private activation codes ${result.data.alreadyProvisioned ? "already stored" : "generated and securely stored"}. Encrypted packaging archive saved. All QRs remain unactivated.`,
      );
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="admin-button"
        disabled={!offline.length}
        onClick={() => {
          setBatch(String(offline[0]?.id || ""));
          setError("");
          setOpen(true);
        }}
      >
        Generate activation codes
      </button>
      {notice && <p role="status">{notice}</p>}
      {open && (
        <AdminDialog
          title="Generate private activation codes"
          footer={
            <div className="admin-dialog-action-row">
              <button
                className="admin-button"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="admin-button primary"
                disabled={!batch || busy}
                onClick={() => void generate()}
              >
                {busy ? "Securing codes…" : "Generate and store codes"}
              </button>
            </div>
          }
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          <p>
            Generate one private code per sticker, save secure hashes, and
            preserve an encrypted packaging archive. This keeps every QR
            unactivated. Existing codes are never replaced.
          </p>
          <label htmlFor="activation-code-batch">Offline batch</label>
          <AdminSelect
            label="Offline batch"
            id="activation-code-batch"
            value={batch}
            disabled={busy}
            onValueChange={setBatch}
            options={offline.map((b) => ({
              value: String(b.id),
              label: `${b.reference_code} · ${Number(b.quantity).toLocaleString("en-IN")} stickers`,
            }))}
          />
          {error && (
            <p className="admin-notice error" role="alert">
              {error}
            </p>
          )}
        </AdminDialog>
      )}
    </>
  );
}
