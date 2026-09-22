"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Button,
} from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";
import type { EligibleVehicleDto } from "@/lib/types";

interface InlineAddVehicleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleAdded: (vehicle: EligibleVehicleDto) => void;
}

export function InlineAddVehicle({
  open,
  onOpenChange,
  onVehicleAdded,
}: InlineAddVehicleProps) {
  const [vehicleType, setVehicleType] = useState<"CAR" | "TWO_WHEELER">("CAR");
  const [registration, setRegistration] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registration.trim() || !make.trim() || !model.trim()) {
      setError("Vehicle registration number, make, and model are required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/activate/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: registration.trim(),
          make: make.trim(),
          model: model.trim(),
          vehicleType,
          primaryColor: color.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.vehicle) {
        onVehicleAdded(data.vehicle);
        onOpenChange(false);
        setRegistration("");
        setMake("");
        setModel("");
        setColor("");
      } else {
        setError(data.error || "Failed to register vehicle. Please check details.");
      }
    } catch {
      setError("Network error. Could not reach vehicle registration service.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="pr-8 sm:pr-0">
          <DialogTitle className="text-base sm:text-lg font-bold tracking-tight">
            Add Vehicle Profile
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Register your vehicle to bind it to this VaahanSafe QR sticker.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVehicleType("CAR")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                vehicleType === "CAR"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <VaahanIcon name="car" size={16} />
              <span>Car / 4-Wheeler</span>
            </button>

            <button
              type="button"
              onClick={() => setVehicleType("TWO_WHEELER")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                vehicleType === "TWO_WHEELER"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              <VaahanIcon name="motorcycle" size={16} />
              <span>Two-Wheeler</span>
            </button>
          </div>

          {/* Registration Number */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-muted-foreground">
              Registration Number (RC Plate)
            </label>
            <Input
              type="text"
              value={registration}
              onChange={(e) => {
                setRegistration(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="e.g. DL 01 AB 1234"
              required
              className="font-mono text-sm tracking-wider uppercase h-11"
            />
          </div>

          {/* Make and Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-muted-foreground">Make</label>
              <Input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Hyundai, Tata"
                required
                className="h-11 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-muted-foreground">Model</label>
              <Input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Creta, Nexon"
                required
                className="h-11 text-xs"
              />
            </div>
          </div>

          {/* Primary Color */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-muted-foreground">
              Vehicle Color (Optional)
            </label>
            <Input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Polar White, Phantom Black"
              className="h-11 text-xs"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1.5 font-medium pt-1">
              <VaahanIcon name="alert" size={13} />
              <span>{error}</span>
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-11 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !registration.trim() || !make.trim() || !model.trim()}
              className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
            >
              {isLoading ? "Saving Vehicle..." : "Save Vehicle & Select"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
