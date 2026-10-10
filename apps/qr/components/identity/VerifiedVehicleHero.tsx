import { VaahanIcon } from "@vaahansafe/icons";
import { QrIdentityBadge } from "./QrIdentityBadge";
import type { PublicEmergencyProfile } from "@vaahansafe/qr-core";

/** Receives the existing public projection only; an ACTIVE resolution is required. */
export function VerifiedVehicleHero({
  profile,
  publicId,
  visibleCode,
}: {
  profile: PublicEmergencyProfile;
  publicId: string;
  visibleCode?: string;
}) {
  const [name = "", ...details] = profile.vehicleDisplay.split("•");
  const type = profile.vehicleType;
  const label =
    type === "CAR"
      ? "Passenger car"
      : type === "MOTORCYCLE"
        ? "Motorcycle"
        : type === "SCOOTER"
          ? "Scooter"
          : type === "COMMERCIAL"
            ? "Commercial vehicle"
            : "Vehicle";
  return (
    <section
      aria-labelledby="verified-vehicle-title"
      className="space-y-5 border-b border-border pb-6 pt-1 sm:pb-8"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
        <VaahanIcon name="shield-check" size={18} /> QR verified · Active
      </p>
      <div className="flex items-center gap-4">
        <span
          className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted min-[360px]:flex"
          aria-hidden="true"
        >
          <VaahanIcon
            name={
              type === "MOTORCYCLE" || type === "SCOOTER"
                ? "motorcycle"
                : type === "COMMERCIAL"
                  ? "truck"
                  : "car"
            }
            size={28}
            className="text-primary"
          />
        </span>
        <div className="min-w-0">
          <h1
            id="verified-vehicle-title"
            className="break-words font-serif font-semibold tracking-tight"
          >
            {name.trim()}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {[...details.map((d) => d.trim()).filter(Boolean), label].join(
              " · ",
            )}
          </p>
        </div>
      </div>
      <QrIdentityBadge publicId={publicId} visibleCode={visibleCode} compact />
      <p className="text-sm leading-relaxed text-muted-foreground">
        This QR is active and linked to this vehicle.
      </p>
    </section>
  );
}
