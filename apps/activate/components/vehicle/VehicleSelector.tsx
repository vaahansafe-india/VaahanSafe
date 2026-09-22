"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@vaahansafe/ui/components";
import { InlineAddVehicle } from "./InlineAddVehicle";
import type { EligibleVehicleDto } from "@/lib/types";

interface VehicleSelectorProps {
  onVehicleSelected: (vehicle: EligibleVehicleDto) => void;
}

export function VehicleSelector({ onVehicleSelected }: VehicleSelectorProps) {
  const [vehicles, setVehicles] = useState<EligibleVehicleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchVehicles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activate/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      } else {
        setError("Could not load your registered vehicles. Please try again.");
      }
    } catch {
      setError("Network error while loading vehicles.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleVehicleAdded = (newVehicle: EligibleVehicleDto) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    onVehicleSelected(newVehicle);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground font-normal tracking-tight">
              Select Your Vehicle
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed pt-1">
              Choose the vehicle to connect with this QR sticker, or register a new vehicle.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary hover:underline self-start sm:self-auto py-1"
          >
            <span>+</span>
            <span>Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="border-t border-border pt-8 pb-12 text-center space-y-3">
          <div className="mx-auto h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="font-mono text-xs text-muted-foreground">Querying vehicle registry...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-2">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={fetchVehicles}
            className="h-8 text-xs font-mono"
          >
            Try Again
          </Button>
        </div>
      ) : vehicles.length === 0 ? (
        /* Zero State */
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-4">
          <div className="space-y-1">
            <h3 className="font-mono text-xs font-semibold uppercase text-foreground">
              No Vehicles Registered
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your vehicle make, model, and registration number to bind this QR.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold uppercase tracking-wider"
          >
            + Add Vehicle Profile
          </Button>
        </div>
      ) : (
        /* Registry Line List (Not Cards) */
        <div className="space-y-0 border-t border-border">
          <div className="py-2.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border">
            <span>Eligible Vehicles</span>
            <span>{vehicles.length} Available</span>
          </div>

          <div className="divide-y divide-border">
            {vehicles.map((v, idx) => {
              const numStr = String(idx + 1).padStart(2, "0");
              const isMotorcycle = v.vehicleType === "MOTORCYCLE" || v.vehicleType === "SCOOTER";

              return (
                <div
                  key={v.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs font-semibold text-muted-foreground pt-0.5">
                      {numStr}
                    </span>
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground">
                        {v.make} {v.model}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                        <span>{isMotorcycle ? "Two Wheeler" : "Car"}</span>
                        <span>•</span>
                        <span>{v.maskedRegistration}</span>
                        {v.primaryColor && (
                          <>
                            <span>•</span>
                            <span>{v.primaryColor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center pl-8 sm:pl-0">
                    {v.hasActiveQr ? (
                      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        Active QR Bound
                      </span>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => onVehicleSelected(v)}
                        variant="outline"
                        className="h-9 px-4 rounded-lg text-xs font-mono font-medium border-border hover:border-primary hover:text-primary transition-colors"
                      >
                        <span>SELECT</span>
                        <span className="ml-1 text-muted-foreground">→</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inline Add Modal */}
      <InlineAddVehicle
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onVehicleAdded={handleVehicleAdded}
      />
    </div>
  );
}
