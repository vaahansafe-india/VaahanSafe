"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@vaahansafe/ui";
import { VaahanIcon } from "@vaahansafe/icons";
import type { VehicleRegistryItem, VehicleCategory } from "@/lib/vehicle-types";

interface VehicleDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleRegistryItem | null;
  onSuccess?: () => void;
}

export function VehicleDetailsSheet({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: VehicleDetailsSheetProps) {
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [type, setType] = React.useState<VehicleCategory>("CAR");
  const [year, setYear] = React.useState("");
  const [color, setColor] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setType(vehicle.type);
      setYear(vehicle.year ? String(vehicle.year) : "");
      setColor(vehicle.color || "");
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make,
          model,
          type,
          year: year ? Number(year) : null,
          color: color.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update vehicle");
      }

      toast.success("Vehicle updated.");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "We couldn't update this vehicle. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card p-6 border-l border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
            MANAGE VEHICLE IDENTITY
          </div>
          <SheetTitle className="font-serif text-2xl font-medium text-foreground">
            {vehicle.make} {vehicle.model}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground font-mono">
            Plate: {vehicle.registrationNumberMasked} &bull; ID: {vehicle.identityId}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Read-Only Registration Plate */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Official Plate Number
            </label>
            <div className="mt-1.5 flex h-10 w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 font-mono text-sm font-bold text-foreground">
              <span>{vehicle.registrationNumber}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#5db8a6]">RTO Verified</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Plate numbers are tied to the official identity and cannot be altered directly.
            </p>
          </div>

          {/* Vehicle Category */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-foreground/80 mb-1.5">
              Vehicle Type
            </label>
            <Select
              value={type}
              onValueChange={(val) => setType(val as VehicleCategory)}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-border bg-background px-3 text-sm text-foreground focus:ring-[#cc785c]">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAR">Car / SUV / Sedan</SelectItem>
                <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                <SelectItem value="SCOOTER">Scooter</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial Transport</SelectItem>
                <SelectItem value="OTHER">Other Registered Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-make" className="block font-mono text-xs uppercase tracking-wider text-foreground/80">
                Make *
              </label>
              <input
                id="edit-make"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30"
              />
            </div>
            <div>
              <label htmlFor="edit-model" className="block font-mono text-xs uppercase tracking-wider text-foreground/80">
                Model *
              </label>
              <input
                id="edit-model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30"
              />
            </div>
          </div>

          {/* Year & Color */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-year" className="block font-mono text-xs uppercase tracking-wider text-foreground/80">
                Manufacturing Year
              </label>
              <input
                id="edit-year"
                type="number"
                min={1950}
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2022"
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30"
              />
            </div>
            <div>
              <label htmlFor="edit-color" className="block font-mono text-xs uppercase tracking-wider text-foreground/80">
                Primary Color
              </label>
              <input
                id="edit-color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Silver, Pearl White"
                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-2 focus:ring-[#cc785c]/30"
              />
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-border flex sm:justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
