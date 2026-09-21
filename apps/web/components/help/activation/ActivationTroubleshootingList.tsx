import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

export function ActivationTroubleshootingList() {
  const issues = [
    {
      title: "QR Not Scanning With Camera",
      desc: "Ensure adequate ambient lighting and wipe the packaging glossy surface to reduce glare. Hold your phone camera steady at a distance of 25 to 40 cm. Alternatively, you can visit activate.vaahansafe.com in any browser and type the alphanumeric ID printed beneath the QR code manually.",
    },
    {
      title: "Activation Scratch Key Damaged / Unreadable",
      desc: "If the silver scratch coating was scraped too firmly with a sharp coin and characters are obliterated, do not discard the pack. Email support@vaahansafe.com with a clear photograph of the retail pack front showing the visible alphanumeric identity code. Our team will verify retail distributor records.",
    },
    {
      title: "Mobile OTP Not Arriving",
      desc: "SMS one-time passwords are dispatched through licensed telecom routing. Please allow up to 60 seconds. Ensure your mobile number is an active 10-digit Indian number not blocking transactional A2P messages via Do-Not-Disturb (DND). If delayed, request a fresh OTP via WhatsApp relay.",
    },
    {
      title: "Key Verification Mismatch",
      desc: "Activation keys are case-insensitive and contain uppercase letters and numbers. Carefully check common optical confusions: the number '0' versus letter 'O', the number '1' versus letter 'I', and the number '8' versus letter 'B'.",
    },
    {
      title: "Vehicle Registration Connection Issue",
      desc: "If you have not yet received your permanent registration number for a brand-new vehicle, you may complete activation using your temporary registration number or chassis number, then update it in your portal once plates arrive.",
    },
    {
      title: "QR Already Associated or Unavailable",
      desc: "If the system indicates the QR is already registered, the decal was previously claimed. If you purchased the sealed pack as new from an authorized dealer, contact support@vaahansafe.com with proof of purchase for immediate investigation.",
    },
  ];

  return (
    <section
      aria-labelledby="activation-troubleshooting-heading"
      className="
        border-b border-border
        bg-background
        py-16 sm:py-20 lg:py-24
        dark:border-border
        dark:bg-zinc-950
      "
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span>Activation Diagnostics</span>
        </div>

        <div className="mt-4 max-w-[760px]">
          <h2
            id="activation-troubleshooting-heading"
            className="
              font-serif text-3xl font-normal tracking-[-0.03em]
              text-foreground sm:text-4xl lg:text-5xl
              dark:text-zinc-50
            "
          >
            Activation troubleshooting.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base dark:text-zinc-400">
            Clear, practical solutions for resolving unboxing, scanning, and verification roadblocks.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue, idx) => (
            <div
              key={idx}
              className="
                flex flex-col justify-between rounded-2xl
                border border-border bg-muted/60 p-6 sm:p-7
                dark:border-white/[0.08] dark:bg-zinc-900
              "
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#cc785c]">
                    CASE 0{idx + 1}
                  </span>
                  <VaahanIcon name="alert" size={14} className="text-muted-foreground" aria-hidden="true" />
                </div>

                <h3 className="mt-4 font-serif text-xl text-foreground dark:text-zinc-50">
                  {issue.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-zinc-400">
                  {issue.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
