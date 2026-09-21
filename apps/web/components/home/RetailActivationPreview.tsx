import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { getActivateUrl } from "@vaahansafe/config";

const activationSteps = [
  {
    number: "01",
    verb: "SCAN",
    title: "Scan the VaahanSafe QR.",
    description:
      "Start with the QR on the VaahanSafe sticker you purchased.",
    icon: "qr-scan",
  },
  {
    number: "02",
    verb: "REVEAL",
    title: "Reveal the activation code.",
    description:
      "Use the concealed activation area supplied with your retail QR.",
    icon: "lock",
  },
  {
    number: "03",
    verb: "VERIFY",
    title: "Confirm it belongs with you.",
    description:
      "Sign in and complete the verification steps shown during activation.",
    icon: "shield",
  },
  {
    number: "04",
    verb: "CONNECT",
    title: "Connect your vehicle.",
    description:
      "Add or select the vehicle that will carry this VaahanSafe identity.",
    icon: "car",
  },
] as const;

export function RetailActivationPreview() {
  const activateUrl = getActivateUrl();

  return (
    <section
      id="retail-activation"
      aria-labelledby="retail-activation-title"
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
      {/* IDENTITY FIELD                                               */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="
            absolute -left-[310px] top-[5%]
            h-[680px] w-[680px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <span
          className="
            absolute -right-[330px] bottom-[-120px]
            h-[720px] w-[720px]
            rounded-full
            border border-[#cc785c]/[0.04]
          "
        />

        <span className="absolute left-[8%] top-[31%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/40 lg:block" />

        <span className="absolute bottom-[22%] right-[8%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

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
          Physical / Activation / Identity
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-20">
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
              Retail Activation
            </Badge>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
              <span className="h-px w-8 bg-[#cc785c]/40" />

              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
                Activation Station / 07
              </span>
            </div>
          </div>

          <div>
            <h2
              id="retail-activation-title"
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
                lg:text-[4.6rem]
                dark:text-zinc-50
              "
            >
              Bought VaahanSafe
              <br className="hidden sm:block" />
              <span className="text-[#cc785c]">
                {" "}
                at a retail store?
              </span>
            </h2>

            <p className="mt-6 max-w-[620px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 dark:text-zinc-400">
              Your retail QR begins as a physical VaahanSafe identity.
              Activation connects that identity to your account and vehicle.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* PHYSICAL → DIGITAL TRANSFORMATION                            */}
        {/* ============================================================ */}

        <div className="mt-16 lg:mt-24">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4 dark:border-white/[0.07]">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
                Physical QR → Vehicle Identity
              </span>
            </div>

            <span className="hidden font-mono text-[7px] uppercase tracking-[0.18em] text-[#b0aaa2] sm:block dark:text-zinc-500">
              One activation journey
            </span>
          </div>

          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            {/* ======================================================== */}
            {/* PHYSICAL RETAIL OBJECT                                  */}
            {/* ======================================================== */}

            <div className="relative py-10 lg:border-r lg:border-border lg:py-14 lg:pr-14 dark:lg:border-white/[0.07]">
              <div className="mb-8">
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
                  Before activation
                </span>

                <h3 className="mt-3 max-w-[400px] font-serif text-3xl font-normal tracking-[-0.03em] text-[#252523] sm:text-4xl dark:text-zinc-100">
                  A VaahanSafe QR waiting for its vehicle.
                </h3>
              </div>

              <RetailIdentityPack />

              <div className="mt-7 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#e4e4e7] dark:bg-white/[0.07]" />

                <span className="font-mono text-[7px] uppercase tracking-[0.17em] text-muted-foreground dark:text-zinc-500">
                  Activate to connect
                </span>

                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#cc785c]/20 text-[#cc785c]">
                  <VaahanIcon
                    name="arrow-right"
                    size={10}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* ACTIVATION JOURNEY                                      */}
            {/* ======================================================== */}

            <div className="border-t border-border py-10 lg:border-t-0 lg:py-14 lg:pl-14 dark:border-white/[0.07]">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#cc785c]">
                    Activation journey
                  </span>

                  <h3 className="mt-3 font-serif text-3xl font-normal tracking-[-0.03em] text-[#252523] sm:text-4xl dark:text-zinc-100">
                    From retail QR to active identity.
                  </h3>
                </div>

                <span className="hidden font-mono text-[7px] tracking-[0.16em] text-muted-foreground sm:block dark:text-zinc-500">
                  01 — 04
                </span>
              </div>

              <div className="relative mt-10">
                <div
                  aria-hidden="true"
                  className="absolute bottom-6 left-[17px] top-6 w-px bg-[#e4e4e7] dark:bg-white/[0.08]"
                />

                <div className="space-y-1">
                  {activationSteps.map((step) => (
                    <ActivationStep
                      key={step.number}
                      number={step.number}
                      verb={step.verb}
                      icon={step.icon}
                      title={step.title}
                      description={step.description}
                    />
                  ))}
                </div>
              </div>

              {/* ACTIVE DESTINATION */}

              <div className="mt-8 border-t border-border pt-8 dark:border-white/[0.07]">
                <ActiveIdentity />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONVERGENCE / PRODUCT MODEL                                 */}
        {/* ============================================================ */}

        <div className="mt-6 border-y border-border dark:border-white/[0.07]">
          <div className="grid md:grid-cols-[1fr_auto_1fr] md:items-center">
            <RouteState
              number="01"
              label="Retail purchase"
              value="Pre-issued VaahanSafe QR"
              icon="qr"
            />

            <div
              aria-hidden="true"
              className="
                hidden items-center gap-2
                px-5
                text-[#cc785c]
                md:flex
              "
            >
              <span className="h-px w-8 bg-[#cc785c]/25" />

              <VaahanIcon name="arrow-right" size={10} />

              <span className="h-px w-8 bg-[#cc785c]/25" />
            </div>

            <RouteState
              number="02"
              label="After activation"
              value="Your vehicle's VaahanSafe identity"
              icon="car"
              accent
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* CTA                                                          */}
        {/* ============================================================ */}

        <footer className="mt-14 grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end lg:mt-20">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
              Already have a retail QR?
            </span>

            <p className="mt-3 max-w-[650px] font-serif text-2xl font-normal leading-[1.15] tracking-[-0.025em] text-[#252523] sm:text-3xl dark:text-zinc-100">
              The physical QR is already in your hand.
              <span className="text-[#cc785c]">
                {" "}
                Now connect the identity behind it.
              </span>
            </p>
          </div>

          <a
            href={activateUrl}
            className="
              group inline-flex h-12
              w-full items-center justify-center
              gap-3
              rounded-[8px]
              bg-[#cc785c]
              px-6
              text-[11px]
              font-medium
              text-white
              transition-colors
              hover:bg-[#a9583e]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#cc785c]/40
              focus-visible:ring-offset-2
              sm:w-auto
              dark:ring-offset-[#09090b]
            "
          >
            <VaahanIcon name="qr" size={14} aria-hidden="true" />

            <span>Activate Retail QR</span>

            <VaahanIcon
              name="arrow-right"
              size={13}
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </a>
        </footer>
      </div>
    </section>
  );
}

/* ================================================================== */
/* RETAIL IDENTITY PACK                                               */
/* ================================================================== */

function RetailIdentityPack() {
  return (
    <div className="relative mx-auto max-w-[410px]">
      {/* object shadow / registration geometry */}

      <div
        aria-hidden="true"
        className="absolute inset-x-[12%] bottom-[-18px] h-[40px] rounded-full border border-[#09090b]/[0.025] dark:border-white/[0.025]"
      />

      <article
        aria-label="Illustrative VaahanSafe retail QR package"
        className="
          relative overflow-hidden
          rounded-[18px]
          border border-border
          bg-background
          p-5
          shadow-[0_22px_60px_rgba(20,20,19,0.07)]
          sm:p-6
          dark:border-white/[0.08]
          dark:bg-zinc-900
          dark:shadow-none
        "
      >
        {/* sparse geometry */}

        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-[#cc785c]/[0.06]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full border border-[#09090b]/[0.03] dark:border-white/[0.025]"
        />

        {/* header */}

        <header className="relative flex items-center justify-between gap-5 border-b border-border pb-4 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#09090b] text-[#fafafa] dark:bg-background dark:text-[#09090b]">
              <VaahanIcon name="qr" size={15} aria-hidden="true" />

              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#fafafa] bg-[#cc785c] dark:border-[#18181b]" />
            </div>

            <div>
              <p className="text-[10px] font-medium text-[#252523] dark:text-zinc-100">
                VaahanSafe
              </p>

              <p className="mt-0.5 font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
                Vehicle Safety Identity
              </p>
            </div>
          </div>

          <span className="font-mono text-[6px] uppercase tracking-[0.15em] text-muted-foreground dark:text-zinc-500">
            Retail QR
          </span>
        </header>

        {/* body */}

        <div className="relative grid gap-7 py-7 sm:grid-cols-[1fr_118px] sm:items-center">
          <div>
            <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#cc785c]">
              Ready to activate
            </span>

            <h4 className="mt-3 max-w-[220px] font-serif text-2xl font-normal leading-[1.05] tracking-[-0.025em] text-[#252523] dark:text-zinc-100">
              This identity is waiting for a vehicle.
            </h4>

            <p className="mt-4 max-w-[230px] text-[9px] leading-5 text-muted-foreground dark:text-muted-foreground">
              Scan the QR and use the supplied activation information
              to begin.
            </p>
          </div>

          <RetailQr />
        </div>

        {/* concealed activation strip */}

        <div className="relative border-t border-border pt-5 dark:border-white/[0.07]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
                Activation area
              </span>

              <p className="mt-1 text-[9px] font-medium text-[#3f3f46] dark:text-zinc-200">
                Concealed until needed
              </p>
            </div>

            <div
              aria-label="Illustrative concealed activation area"
              className="
                relative h-9 w-[116px]
                overflow-hidden
                rounded-[6px]
                border border-[#d6d0c8]
                bg-[#e8e0d2]
                dark:border-white/[0.08]
                dark:bg-[#3f3f46]
              "
            >
              <div
                aria-hidden="true"
                className="
                  absolute inset-0
                  flex items-center justify-center
                  font-mono text-[6px]
                  uppercase tracking-[0.16em]
                  text-muted-foreground
                "
              >
                Reveal to activate
              </div>

              <span
                aria-hidden="true"
                className="absolute left-2 top-2 h-px w-4 bg-[#a1a1aa]/25"
              />

              <span
                aria-hidden="true"
                className="absolute bottom-2 right-2 h-px w-4 bg-[#a1a1aa]/25"
              />
            </div>
          </div>
        </div>
      </article>

      <p className="mt-7 text-center font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
        Illustrative retail package · demo only
      </p>
    </div>
  );
}

/* ================================================================== */
/* SYNTHETIC QR                                                       */
/* ================================================================== */

function RetailQr() {
  return (
    <div
      aria-hidden="true"
      className="
        relative mx-auto
        flex h-[118px] w-[118px]
        items-center justify-center
        rounded-[12px]
        border border-border
        bg-white
        dark:border-white/[0.08]
      "
    >
      {/* finder corners */}

      <span className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#cc785c]" />
      <span className="absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#cc785c]" />
      <span className="absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#cc785c]" />
      <span className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#cc785c]" />

      <svg
        viewBox="0 0 72 72"
        className="h-[76px] w-[76px] text-[#09090b]"
      >
        <g fill="currentColor">
          <path d="M4 4h20v20H4V4Zm5 5v10h10V9H9Z" fillRule="evenodd" />
          <path d="M48 4h20v20H48V4Zm5 5v10h10V9H53Z" fillRule="evenodd" />
          <path d="M4 48h20v20H4V48Zm5 5v10h10V53H9Z" fillRule="evenodd" />

          <path d="M30 6h6v6h-6ZM38 6h5v5h-5ZM29 16h5v5h-5ZM37 14h7v7h-7Z" />

          <path d="M28 28h6v6h-6ZM37 27h5v5h-5ZM46 29h6v6h-6ZM56 28h7v7h-7Z" />

          <path d="M28 39h5v5h-5ZM36 37h8v8h-8ZM48 39h5v5h-5ZM57 39h7v7h-7Z" />

          <path d="M29 50h6v6h-6ZM38 48h5v5h-5ZM47 50h7v7h-7ZM58 50h5v5h-5Z" />

          <path d="M29 60h5v6h-5ZM38 58h8v8h-8ZM49 61h5v5h-5ZM58 58h7v8h-7Z" />
        </g>
      </svg>
    </div>
  );
}

/* ================================================================== */
/* ACTIVATION STEP                                                    */
/* ================================================================== */

function ActivationStep({
  number,
  verb,
  icon,
  title,
  description,
}: {
  number: string;
  verb: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article
      className="
        group relative grid
        grid-cols-[36px_minmax(0,1fr)]
        gap-4
        py-4
        sm:grid-cols-[36px_90px_minmax(0,1fr)]
        sm:items-start
      "
    >
      <div
        className="
          relative z-10
          flex h-9 w-9
          items-center justify-center
          rounded-full
          border border-border
          bg-muted
          text-muted-foreground
          transition-colors
          group-hover:border-[#cc785c]/30
          group-hover:text-[#cc785c]
          dark:border-white/[0.08]
          dark:bg-zinc-950
        "
      >
        <VaahanIcon
          name={icon as any}
          size={12}
          aria-hidden="true"
        />
      </div>

      <div className="hidden pt-1 sm:block">
        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#cc785c]">
          {number} / {verb}
        </span>
      </div>

      <div className="pt-0.5">
        <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-[#cc785c] sm:hidden">
          {number} / {verb}
        </span>

        <h4 className="mt-1 font-serif text-xl font-normal tracking-[-0.02em] text-[#252523] dark:text-zinc-100 sm:mt-0">
          {title}
        </h4>

        <p className="mt-2 max-w-[430px] text-[9px] leading-5 text-muted-foreground dark:text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}

/* ================================================================== */
/* ACTIVE IDENTITY                                                    */
/* ================================================================== */

function ActiveIdentity() {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[14px]
        border border-border
        bg-background
        p-5
        text-foreground
        sm:p-6
        dark:border-white/[0.07]
        dark:bg-zinc-950
        dark:text-zinc-50
      "
    >
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 h-48 w-48 rounded-full border border-[#cc785c]/10"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-muted text-[#cc785c] dark:border-white/[0.08] dark:bg-zinc-900">
            <VaahanIcon name="car" size={17} aria-hidden="true" />

            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#fafafa] bg-[#5db872] dark:border-[#09090b]" />
          </div>

          <div>
            <span className="font-mono text-[6px] uppercase tracking-[0.17em] text-muted-foreground dark:text-zinc-500">
              Activation destination
            </span>

            <p className="mt-1 font-serif text-xl font-normal tracking-[-0.02em] text-foreground dark:text-zinc-50">
              Vehicle identity active
            </p>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
            VaahanSafe ID
          </span>

          <p className="mt-1 font-mono text-[9px] tracking-[0.14em] text-[#cc785c]">
            VS-7F3K-9021
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-2 border-t border-border pt-4 dark:border-white/[0.07]">
        <VaahanIcon
          name="check"
          size={11}
          className="text-[#5db872]"
          aria-hidden="true"
        />

        <span className="text-[8px] text-muted-foreground dark:text-muted-foreground">
          Illustrative activation result
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* ROUTE STATE                                                        */
/* ================================================================== */

function RouteState({
  number,
  label,
  value,
  icon,
  accent = false,
}: {
  number: string;
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-h-[100px] items-center gap-4 px-3 py-5 sm:px-5">
      <span className="font-mono text-[7px] text-[#b0aaa2] dark:text-zinc-500">
        {number}
      </span>

      <div
        className={`
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-[9px]
          border
          ${
            accent
              ? "border-[#cc785c]/20 bg-[#cc785c]/[0.05] text-[#cc785c]"
              : "border-border text-muted-foreground dark:border-white/[0.08]"
          }
        `}
      >
        <VaahanIcon
          name={icon as any}
          size={13}
          aria-hidden="true"
        />
      </div>

      <div>
        <span className="font-mono text-[6px] uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-500">
          {label}
        </span>

        <p className="mt-1 text-[9px] font-medium text-[#3f3f46] dark:text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}