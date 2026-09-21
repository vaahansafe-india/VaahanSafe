import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface OwnerTab {
  label: string;
  icon: string;
  active?: boolean;
}

const OWNER_TABS: readonly OwnerTab[] = [
  { label: "Overview", icon: "dashboard", active: true },
  { label: "My Vehicle", icon: "car" },
  { label: "My QR", icon: "qr" },
  { label: "Emergency Contacts", icon: "phone" },
  { label: "Scan History", icon: "activity" },
  { label: "Plan", icon: "shield" },
];

export function OwnerExperienceArtifact() {
  return (
    <section
      aria-labelledby="owner-experience-heading"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-16
        sm:py-20
        lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#cc785c]">
            08 / Ongoing Governance
          </span>

          <h2
            id="owner-experience-heading"
            className="
              mt-3 font-serif
              text-3xl font-normal leading-[1.1]
              tracking-[-0.03em]
              text-foreground
              sm:text-4xl
              lg:text-5xl
              dark:text-zinc-50
            "
          >
            After activation,
            <br />
            the identity stays manageable.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            Your vehicle identity is not a static printed tag. Through the
            authenticated customer dashboard, you manage which contacts receive
            relays, update medical indicators, review scan records, and monitor
            protection status.
          </p>
        </div>

        {/* Dashboard Artifact */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm dark:border-white/[0.08] dark:bg-zinc-900">
          {/* Top chrome */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-4 dark:border-white/[0.08] dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-foreground dark:text-zinc-50">
                VAAHANSAFE &bull; OWNER PORTAL
              </span>
            </div>

            {/* Tab Rail */}
            <div className="flex flex-wrap items-center gap-1 font-mono text-[9px] uppercase tracking-wider">
              {OWNER_TABS.map((tab) => (
                <span
                  key={tab.label}
                  className={`
                    rounded-md px-3 py-1.5 transition-colors
                    ${
                      tab.active
                        ? "bg-[#cc785c] text-white"
                        : "text-muted-foreground hover:bg-[#e4e4e7]/50 dark:text-muted-foreground dark:hover:bg-white/[0.06]"
                    }
                  `}
                >
                  {tab.label}
                </span>
              ))}
            </div>
          </div>

          {/* Internal Dashboard Mockup */}
          <div className="p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Vehicle Status Card */}
              <div className="rounded-xl border border-border bg-background p-5 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                  <span>Active Vehicle</span>
                  <span className="text-[#5db8a6]">ONLINE</span>
                </div>
                <div className="mt-3 font-serif text-xl text-foreground dark:text-zinc-50">
                  Honda &bull; Demo Vehicle
                </div>
                <div className="mt-1 font-mono text-xs text-[#cc785c]">
                  VS-7F3K-9021
                </div>
              </div>

              {/* Emergency Contact Status */}
              <div className="rounded-xl border border-border bg-background p-5 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                  <span>Emergency Relay</span>
                  <span className="text-[#cc785c]">1 Active Contact</span>
                </div>
                <div className="mt-3 font-serif text-xl text-foreground dark:text-zinc-50">
                  Primary Contact (Spouse)
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground dark:text-muted-foreground">
                  +91 &bull;&bull;&bull;&bull;&bull; &bull;&bull;001
                </div>
              </div>

              {/* Decal Association */}
              <div className="rounded-xl border border-border bg-background p-5 dark:border-white/[0.06] dark:bg-zinc-950">
                <div className="flex items-center justify-between font-mono text-[8px] text-muted-foreground">
                  <span>Decal Hardware</span>
                  <span className="text-[#5db8a6]">PAIRING VERIFIED</span>
                </div>
                <div className="mt-3 font-serif text-xl text-foreground dark:text-zinc-50">
                  Sticker Layer 01
                </div>
                <div className="mt-1 font-mono text-xs text-muted-foreground dark:text-muted-foreground">
                  Windshield Mounted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
