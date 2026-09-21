import * as React from "react";

const CONTROL_STEPS = [
  {
    number: "01",
    label: "View",
    title: "Inspect Live Profile",
    description: "Review exactly what fields are currently enabled for your vehicle's public view.",
  },
  {
    number: "02",
    label: "Update",
    title: "Adjust Contact Details",
    description: "Modify phone numbers, add co-owners or secondary contacts whenever needed.",
  },
  {
    number: "03",
    label: "Visibility",
    title: "Choose Public Switches",
    description: "Toggle individual fields (such as blood group or notes) on or off with a single click.",
  },
  {
    number: "04",
    label: "Save",
    title: "Instant Global Sync",
    description: "Changes take effect immediately across all edge scan resolvers worldwide.",
  },
] as const;

export function OwnerControlsFlow() {
  return (
    <section
      aria-labelledby="owner-controls-heading"
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
            08 / Management Workflow
          </span>

          <h2
            id="owner-controls-heading"
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
            Owner controls in practice.
          </h2>

          <p className="mt-5 text-sm leading-relaxed text-[#3f3f46] sm:text-base sm:leading-7 dark:text-zinc-400">
            Managing what crosses the boundary requires only four straightforward steps
            inside your verified dashboard.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTROL_STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-muted p-6 dark:border-white/[0.08] dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.16em]">
                <span className="text-[#cc785c]">{step.number}</span>
                <span className="text-muted-foreground">{step.label}</span>
              </div>

              <div className="mt-4 font-serif text-lg text-foreground dark:text-zinc-50">
                {step.title}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
