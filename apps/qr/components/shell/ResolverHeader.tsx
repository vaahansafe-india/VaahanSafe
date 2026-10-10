"use client";

import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { VaahanSafeLogo } from "@vaahansafe/ui/brand";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@vaahansafe/ui/components/dialog";
import { getWebUrl } from "@vaahansafe/config";

export function ResolverHeader({ verified = false }: { verified?: boolean }) {
  return (
    <header className="qr-safety-header">
      <div className="qr-safety-header-inner">
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center"
          aria-label="VaahanSafe home"
        >
          <VaahanSafeLogo size="sm" variant="brand" showTagline={false} />
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <VaahanIcon
              name={verified ? "shield-check" : "shield"}
              size={16}
              className="shrink-0 text-primary"
            />
            <span>
              <span className="hidden sm:inline">
                {verified ? "Verified " : ""}
              </span>
              Safety QR
            </span>
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"
                aria-label="About this safety QR"
                title="About this safety QR"
              >
                <VaahanIcon name="help" size={20} />
              </button>
            </DialogTrigger>
            <DialogContent className="qr-safety-dialog">
              <DialogTitle className="pr-10 font-serif text-2xl">
                About this safety QR
              </DialogTitle>
              <DialogDescription>
                VaahanSafe connects a vehicle to safety information its owner
                has chosen to share.
              </DialogDescription>
              <div className="space-y-4 text-sm leading-relaxed">
                <p>
                  Check the vehicle details before calling an approved contact
                  or reporting a concern.
                </p>
                <p>
                  Reports, photos and any location you add are shared privately
                  with the owner. No sign-in is needed to send a report.
                </p>
                <p>
                  This QR does not replace emergency services. If someone is in
                  immediate danger, call{" "}
                  <a
                    className="font-semibold text-primary underline"
                    href="tel:112"
                  >
                    112
                  </a>
                  .
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <a
                    className="inline-flex min-h-11 items-center text-primary underline"
                    href={`${getWebUrl()}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy details
                  </a>
                  <a
                    className="inline-flex min-h-11 items-center text-primary underline"
                    href={`${getWebUrl()}/help`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Support
                  </a>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
