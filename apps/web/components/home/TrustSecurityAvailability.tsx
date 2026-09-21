import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getStatusUrl } from "@vaahansafe/config";

const trustPrinciples = [
  {
    number: "01",
    label: "Privacy",
    title: "You control the safety view.",
    description:
      "Your public safety view is designed around the supported information you choose to make available.",
    icon: "shield",
    tone: "coral",
  },
  {
    number: "02",
    label: "Activation",
    title: "Scanning is not ownership.",
    description:
      "The public QR opens the vehicle identity journey. Retail activation uses separate concealed activation information.",
    icon: "lock",
    tone: "neutral",
  },
  {
    number: "03",
    label: "Replacement",
    title: "A QR can change without starting over.",
    description:
      "If a QR needs replacement, VaahanSafe can support moving the vehicle identity to a replacement QR through the applicable replacement process.",
    icon: "refresh",
    tone: "neutral",
  },
  {
    number: "04",
    label: "Continuity",
    title: "The scan experience is treated as a critical path.",
    description:
      "VaahanSafe is designed so the public QR experience can be operated separately from non-critical website experiences.",
    icon: "activity",
    tone: "teal",
  },
] as const;

export function TrustSecurityAvailability() {
  const statusUrl = getStatusUrl();

  return (
    <section
      id="safety"
      aria-labelledby="trust-title"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-muted
        py-24 sm:py-28 lg:py-36
        dark:border-border
        dark:bg-zinc-950
      "
    >
      {/* ============================================================ */}
      {/* AMBIENT IDENTITY GEOMETRY                                    */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[330px] top-[8%]
            h-[700px] w-[700px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <span
          className="
            absolute -right-[300px] bottom-[-180px]
            h-[660px] w-[660px]
            rounded-full
            border border-[#5db8a6]/[0.045]
          "
        />

        <span className="absolute left-[8%] top-[38%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/40 lg:block" />

        <span className="absolute bottom-[24%] right-[9%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/40 lg:block" />

        <span
          className="
            absolute left-[2.3%] top-1/2
            hidden -rotate-90
            font-mono text-[7px]
            uppercase tracking-[0.26em]
            text-muted-foreground/30
            xl:block
            dark:text-zinc-400/25
          "
        >
          Control / Recover / Continue
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end lg:gap-20">
          <div>
            <Badge
              variant="outline"
              className="
                rounded-full
                border-border
                bg-muted
                px-3.5 py-1.5
                font-mono text-[9px]
                font-medium uppercase
                tracking-[0.2em]
                text-muted-foreground
                dark:border-zinc-700
                dark:bg-zinc-900
                dark:text-zinc-400
              "
            >
              Trust & Continuity
            </Badge>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span className="h-px w-8 bg-[#cc785c]/40" />

              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
                Safety Principles / 11
              </span>
            </div>
          </div>

          <div>
            <h2
              id="trust-title"
              className="
                max-w-[850px]
                text-balance
                font-serif
                text-[2.9rem]
                font-normal
                leading-[0.98]
                tracking-[-0.045em]
                text-foreground
                sm:text-5xl
                md:text-6xl
                lg:text-[4.5rem]
                dark:text-zinc-50
              "
            >
              Built around the moments
              <br className="hidden sm:block" />

              <span className="text-[#cc785c]">
                {" "}
                when the QR needs to work.
              </span>
            </h2>

            <p className="mt-6 max-w-[650px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 dark:text-zinc-400">
              Privacy, activation, replacement and service continuity
              are treated as parts of the vehicle identity experience —
              not as background technical details.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* TRUST SYSTEM                                                 */}
        {/* ============================================================ */}

        <div className="mt-16 lg:mt-24">
          <div className="flex items-center justify-between gap-5 border-b border-border pb-4 dark:border-white/[0.07]">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
                Vehicle Identity Principles
              </span>
            </div>

            <span className="hidden font-mono text-[7px] uppercase tracking-[0.16em] text-[#b0aaa2] md:block dark:text-zinc-500">
              Privacy / Activation / Recovery / Continuity
            </span>
          </div>

          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            {/* ======================================================== */}
            {/* CENTRAL TRUST OBJECT                                    */}
            {/* ======================================================== */}

            <div className="relative py-10 lg:border-r lg:border-border lg:py-14 lg:pr-14 dark:lg:border-white/[0.07]">
              <TrustIdentityObject />
            </div>

            {/* ======================================================== */}
            {/* PRINCIPLES                                              */}
            {/* ======================================================== */}

            <div className="border-t border-border py-10 lg:border-t-0 lg:py-14 lg:pl-14 dark:border-white/[0.07]">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#cc785c]">
                  Four product principles
                </span>

                <h3 className="mt-3 max-w-[540px] font-serif text-3xl font-normal tracking-[-0.03em] text-[#252523] sm:text-4xl dark:text-zinc-100">
                  Trust should be visible in how the product behaves.
                </h3>
              </div>

              <div className="mt-9 border-t border-border dark:border-white/[0.07]">
                {trustPrinciples.map((principle) => (
                  <TrustPrinciple
                    key={principle.number}
                    {...principle}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CRITICAL PATH                                               */}
        {/* ============================================================ */}

        <div className="mt-8 overflow-hidden rounded-[18px] border border-border bg-background text-foreground shadow-[0_12px_40px_rgba(20,20,19,0.04)] dark:border-white/[0.08] dark:bg-zinc-950 dark:text-zinc-50">
          <div className="grid lg:grid-cols-[1fr_1.35fr]">
            <div className="relative overflow-hidden border-b border-border p-7 sm:p-9 lg:border-b-0 lg:border-r lg:p-10 dark:border-white/[0.07]">
              <div
                aria-hidden="true"
                className="absolute -left-24 -top-24 h-64 w-64 rounded-full border border-[#09090b]/[0.035] dark:border-white/[0.035]"
              />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />

                  <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#5db8a6]">
                    Critical Path
                  </span>
                </div>

                <h3 className="mt-5 max-w-[380px] font-serif text-3xl font-normal leading-[1.03] tracking-[-0.03em] text-foreground sm:text-4xl dark:text-zinc-50">
                  The public scan journey comes first.
                </h3>

                <p className="mt-5 max-w-[430px] text-[10px] leading-6 text-muted-foreground sm:text-[11px] dark:text-muted-foreground">
                  The QR experience is designed as its own important
                  product path, separate from experiences such as
                  marketing, account administration and purchasing.
                </p>
              </div>
            </div>

            <div className="p-7 sm:p-9 lg:p-10">
              <CriticalPath />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ACTIONS                                                      */}
        {/* ============================================================ */}

        <div className="mt-12 grid border-y border-border sm:grid-cols-2 dark:border-white/[0.07]">
          <TrustRoute
            href="/safety"
            index="01"
            icon="shield"
            label="Safety & Privacy"
            description="Understand how the public safety view is controlled."
          />

          <TrustRoute
            href={statusUrl}
            index="02"
            icon="activity"
            label="Service Status"
            description="View the current VaahanSafe service-status page."
            external
            last
          />
        </div>

        {/* ============================================================ */}
        {/* CLOSING                                                      */}
        {/* ============================================================ */}

        <footer className="mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mt-20">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
              VaahanSafe Trust Model
            </span>

            <p className="mt-3 max-w-[760px] font-serif text-2xl font-normal leading-[1.15] tracking-[-0.025em] text-[#252523] sm:text-3xl dark:text-zinc-100">
              Control what is shared.
              <span className="text-[#cc785c]">
                {" "}
                Keep the identity recoverable.
              </span>
            </p>
          </div>

          <div
            aria-hidden="true"
            className="flex shrink-0 items-center gap-3"
          >
            <span className="h-px w-8 bg-[#cc785c]/35" />

            <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
              Control / Recover / Continue
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}

/* ========================================================================== */
/* TRUST IDENTITY OBJECT                                                      */
/* ========================================================================== */

function TrustIdentityObject() {
  return (
    <div className="relative mx-auto max-w-[410px]">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#09090b]/[0.03] dark:border-white/[0.025]"
      />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#cc785c]/[0.055]"
      />

      <article
        aria-label="Illustrative VaahanSafe identity trust model"
        className="
          relative overflow-hidden
          rounded-[20px]
          border border-border
          bg-background
          p-6
          shadow-[0_24px_70px_rgba(20,20,19,0.07)]
          dark:border-white/[0.08]
          dark:bg-zinc-900
          dark:shadow-none
        "
      >
        <header className="flex items-center justify-between gap-5 border-b border-border pb-5 dark:border-white/[0.07]">
          <div>
            <span className="font-mono text-[6px] uppercase tracking-[0.17em] text-muted-foreground dark:text-zinc-500">
              Vehicle identity
            </span>

            <p className="mt-1 font-mono text-[9px] tracking-[0.12em] text-[#cc785c]">
              VS-7F3K-9021
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-[#5db872]/15 bg-[#5db872]/[0.05] px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

            <span className="font-mono text-[6px] uppercase tracking-[0.14em] text-[#5db872]">
              Demo
            </span>
          </div>
        </header>

        <div className="py-8">
          <div className="relative mx-auto flex h-[154px] w-[154px] items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-border dark:border-white/[0.07]"
            />

            <span
              aria-hidden="true"
              className="absolute inset-[17px] rounded-full border border-[#cc785c]/10"
            />

            <div className="relative flex h-[84px] w-[84px] items-center justify-center rounded-[18px] bg-[#09090b] text-[#fafafa] dark:bg-background dark:text-[#09090b]">
              <VaahanIcon
                name="qr"
                size={30}
                aria-hidden="true"
              />

              <span className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-[3px] border-[#fafafa] bg-[#cc785c] dark:border-[#09090b]" />
            </div>

            <span className="absolute -left-2 top-1/2 h-px w-10 -translate-y-1/2 bg-[#cc785c]/25" />
            <span className="absolute -right-2 top-1/2 h-px w-10 -translate-y-1/2 bg-[#5db8a6]/25" />
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-border pt-5 dark:border-white/[0.07]">
          <ObjectState
            label="Share"
            value="Controlled"
          />

          <ObjectState
            label="Activate"
            value="Separate"
          />

          <ObjectState
            label="Replace"
            value="Supported"
          />
        </div>
      </article>

      <div className="mt-7 flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-[#e4e4e7] dark:bg-white/[0.07]" />

        <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
          Illustrative product model
        </span>

        <span className="h-px w-8 bg-[#e4e4e7] dark:bg-white/[0.07]" />
      </div>
    </div>
  );
}

function ObjectState({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="text-center">
      <span className="font-mono text-[6px] uppercase tracking-[0.14em] text-muted-foreground dark:text-zinc-500">
        {label}
      </span>

      <p className="mt-1 text-[8px] font-medium text-[#3f3f46] dark:text-zinc-200">
        {value}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* TRUST PRINCIPLE                                                            */
/* ========================================================================== */

function TrustPrinciple({
  number,
  label,
  title,
  description,
  icon,
  tone,
}: {
  number: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  tone: "coral" | "teal" | "neutral";
}) {
  const toneClasses = {
    coral:
      "border-[#cc785c]/15 bg-[#cc785c]/[0.045] text-[#cc785c]",
    teal:
      "border-[#5db8a6]/15 bg-[#5db8a6]/[0.045] text-[#5db8a6]",
    neutral:
      "border-border text-muted-foreground dark:border-white/[0.08]",
  };

  return (
    <article
      className="
        group grid
        grid-cols-[34px_minmax(0,1fr)]
        gap-4
        border-b border-border
        py-5
        dark:border-white/[0.07]
        sm:grid-cols-[34px_80px_minmax(0,1fr)]
      "
    >
      <div
        className={`
          flex h-8 w-8
          items-center justify-center
          rounded-[8px]
          border
          ${toneClasses[tone]}
        `}
      >
        <VaahanIcon
          name={icon as any}
          size={11}
          aria-hidden="true"
        />
      </div>

      <div className="hidden pt-1 sm:block">
        <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
          {number}
        </span>

        <p className="mt-1 font-mono text-[6px] uppercase tracking-[0.13em] text-[#b0aaa2] dark:text-zinc-500">
          {label}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 sm:hidden">
          <span className="font-mono text-[6px] uppercase tracking-[0.15em] text-[#cc785c]">
            {number} / {label}
          </span>
        </div>

        <h4 className="mt-1 font-serif text-xl font-normal tracking-[-0.02em] text-[#252523] dark:text-zinc-100 sm:mt-0">
          {title}
        </h4>

        <p className="mt-2 max-w-[460px] text-[9px] leading-5 text-muted-foreground dark:text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}

/* ========================================================================== */
/* CRITICAL PATH                                                              */
/* ========================================================================== */

function CriticalPath() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#71717a]">
          Public QR Journey
        </span>

        <span className="font-mono text-[6px] uppercase tracking-[0.15em] text-[#5db8a6]">
          Priority path
        </span>
      </div>

      <div className="mt-8 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
        <PathNode
          icon="qr"
          label="Scan"
          active
        />

        <PathConnector />

        <PathNode
          icon="shield"
          label="Safety View"
          active
        />

        <PathConnector />

        <PathNode
          icon="phone"
          label="Connect"
          active
        />
      </div>

      <div className="mt-8 border-t border-white/[0.07] pt-5">
        <div className="flex items-start gap-3">
          <VaahanIcon
            name="activity"
            size={12}
            className="mt-0.5 shrink-0 text-[#5db8a6]"
            aria-hidden="true"
          />

          <p className="m-0 text-[8px] leading-5 text-[#71717a]">
            Service architecture and operational status are separate
            topics. Use the status page for current service information.
          </p>
        </div>
      </div>
    </div>
  );
}

function PathNode({
  icon,
  label,
}: {
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-muted text-[#5db8a6] dark:border-white/[0.08] dark:bg-zinc-900">
        <VaahanIcon
          name={icon as any}
          size={13}
          aria-hidden="true"
        />
      </div>

      <span className="mt-3 font-mono text-[6px] uppercase tracking-[0.14em] text-muted-foreground dark:text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function PathConnector() {
  return (
    <div
      aria-hidden="true"
      className="flex min-w-0 items-center"
    >
      <span className="h-px min-w-3 flex-1 bg-[#5db8a6]/20" />

      <VaahanIcon
        name="arrow-right"
        size={8}
        className="ml-1 text-[#5db8a6]/60"
      />
    </div>
  );
}

/* ========================================================================== */
/* TRUST ROUTE                                                                */
/* ========================================================================== */

function TrustRoute({
  href,
  index,
  icon,
  label,
  description,
  external = false,
  last = false,
}: {
  href: string;
  index: string;
  icon: string;
  label: string;
  description: string;
  external?: boolean;
  last?: boolean;
}) {
  const content = (
    <>
      <span className="absolute left-5 top-4 font-mono text-[6px] tracking-[0.14em] text-[#b0aaa2] dark:text-zinc-500">
        {index}
      </span>

      <div className="mt-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-border text-muted-foreground transition-colors group-hover:border-[#cc785c]/20 group-hover:text-[#cc785c] dark:border-white/[0.08]">
        <VaahanIcon
          name={icon as any}
          size={12}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <p className="text-[10px] font-medium text-[#3f3f46] dark:text-zinc-200">
          {label}
        </p>

        <p className="mt-1 max-w-[400px] text-[8px] leading-4 text-muted-foreground dark:text-zinc-500">
          {description}
        </p>
      </div>

      <VaahanIcon
        name={external ? "external-link" : "arrow-right"}
        size={11}
        className="mt-3 shrink-0 text-[#b0aaa2] transition-colors group-hover:text-[#cc785c] dark:text-zinc-500"
        aria-hidden="true"
      />
    </>
  );

  const className = `
    group relative
    flex min-h-[116px]
    items-center gap-4
    px-5 py-5
    transition-colors
    hover:bg-muted/60
    focus-visible:z-10
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-inset
    focus-visible:ring-[#cc785c]/25
    dark:hover:bg-white/[0.025]
    ${
      last
        ? ""
        : "border-b border-border sm:border-b-0 sm:border-r dark:border-white/[0.07]"
    }
  `;

  if (external) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}