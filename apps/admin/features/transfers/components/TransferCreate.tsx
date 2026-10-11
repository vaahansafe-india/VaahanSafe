"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@vaahansafe/ui/components/sonner";
import { EmailVerification } from "../../../components/EmailVerification";
import { VaahanIcon } from "@vaahansafe/icons";
import type { AdminIdentity } from "../../../lib/contracts";
import type { InventoryOption, PartnerOption } from "../transfer.types";
import {
  TransferPicker,
  TransferError,
  transferScope,
  useTransferRefresh,
} from "./TransferShared";
import { getAdminData } from "../../../lib/client-api";
import { sendTransfer } from "./TransferAction";
export function TransferCreate({ identity }: { identity: AdminIdentity }) {
  const [step, setStep] = useState(0),
    [source, setSource] = useState<PartnerOption | null>(null),
    [destination, setDestination] = useState<PartnerOption | null>(null),
    [allocations, setAllocations] = useState<
      (InventoryOption & { quantity: number })[]
    >([]),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stepUp, setStepUp] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    request = useRef<{ fingerprint: string; id: string } | null>(null),
    router = useRouter(),
    refresh = useTransferRefresh(identity);
  const stock = useQuery({
    queryKey: [
      ...transferScope(identity),
      "eligible-inventory",
      source?.id || "",
    ],
    queryFn: ({ signal }) =>
      getAdminData<InventoryOption[]>(
        `/api/transfers/options?kind=inventory&source=${encodeURIComponent(source?.id || "")}`,
        signal,
      ),
    enabled: step === 1,
    staleTime: 15000,
    retry: 1,
  });
  const steps = [
      "Custody route",
      "Eligible inventory",
      "Quantity",
      "Review & request",
    ],
    total = allocations.reduce((n, a) => n + a.quantity, 0),
    valid =
      allocations.length > 0 &&
      total <= 5000 &&
      allocations.every(
        (a) =>
          Number.isInteger(a.quantity) &&
          a.quantity >= 1 &&
          a.quantity <= a.available,
      );
  const save = async () => {
    setBusy(true);
    setError("");
    const values = {
        source: source?.id || null,
        destination: destination?.id,
        allocations: allocations.map((a) => ({
          batch: a.id,
          quantity: a.quantity,
        })),
      },
      base = { action: "request", values, reason },
      fingerprint = JSON.stringify(base);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const r = await sendTransfer("/api/transfers", {
        ...base,
        requestId: request.current.id,
      });
      await refresh();
      toast.success("Transfer requested. Inventory reserved.");
      router.push(`/transfers/${r.id}`);
    } catch (e) {
      if ((e as { code?: string }).code === "STEP_UP_REQUIRED") setStepUp(true);
      else setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="tr-workspace tr-create">
      <Link className="tr-back" href="/transfers">
        <VaahanIcon name="arrow-left" size={13} className="shrink-0" />
        <span>Transfers</span>
      </Link>
      <header className="tr-header">
        <div>
          <p className="tr-eyebrow">NEW STOCK MOVEMENT</p>
          <h1>Create transfer</h1>
          <p>
            Reserve eligible printed inventory for a verified custody route.
          </p>
        </div>
      </header>
      <ol className="tr-create-steps" aria-label="Create transfer steps">
        {steps.map((s, i) => (
          <li
            key={s}
            aria-current={step === i ? "step" : undefined}
            className={i <= step ? "done" : ""}
          >
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) setStep(step + 1);
          else void save();
        }}
      >
        {stepUp ? (
          <EmailVerification stepUp onVerified={() => setStepUp(false)} />
        ) : (
          <section className="tr-create-panel">
            <p className="tr-eyebrow">STEP {step + 1} OF 4</p>
            <h2>{steps[step]}</h2>
            {step === 0 && (
              <>
                <label className="tr-check">
                  <input
                    type="checkbox"
                    checked={!source}
                    onChange={() => {
                      setSource(null);
                      setDestination(null);
                      setAllocations([]);
                    }}
                  />
                  Source: Central inventory
                </label>
                <label>
                  Or choose an active distributor
                  <TransferPicker
                    identity={identity}
                    label="Choose source distributor"
                    partnerKind="DISTRIBUTOR"
                    active
                    value={source?.id || ""}
                    onChange={(_v, p) => {
                      setSource(p as PartnerOption | null);
                      setDestination(null);
                      setAllocations([]);
                    }}
                    predicate={(p) =>
                      p.kind === "DISTRIBUTOR" && p.status === "ACTIVE"
                    }
                  />
                </label>
                <label>
                  Destination *
                  <TransferPicker
                    identity={identity}
                    label={
                      source ? "Choose verified retailer" : "Choose distributor"
                    }
                    partnerKind={source ? "RETAILER" : "DISTRIBUTOR"}
                    source={source?.id || ""}
                    active
                    value={destination?.id || ""}
                    onChange={(_v, p) =>
                      setDestination(p as PartnerOption | null)
                    }
                    predicate={(p) =>
                      p.status === "ACTIVE" &&
                      (source
                        ? p.kind === "RETAILER" &&
                          p.verification_status === "VERIFIED" &&
                          p.parent_distributor_id === source.id
                        : p.kind === "DISTRIBUTOR")
                    }
                  />
                </label>
                <p className="tr-muted">
                  Supported routes: Central inventory → Distributor, and
                  Distributor → its verified Retailer. Destination eligibility
                  is checked on the server.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <p>
                  {source?.name || "Central inventory"} → {destination?.name}
                </p>
                {stock.isPending ? (
                  <p role="status">Checking eligible inventory…</p>
                ) : stock.isError ? (
                  <TransferError
                    message="We couldn't check eligible inventory. Please try again."
                    retry={stock.refetch}
                  />
                ) : stock.data.length === 0 ? (
                  <div className="tr-attention" role="status">
                    <h3>No eligible retail stock</h3>
                    <p>
                      {source ? `${source.name} has no eligible received stock. First release verified stickers from a completed print job, then record Central inventory → ${source.name} and acknowledged receipt. After receipt, return here to supply the retailer.` : "Release verified stickers from a completed print job in QR Inventory before requesting central stock. Only released, unassigned retail stock can be reserved."}
                    </p>
                    <Link href="/inventory" className="inline-flex items-center gap-1.5">
                      <span>Review QR Inventory</span>
                      <VaahanIcon name="arrow-right" size={13} className="shrink-0" />
                    </Link>
                    {source && <button type="button" className="tr-primary" onClick={() => { setDestination(source); setSource(null); setAllocations([]); setConfirmed(false); setError(""); }}>Check central stock for {source.name}</button>}
                  </div>
                ) : (
                  <>
                    <TransferPicker
                      identity={identity}
                      label="Choose eligible printed batch"
                      kind="inventory"
                      source={source?.id || ""}
                      value=""
                      onChange={(_v, p) => {
                        if (
                          p &&
                          !allocations.some((a) => a.id === p.id) &&
                          allocations.length < 20
                        )
                          setAllocations((a) => [
                            ...a,
                            { ...(p as InventoryOption), quantity: 1 },
                          ]);
                      }}
                    />
                    <p className="tr-muted">
                      Only printed, unassigned retail stock is eligible.
                      Reserved or quarantined stock is excluded. Choose up to 20
                      batches.
                    </p>
                  </>
                )}
                {allocations.map((a) => (
                  <div className="tr-allocation" key={a.id}>
                    <strong>{a.reference_code}</strong>
                    <span>{a.available} available</span>
                    <button
                      type="button"
                      aria-label={`Remove batch ${a.reference_code}`}
                      onClick={() =>
                        setAllocations((s) => s.filter((x) => x.id !== a.id))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </>
            )}
            {step === 2 && (
              <>
                <p>
                  Allocate quantities from each selected batch. Maximum 5,000 QR
                  units per transfer.
                </p>
                {allocations.map((a) => (
                  <label className="tr-allocation" key={a.id}>
                    <span>
                      <strong>{a.reference_code}</strong>
                      <small>{a.available} currently available</small>
                    </span>
                    <input
                      type="number"
                      aria-label={`Quantity from ${a.reference_code}`}
                      min={1}
                      max={a.available}
                      step={1}
                      value={Number.isNaN(a.quantity) ? "" : a.quantity}
                      onChange={(e) =>
                        setAllocations((s) =>
                          s.map((x) =>
                            x.id === a.id
                              ? {
                                  ...x,
                                  quantity:
                                    e.target.value === ""
                                      ? NaN
                                      : Number(e.target.value),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
                <p>
                  <strong>
                    {Number.isFinite(total) ? total : 0} QR units requested
                  </strong>
                </p>
                {!valid && (
                  <p role="alert" className="tr-error">
                    Enter whole quantities within available stock, up to 5,000
                    units in total.
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <div className="tr-route">
                  <div>
                    <small>SOURCE</small>
                    <strong>{source?.name || "Central inventory"}</strong>
                  </div>
                  <span aria-hidden className="inline-flex items-center">
                    <VaahanIcon name="arrow-right" size={14} className="opacity-60" />
                  </span>
                  <div>
                    <small>DESTINATION</small>
                    <strong>{destination?.name}</strong>
                  </div>
                </div>
                {allocations.map((a) => (
                  <div className="tr-allocation" key={a.id}>
                    <strong>{a.reference_code}</strong>
                    <span>{a.quantity} units</span>
                  </div>
                ))}
                <p>
                  <strong>{total} units will be reserved.</strong> A separate
                  approval is required before dispatch. This request does not
                  move physical custody or enable owner services.
                </p>
                <label>
                  Operational reason / reference *
                  <textarea
                    required
                    minLength={10}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <small>
                    10–500 characters. Saved with the accountable request.
                  </small>
                </label>
                <label className="tr-check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  I reviewed the route and physical inventory quantities.
                </label>
              </>
            )}
          </section>
        )}
        {error && (
          <p role="alert" className="tr-error">
            {error}
          </p>
        )}
        <div className="tr-create-footer">
          <button
            type="button"
            disabled={busy || step === 0}
            onClick={() => {
              setStep(step - 1);
              setError("");
            }}
          >
            Back
          </button>
          <span>
            {total || 0} units · {allocations.length} batches
          </span>
          {!stepUp && (
            <button
              className="tr-primary"
              disabled={
                busy ||
                (step === 0 && !destination) ||
                (step === 1 && !allocations.length) ||
                (step === 2 && !valid) ||
                (step === 3 &&
                  (!valid || !confirmed || reason.trim().length < 10))
              }
            >
              {busy
                ? "Reserving…"
                : step === 3
                  ? "Request & reserve inventory"
                  : "Continue"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
