import * as React from "react";
import Link from "next/link";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";

interface EmptyStateProps {
  icon: VaahanIconName;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export function EmptyState({
  icon,
  badge,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center shadow-xs">
      {/* Icon Emblem */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20">
        <VaahanIcon name={icon} size={22} aria-hidden="true" />
      </div>

      {/* Optional Tag */}
      {badge && (
        <span className="mt-4 rounded bg-muted/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground border border-border">
          {badge}
        </span>
      )}

      {/* Heading */}
      <h3 className="mt-3 font-serif text-xl font-medium text-foreground sm:text-2xl">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#cc785c] px-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-xs transition-colors hover:bg-[#a9583e]"
            >
              <span>{actionLabel}</span>
              <VaahanIcon name="arrow-right" size={13} aria-hidden="true" />
            </Link>
          )}

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-[#cc785c] hover:text-[#cc785c]"
            >
              <span>{secondaryActionLabel}</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-composed authentic empty states per Section 31
 */

export function EmptyVehiclesState() {
  return (
    <EmptyState
      icon="vehicle"
      badge="VEHICLE IDENTITY"
      title="No vehicle has been added yet"
      description="Add your first vehicle to begin creating your VaahanSafe vehicle identity and linking your QR safety stickers."
      actionLabel="Add Vehicle"
      actionHref="/vehicles/new"
    />
  );
}

export function EmptyQrState() {
  return (
    <EmptyState
      icon="qr"
      badge="QR SAFETY LIFECYCLE"
      title="No associated QR stickers found"
      description="This account does not currently have an active VaahanSafe QR safety sticker. You can order a new kit or activate a retail card."
      actionLabel="Get VaahanSafe"
      actionHref="/qr/buy"
      secondaryActionLabel="Activate Retail QR"
      secondaryActionHref="/qr/activate"
    />
  );
}

export function EmptyScansState() {
  return (
    <EmptyState
      icon="activity"
      badge="SAFETY AUDIT"
      title="No scan activity recorded yet"
      description="Whenever someone scans your vehicle's physical QR sticker in an emergency or for assistance, the security audit log and safety ping will appear here."
    />
  );
}

export function EmptyOrdersState() {
  return (
    <EmptyState
      icon="package"
      badge="FULFILLMENT"
      title="You don't have any orders yet"
      description="Order a genuine VaahanSafe physical QR sticker kit with high-durability UV lamination to protect your vehicle."
      actionLabel="Order QR Kit"
      actionHref="/qr/buy"
    />
  );
}

export function EmptyContactsState() {
  return (
    <EmptyState
      icon="phone"
      badge="EMERGENCY NETWORK"
      title="No emergency contacts configured yet"
      description="Add trusted contacts (family, friends, emergency services) who should be notified via SMS and WhatsApp whenever your vehicle is involved in an incident."
      actionLabel="Add Emergency Contact"
      actionHref="/emergency-contacts/new"
    />
  );
}

export function EmptyNotificationsState() {
  return (
    <EmptyState
      icon="notification"
      badge="SYSTEM INBOX"
      title="All caught up"
      description="You don't have any unread notifications or security alerts at this time."
    />
  );
}
