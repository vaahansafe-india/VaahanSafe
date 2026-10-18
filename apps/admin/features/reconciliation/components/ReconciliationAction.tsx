"use client";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@vaahansafe/ui/components/alert-dialog";
import { toast } from "@vaahansafe/ui/components/sonner";
import { EmailVerification } from "../../../components/EmailVerification";
import { mutateNetwork } from "../../network/mutation";
import {
  reconciliationLabel,
  type ReconciliationDetail,
} from "../reconciliation.types";
export function ReconciliationAction({
  detail,
  action,
  onClose,
  onChanged,
}: {
  detail: ReconciliationDetail;
  action: string;
  onClose: () => void;
  onChanged: (inventory: boolean) => Promise<void>;
}) {
  const r = detail.record,
    [reason, setReason] = useState(""),
    [counted, setCounted] = useState(String(r.counted_quantity)),
    [damaged, setDamaged] = useState(String(r.damaged_quantity || 0)),
    [missingCodes, setMissingCodes] = useState(""),
    [damagedCodes, setDamagedCodes] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false),
    request = useRef<{ key: string; id: string } | null>(null);
  const risky = ["adjust", "cancel"].includes(action);
  const title =
    action === "adjust"
      ? "Apply identity-level stock adjustment"
      : action === "complete"
        ? "Complete physical count"
        : `${reconciliationLabel(action)} reconciliation`;
  const descriptions: Record<string, string> = {
    save: "Save this physical count as a draft. The snapshot and inventory remain unchanged.",
    complete:
      "Confirm your observed count. Any difference opens a variance investigation; inventory is not adjusted.",
    investigate: "Start investigating this physical stock difference.",
    recount:
      "Request another physical count against the same preserved snapshot.",
    resolve:
      "Classify the variance and record your findings. Missing and surplus quantities must match the observed difference. Inventory stays unchanged.",
    approve:
      "Approve this recorded resolution. Inventory adjustments require a separate identity-level confirmation.",
    adjust:
      "Only the specific missing or damaged QR identities in this snapshot will become Lost or Damaged. Active, assigned, changed or transfer-reserved identities are rejected. This action is audited.",
    close:
      "Close this reviewed reconciliation. The historical variance remains visible. Closing alone does not change inventory.",
    cancel:
      "Cancel this unfinished physical count. Its snapshot, events and audit evidence are retained.",
  };
  const parseCodes = (v: string) =>
    v
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map((v) => v.replace(/[‐‑–—]/g, "-"));
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const values =
        action === "save" || action === "complete"
          ? { counted: Number(counted) }
          : action === "resolve"
            ? {
                missing: Math.max(-r.variance, 0),
                extra: Math.max(r.variance, 0),
                damaged: Number(damaged),
              }
            : action === "adjust"
              ? {
                  missingCodes: parseCodes(missingCodes),
                  damagedCodes: parseCodes(damagedCodes),
                }
              : {};
      const payload = {
        action,
        revision: r.revision,
        values,
        reason: reason.trim(),
      };
      const key = JSON.stringify(payload);
      if (request.current?.key !== key)
        request.current = { key, id: crypto.randomUUID() };
      await mutateNetwork(`/api/reconciliation/${r.id}`, {
        ...payload,
        requestId: request.current.id,
      });
      toast.success(
        action === "adjust"
          ? "Stock adjustment recorded."
          : `${reconciliationLabel(action)} recorded.`,
      );
      await onChanged(action === "adjust");
      onClose();
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      setError(
        e instanceof Error ? e.message : "This action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };
  const content = (
    <>
      <p className="rc-eyebrow">
        {r.reference_code} · {r.custodian_name}
      </p>
      <div className="rc-action-balance">
        <span>
          Ledger <b>{r.expected_quantity}</b>
        </span>
        <span>
          Physical{" "}
          <b>{r.phase === "COUNTING" ? "Draft" : r.counted_quantity}</b>
        </span>
        <span>
          Variance <b>{r.variance}</b>
        </span>
      </div>
      {["save", "complete"].includes(action) && (
        <label className="rc-field">
          Physical quantity
          <input
            type="number"
            min="0"
            max="100000"
            value={counted}
            onChange={(e) => {
              setCounted(e.target.value);
              setConfirmed(false);
            }}
          />
        </label>
      )}
      {action === "resolve" && (
        <>
          <p>
            {Math.max(-r.variance, 0)} missing · {Math.max(r.variance, 0)}{" "}
            unexpected units. Damaged units are included in the physical count.
          </p>
          <label className="rc-field">
            Damaged units
            <input
              type="number"
              min="0"
              max={r.counted_quantity}
              value={damaged}
              onChange={(e) => setDamaged(e.target.value)}
            />
          </label>
        </>
      )}
      {action === "adjust" && (
        <>
          <label className="rc-field">
            Missing QR identities · {r.missing_quantity || 0} required
            <textarea
              value={missingCodes}
              onChange={(e) => {
                setMissingCodes(e.target.value);
                setConfirmed(false);
              }}
              placeholder="Printed VaahanSafe IDs, one per line"
            />
          </label>
          <label className="rc-field">
            Damaged QR identities · {r.damaged_quantity || 0} required
            <textarea
              value={damagedCodes}
              onChange={(e) => {
                setDamagedCodes(e.target.value);
                setConfirmed(false);
              }}
              placeholder="Printed VaahanSafe IDs, one per line"
            />
          </label>
        </>
      )}
      <label className="rc-field">
        Operational reason / reference
        <textarea
          required
          minLength={10}
          maxLength={500}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setConfirmed(false);
          }}
        />
      </label>
      <small>
        10–500 characters. Saved in the protected operational trail.
      </small>
      <label className="rc-confirm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I checked the stock, quantities and consequences.
      </label>
      {stepUp && (
        <EmailVerification
          stepUp
          onVerified={() => {
            setStepUp(false);
            setError("");
          }}
        />
      )}
      {error && (
        <div role="alert" className="rc-error">
          {error}
        </div>
      )}
      <div className="rc-actions">
        {risky ? (
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        ) : (
          <button className="rc-button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
        )}
        <button
          className="rc-button rc-primary"
          disabled={
            busy ||
            !confirmed ||
            reason.trim().length < 10 ||
            stepUp ||
            (["save", "complete"].includes(action) &&
              (!counted ||
                !Number.isInteger(Number(counted)) ||
                Number(counted) < 0 ||
                Number(counted) > 100000))
          }
          onClick={() => void submit()}
        >
          {busy ? "Saving…" : title}
        </button>
      </div>
    </>
  );
  return risky ? (
    <AlertDialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <AlertDialogContent className="rc-dialog">
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{descriptions[action]}</AlertDialogDescription>
        {content}
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent className="rc-dialog">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{descriptions[action]}</DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
