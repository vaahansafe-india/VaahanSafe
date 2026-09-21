"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { PhysicalQrObject } from "../primitives/PhysicalQrObject";
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Smartphone,
  Car,
  QrCode,
} from "lucide-react";
import type { QrRegistryItemData } from "@/lib/qr-types";
import { cn } from "@vaahansafe/ui/lib/utils";

interface QrRegistryExperienceProps {
  initialItems: QrRegistryItemData[];
}

export function QrRegistryExperience({ initialItems }: QrRegistryExperienceProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<"ALL" | "ACTIVATED" | "UNLINKED" | "REPLACED">("ALL");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredItems = React.useMemo(() => {
    return initialItems.filter((item) => {
      // Status filter
      if (selectedStatus === "ACTIVATED" && item.status !== "ACTIVATED") return false;
      if (selectedStatus === "UNLINKED" && item.vehicle) return false;
      if (selectedStatus === "REPLACED" && item.status !== "REPLACED") return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPublicId = item.publicId.toLowerCase().includes(q);
        const matchesCode = item.visibleCode.toLowerCase().includes(q);
        const matchesPlate = item.vehicle?.plate.toLowerCase().includes(q);
        const matchesMake = item.vehicle?.make.toLowerCase().includes(q);
        const matchesModel = item.vehicle?.model.toLowerCase().includes(q);
        return matchesPublicId || matchesCode || Boolean(matchesPlate) || Boolean(matchesMake) || Boolean(matchesModel);
      }

      return true;
    });
  }, [initialItems, searchQuery, selectedStatus]);

  const handleCopy = (publicId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(publicId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb */}
      <Link
        href="/qr"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-[#cc785c]"
      >
        <VaahanIcon name="arrow-left" size={13} aria-hidden="true" />
        <span>Back to My QR Hub</span>
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#cc785c]">
            HARDWARE ASSET INVENTORY &bull; REGISTRY
          </div>
          <h1 className="mt-1 font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            QR Code Registry
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Authoritative fleet ledger of all physical stickers, cryptographic resolvers, pairing statuses, and emergency links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/qr/activate"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs"
          >
            <span>+ Activate Retail Kit</span>
          </Link>
          <Link
            href="/qr/buy"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold text-white hover:bg-[#b5654b] transition-colors shadow-xs"
          >
            <span>Order Hardware</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Public ID, plate, or vehicle make..."
            className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-[#cc785c] focus:outline-hidden focus:ring-1 focus:ring-[#cc785c]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {(["ALL", "ACTIVATED", "UNLINKED", "REPLACED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "h-8 rounded-lg px-3 font-mono text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
                selectedStatus === status
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Registry Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isActivated = item.status === "ACTIVATED";
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-[#cc785c]/40 hover:shadow-md"
              >
                <div>
                  {/* Top Bar: Public ID & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-[#cc785c]/10 text-[#cc785c]">
                        <QrCode className="size-4" />
                      </div>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {item.publicId}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider",
                        isActivated
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : item.status === "REPLACED"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Vehicle Identity Assignment */}
                  <div className="mt-4 rounded-xl border border-border/80 bg-background/50 p-3.5">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Assigned Vehicle
                    </div>
                    {item.vehicle ? (
                      <div className="mt-1 flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm font-bold text-foreground">
                            {item.vehicle.maskedPlate}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.vehicle.make} {item.vehicle.model}
                          </div>
                        </div>
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
                          {item.vehicle.type}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                        <span>Not bound to any vehicle</span>
                        <Link
                          href="/qr/activate"
                          className="font-mono text-[10px] underline hover:text-foreground"
                        >
                          Pair Now
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Safety View Readiness Rail */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-emerald-500" />
                        <span>Emergency Relay</span>
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {item.emergencyContactsCount > 0 ? (
                          `${item.emergencyContactsCount} Contacts Active`
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">0 Contacts</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Resolver URL</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.publicId, item.resolverUrl)}
                        className="flex items-center gap-1 font-mono text-[10px] text-[#cc785c] hover:underline"
                        title="Copy Resolver URL"
                      >
                        {copiedId === item.publicId ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 border-t border-border pt-4 flex items-center justify-between gap-2">
                  <Link
                    href={`/qr/digital?id=${encodeURIComponent(item.publicId)}`}
                    className="inline-flex flex-1 h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background font-mono text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <Smartphone className="size-3.5 text-muted-foreground" />
                    <span>Pass</span>
                  </Link>

                  <Link
                    href={`/qr/replace?id=${encodeURIComponent(item.publicId)}`}
                    className="inline-flex flex-1 h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background font-mono text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <RotateCcw className="size-3.5 text-muted-foreground" />
                    <span>Replace</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center max-w-xl mx-auto space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <QrCode className="size-6" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground">
              No QR Stickers Found
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? `No stickers matching "${searchQuery}". Try clearing search filters.`
                : "You have not activated or ordered any QR stickers yet."}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="h-9 rounded-xl border border-border px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted"
              >
                Clear Search
              </button>
            ) : (
              <>
                <Link
                  href="/qr/activate"
                  className="h-9 inline-flex items-center justify-center rounded-xl border border-border px-4 font-mono text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Activate Retail QR
                </Link>
                <Link
                  href="/qr/buy"
                  className="h-9 inline-flex items-center justify-center rounded-xl bg-[#cc785c] px-4 font-mono text-xs font-semibold text-white hover:bg-[#b5654b]"
                >
                  Order Kit
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
