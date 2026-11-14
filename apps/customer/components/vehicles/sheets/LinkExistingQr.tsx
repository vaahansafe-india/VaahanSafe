"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vaahansafe/ui";
import { useCustomerScope } from "@/components/query/CustomerQueryProvider";
import { customerQueryOptions } from "@/lib/customer-queries";
import { useSecondaryQrVehicleMutation } from "@/lib/use-secondary-qr-vehicle-mutation";

export function LinkExistingQr({ vehicleId, onLinked }: {
  vehicleId: string;
  onLinked: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const panelId = useId();
  const selectId = `${panelId}-qr`;
  const scope = useCustomerScope();
  const router = useRouter();
  const candidates = useQuery({
    ...customerQueryOptions(scope, "qr-linkable", new URLSearchParams({ vehicle: vehicleId }).toString()),
    enabled: expanded,
  });
  const mutation = useSecondaryQrVehicleMutation();
  const selectedId = candidates.data?.some(({ id }) => id === selected) ? selected : "";

  async function linkVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync({ qrId: selectedId, vehicleId, attach: true });
      toast.success("Vehicle linked to your existing VaahanSafe ID.");
      onLinked();
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't link this QR. Please try again.");
      void candidates.refetch();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        disabled={mutation.isPending}
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all hover:bg-muted/40"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
            <VaahanIcon name="qr" size={16} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-xs font-semibold text-foreground">Link Existing QR</span>
            <span className="block text-[11px] text-muted-foreground">Add this vehicle to a VaahanSafe ID you already use</span>
          </span>
        </span>
        <VaahanIcon name="arrow-right" size={14} aria-hidden="true" className={`shrink-0 text-muted-foreground ${expanded ? "rotate-90" : ""}`} />
      </button>

      <div id={panelId} hidden={!expanded} className="space-y-3 border-t border-border p-3.5">
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        {candidates.isPending ? (
          <p role="status" className="text-xs text-muted-foreground">Checking your existing QRs…</p>
        ) : candidates.isError ? (
          <div className="space-y-2">
            <p role="alert" className="text-xs text-muted-foreground">We couldn&apos;t load your QRs. Please try again.</p>
            <Button type="button" variant="outline" size="sm" disabled={candidates.isFetching} onClick={() => void candidates.refetch()}>
              Try again
            </Button>
          </div>
        ) : !candidates.data.length ? (
          <p className="text-xs text-muted-foreground">You don&apos;t have an active QR with room for this vehicle. Each VaahanSafe ID supports up to two vehicles.</p>
        ) : (
          <form onSubmit={linkVehicle} className="space-y-2">
            <div className="space-y-1.5">
              <label htmlFor={selectId} className="block text-xs font-medium text-foreground">
                Choose a VaahanSafe ID
              </label>
              <Select
                required
                value={selectedId}
                onValueChange={(id) => { setSelected(id); setError(""); }}
                disabled={mutation.isPending}
              >
                <SelectTrigger id={selectId} className="rounded-lg border-border bg-background text-xs data-[placeholder]:text-muted-foreground">
                  <SelectValue placeholder="Select an existing QR" />
                </SelectTrigger>
                <SelectContent className="z-[60] rounded-lg border-border">
                  {candidates.data.map(({ id, visible_code, registration_number }) => (
                    <SelectItem value={id} key={id} className="text-xs">
                      {visible_code} · {registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={!selectedId || mutation.isPending || candidates.isFetching}>
              {mutation.isPending ? "Linking…" : "Link this vehicle"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
