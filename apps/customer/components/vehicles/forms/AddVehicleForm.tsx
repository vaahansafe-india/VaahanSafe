"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Button } from "@vaahansafe/ui";
import {
  normalizeRegistrationNumber,
  isValidRegistrationFormat,
} from "@vaahansafe/vehicles";
import type { VehicleCategory } from "@/lib/vehicle-types";

interface CategoryOption {
  id: VehicleCategory;
  title: string;
  subtitle: string;
  icon: VaahanIconName;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: "CAR",
    title: "Car / SUV / Sedan",
    subtitle: "Personal passenger motor vehicle",
    icon: "car",
  },
  {
    id: "MOTORCYCLE",
    title: "Motorcycle",
    subtitle: "Two-wheeler geared motorcycle",
    icon: "bike",
  },
  {
    id: "SCOOTER",
    title: "Scooter",
    subtitle: "Two-wheeler gearless scooter",
    icon: "bike",
  },
  {
    id: "COMMERCIAL",
    title: "Commercial Transport",
    subtitle: "Goods carrier, taxi, or fleet asset",
    icon: "truck",
  },
  {
    id: "OTHER",
    title: "Other Vehicle",
    subtitle: "Specialized registered asset",
    icon: "vehicle",
  },
];

export function AddVehicleForm() {
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Form fields
  const [type, setType] = React.useState<VehicleCategory>("CAR");
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [make, setMake] = React.useState("");
  const [model, setModel] = React.useState("");
  const [year, setYear] = React.useState("");
  const [color, setColor] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [createdVehicle, setCreatedVehicle] = React.useState<{
    id: string;
    registrationNumber: string;
    make: string;
    model: string;
  } | null>(null);

  // Validation helpers
  const normalizedReg = normalizeRegistrationNumber(registrationNumber);
  const isPlateValid = normalizedReg.length >= 6 && isValidRegistrationFormat(normalizedReg);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlateValid) {
      toast.error("Please enter a valid Indian vehicle plate format (e.g. MH12AB1234 or 22BH1234AA)");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) {
      toast.error("Please provide both make and model");
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: registrationNumber.trim().toUpperCase(),
          type,
          make: make.trim(),
          model: model.trim(),
          year: year ? Number(year) : null,
          color: color.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add vehicle");
      }

      toast.success("Vehicle registered successfully.");
      setCreatedVehicle({
        id: data.vehicle.id,
        registrationNumber: data.vehicle.registration_number,
        make: data.vehicle.make,
        model: data.vehicle.model,
      });
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || "Failed to add vehicle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* 01. Back Link */}
      <div>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
        >
          <VaahanIcon name="arrow-left" size={13} />
          <span>Back to Vehicle Registry</span>
        </Link>
      </div>

      {/* 02. Header */}
      <div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>VAAHANSAFE IDENTITY REGISTRY</span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Add Vehicle
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Connect a physical vehicle to your VaahanSafe account to establish its tamper-evident safety identity.
        </p>
      </div>

      {/* 03. Progress Rail (Hidden when complete) */}
      {step !== 4 && (
        <div className="flex items-center justify-between border-b border-border pb-4 font-mono text-xs">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? "text-[#cc785c] font-bold" : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 1
                  ? "bg-[#cc785c] text-white"
                  : "border border-border text-muted-foreground"
              }`}
            >
              1
            </span>
            <span>01 VEHICLE</span>
          </div>

          <span className="h-px w-8 bg-border" />

          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? "text-[#cc785c] font-bold" : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 2
                  ? "bg-[#cc785c] text-white"
                  : "border border-border text-muted-foreground"
              }`}
            >
              2
            </span>
            <span>02 DETAILS</span>
          </div>

          <span className="h-px w-8 bg-border" />

          <div
            className={`flex items-center gap-2 ${
              step >= 3 ? "text-[#cc785c] font-bold" : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                step >= 3
                  ? "bg-[#cc785c] text-white"
                  : "border border-border text-muted-foreground"
              }`}
            >
              3
            </span>
            <span>03 REVIEW</span>
          </div>
        </div>
      )}

      {/* 04. Multi-Step Flow */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xs">
        {/* Step 1: Category & Plate */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-6">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Select Vehicle Category *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const isSelected = type === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? "border-[#cc785c] bg-[#cc785c]/10 text-foreground ring-1 ring-[#cc785c]"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-[#cc785c] text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <VaahanIcon name={cat.icon} size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {cat.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {cat.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-number"
                className="block font-mono text-xs uppercase tracking-wider text-foreground/80"
              >
                Official Vehicle Registration Number *
              </label>
              <input
                id="reg-number"
                type="text"
                required
                placeholder="e.g. MH 12 AB 1234 or 22 BH 1234 AA"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3.5 font-mono text-base font-bold uppercase tracking-wider text-foreground placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:text-muted-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              />
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Must conform to standard Indian RTO plate format.
                </span>
                {registrationNumber.trim().length > 0 && (
                  <span
                    className={`font-mono font-semibold ${
                      isPlateValid ? "text-[#5db8a6]" : "text-[#e8a55a]"
                    }`}
                  >
                    {isPlateValid ? "Valid Plate Format" : "Invalid Format"}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                type="submit"
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider gap-2 px-6 h-11"
              >
                <span>Continue to Details</span>
                <VaahanIcon name="arrow-right" size={13} />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Make, Model & Specs */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="make-input"
                  className="block font-mono text-xs uppercase tracking-wider text-foreground/80"
                >
                  Make / Manufacturer *
                </label>
                <input
                  id="make-input"
                  type="text"
                  required
                  placeholder="e.g. Hyundai, Honda, Tata, Mahindra"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>

              <div>
                <label
                  htmlFor="model-input"
                  className="block font-mono text-xs uppercase tracking-wider text-foreground/80"
                >
                  Model *
                </label>
                <input
                  id="model-input"
                  type="text"
                  required
                  placeholder="e.g. Creta, City, Nexon, Thar"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="year-input"
                  className="block font-mono text-xs uppercase tracking-wider text-foreground/80"
                >
                  Manufacturing Year (Optional)
                </label>
                <input
                  id="year-input"
                  type="number"
                  min={1950}
                  max={new Date().getFullYear() + 1}
                  placeholder="e.g. 2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>

              <div>
                <label
                  htmlFor="color-input"
                  className="block font-mono text-xs uppercase tracking-wider text-foreground/80"
                >
                  Primary Color (Optional)
                </label>
                <input
                  id="color-input"
                  type="text"
                  placeholder="e.g. Pearl White, Magma Grey"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm text-foreground focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider gap-2 px-6 h-10"
              >
                <span>Review Vehicle</span>
                <VaahanIcon name="arrow-right" size={13} />
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Review Before Create */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                REVIEW VEHICLE IDENTITY SPECIFICATION
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirm the details before establishing this vehicle record in the official VaahanSafe registry.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-muted-foreground">Category</span>
                <span className="font-bold text-foreground">{type}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-muted-foreground">Registration Plate</span>
                <span className="font-bold text-[#cc785c] text-sm">
                  {registrationNumber.trim().toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-muted-foreground">Make / Manufacturer</span>
                <span className="font-semibold text-foreground">{make}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2.5">
                <span className="text-muted-foreground">Model</span>
                <span className="font-semibold text-foreground">{model}</span>
              </div>
              {(year || color) && (
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span className="text-muted-foreground">Year & Color</span>
                  <span className="text-foreground">
                    {year || "N/A"} &bull; {color || "N/A"}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Privacy Protection</span>
                <span className="text-[#5db8a6] font-semibold">Masked Owner Phone</span>
              </div>
            </div>

            {/* Invariant Statement */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Lifecycle Note:</strong> Adding this vehicle establishes its cryptographic record and initializes default privacy protections. A physical QR sticker can be bound immediately or linked later via retail activation.
            </div>

            <div className="pt-4 border-t border-border flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
              >
                Edit
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white font-mono text-xs uppercase tracking-wider gap-2 px-6 h-11"
              >
                {isSubmitting ? "Registering..." : "Confirm & Add Vehicle"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success Transition */}
        {step === 4 && createdVehicle && (
          <div className="text-center py-4 space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5db8a6]/15 text-[#5db8a6]">
              <span className="text-2xl font-bold">&check;</span>
            </div>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#5db8a6]">
                ● VEHICLE ADDED
              </div>
              <h2 className="mt-1 font-serif text-2xl font-medium text-foreground sm:text-3xl">
                {createdVehicle.make} {createdVehicle.model} is now registered.
              </h2>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Plate: {createdVehicle.registrationNumber} &bull; Identity profile active and protected
              </p>
            </div>

            {/* Relationship Status Rail */}
            <div className="mx-auto max-w-sm rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Physical Vehicle</span>
                <span className="text-[#5db8a6] font-semibold">&bull; Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VaahanSafe Identity</span>
                <span className="text-[#5db8a6] font-semibold">&bull; Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">QR Sticker Lifeline</span>
                <span className="text-[#e8a55a] font-semibold">&bull; Pending Attachment</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/vehicles/${createdVehicle.id}`}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#cc785c] px-6 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#a9583e] transition-colors"
              >
                <span>View Vehicle Dossier</span>
                <VaahanIcon name="arrow-right" size={13} />
              </Link>

              <Link
                href={`/qr/activate?vehicleId=${createdVehicle.id}`}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <VaahanIcon name="qr-scan" size={14} />
                <span>Link QR Sticker</span>
              </Link>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setRegistrationNumber("");
                  setMake("");
                  setModel("");
                  setYear("");
                  setColor("");
                  setCreatedVehicle(null);
                  setStep(1);
                }}
                className="text-xs font-mono text-muted-foreground hover:text-[#cc785c] underline"
              >
                + Register another vehicle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
