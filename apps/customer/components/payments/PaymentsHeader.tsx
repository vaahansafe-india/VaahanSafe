"use client";

import { VaahanIcon } from "@vaahansafe/icons";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";

interface PaymentsHeaderProps {
  totalConfirmedMinor: number;
  totalConfirmedCount: number;
  selectedVehicleId: string;
  vehicles: Array<{ id: string; plateNumber: string; label: string }>;
  onVehicleChange: (vehicleId: string) => void;
}

export function PaymentsHeader({
  totalConfirmedMinor,
  totalConfirmedCount,
  selectedVehicleId,
  vehicles,
  onVehicleChange,
}: PaymentsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/80 pb-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          <span>Financial Records</span>
          <span className="h-1 w-1 rounded-full bg-[#cc785c]" />
          <span className="text-muted-foreground">Authoritative Ledger</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-tight text-foreground">
          Payments
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
          Review payments connected to your VaahanSafe orders and services. All transactions are verified through server-validated Cashfree webhook signatures.
        </p>
      </div>

      {vehicles.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 self-start md:self-end">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <VaahanIcon name="vehicle" size={13} className="text-[#cc785c]" />
            <span>Scope:</span>
          </span>
          <div className="min-w-[170px]">
            <Select
              value={selectedVehicleId}
              onValueChange={onVehicleChange}
            >
              <SelectTrigger className="h-8.5 rounded-lg border-border bg-card px-2.5 font-mono text-xs text-foreground focus:ring-[#cc785c]">
                <SelectValue placeholder="All Connected Vehicles">
                  {selectedVehicleId === "all"
                    ? "All Connected Vehicles"
                    : (vehicles.find((v) => v.id === selectedVehicleId)?.plateNumber ?? "All Connected Vehicles")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-card font-mono text-xs text-foreground">
                <SelectItem value="all">All Connected Vehicles</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
