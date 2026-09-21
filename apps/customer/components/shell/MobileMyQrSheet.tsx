"use client";

import * as React from "react";
import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { CUSTOMER_NAVIGATION } from "../../config/navigation";

interface MobileMyQrSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMyQrSheet({ isOpen, onClose }: MobileMyQrSheetProps) {
  // Find the My QR navigation item and its children
  const qrGroup = CUSTOMER_NAVIGATION.find((g) => g.id === "vehicle-identity");
  const myQrItem = qrGroup?.items.find((i) => i.id === "qr");
  const qrChildren = myQrItem?.children || [];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-qr-sheet-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs md:hidden"
    >
      {/* Backdrop click to dismiss */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Modal */}
      <div className="relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-5 text-card-foreground shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" aria-hidden="true" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
              MY VEHICLE QR &bull; Lifecycle Hub
            </div>
            <h2 id="mobile-qr-sheet-title" className="font-serif text-xl font-medium text-foreground">
              My QR
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close My QR options"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <VaahanIcon name="close" size={16} aria-hidden="true" />
          </button>
        </div>

        {/* 5 Distinct Lifecycle Action Rows */}
        <div className="mt-3 divide-y divide-border">
          {qrChildren.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              onClick={onClose}
              className="flex items-center justify-between py-3.5 transition-colors active:bg-muted"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-[#cc785c] border border-border">
                  <VaahanIcon name={option.icon} size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>

              <span className="text-muted-foreground">
                <VaahanIcon name="arrow-right" size={14} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
