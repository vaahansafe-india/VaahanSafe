"use client";

import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";

interface OrderHelpProps {
  onTrackSelected?: () => void;
}

export function OrderHelp({ onTrackSelected }: OrderHelpProps) {
  const HELP_ITEMS = [
    {
      title: "Track Courier Delivery",
      description: "Check logistics timeline and transit hub updates",
      icon: "truck" as const,
      href: "#",
      onClick: onTrackSelected,
    },
    {
      title: "Payment Reconciliation",
      description: "Cashfree verification or billing questions",
      icon: "receipt" as const,
      href: "/help",
    },
    {
      title: "Replacement Hardware",
      description: "Replace a lost or physically damaged sticker",
      icon: "qr" as const,
      href: "/qr/replace",
    },
    {
      title: "Fulfillment Help Center",
      description: "Read dispatch policies and delivery FAQs",
      icon: "help" as const,
      href: "/help",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="space-y-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#cc785c]">
          Support Assistance
        </div>
        <h4 className="font-serif text-base font-medium tracking-tight text-foreground">
          Need Help with an Order?
        </h4>
        <p className="text-xs text-muted-foreground">
          Dedicated guidance for order verification, dispatch, and QR binding.
        </p>
      </div>

      <div className="divide-y divide-border/60">
        {HELP_ITEMS.map((item, idx) => {
          const content = (
            <div className="flex items-start gap-3 py-3 group">
              <div className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground group-hover:border-[#cc785c]/40 group-hover:text-[#cc785c] transition-colors shrink-0 mt-0.5">
                <VaahanIcon name={item.icon} className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground group-hover:text-[#cc785c] transition-colors">
                  {item.title}
                </div>
                <div className="text-[11px] text-muted-foreground leading-snug">
                  {item.description}
                </div>
              </div>
              <VaahanIcon
                name="arrow-right"
                className="size-3 text-muted-foreground/50 group-hover:text-[#cc785c] group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
              />
            </div>
          );

          if (item.onClick) {
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className="w-full text-left focus:outline-hidden"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={idx} href={item.href} className="block focus:outline-hidden">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
