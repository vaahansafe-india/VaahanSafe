import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

const documents = [
  {
    number: "01",
    title: "Product Guide",
    description: "Understand the complete vehicle identity system.",
    type: "Guide",
    icon: "document",
  },
  {
    number: "02",
    title: "Quick Start",
    description: "From account creation to a ready vehicle identity.",
    type: "Start",
    icon: "check",
  },
  {
    number: "03",
    title: "Retail Activation",
    description: "Connect a pre-issued VaahanSafe QR to your vehicle.",
    type: "Activation",
    icon: "qr",
  },
  {
    number: "04",
    title: "QR Placement",
    description: "Choose a visible, appropriate location on your vehicle.",
    type: "Placement",
    icon: "qr",
  },
  {
    number: "05",
    title: "Safety & Privacy",
    description: "Choose useful information and understand data boundaries.",
    type: "Safety",
    icon: "shield",
  },
  {
    number: "06",
    title: "Plans, Orders & Support",
    description: "Understand plans, purchases, shipping, refunds and replacement.",
    type: "Support",
    icon: "document",
  },
] as const;

const helpTopics = [
  {
    number: "01",
    title: "Activate a retail QR",
    description: "Already purchased VaahanSafe? Start the activation journey.",
    category: "Activation",
    icon: "qr",
  },
  {
    number: "02",
    title: "Replace a damaged QR",
    description: "Understand the next steps when your current QR cannot be used.",
    category: "Replacement",
    icon: "shield",
  },
  {
    number: "03",
    title: "Update emergency contacts",
    description: "Manage the contacts associated with your safety profile.",
    category: "Account",
    icon: "phone",
  },
  {
    number: "04",
    title: "Understand scan activity",
    description: "Learn what scan-related information may appear in your account.",
    category: "Scans",
    icon: "activity",
  },
  {
    number: "05",
    title: "Plans and account services",
    description: "Understand the services available around your vehicle identity.",
    category: "Plans",
    icon: "receipt",
  },
] as const;

export function ResourceStation() {
  return (
    <section
      id="resources"
      aria-labelledby="resources-title"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-24
        sm:py-28
        lg:py-36
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
        <div
          className="
            absolute -left-[290px] top-[12%]
            h-[650px] w-[650px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -right-[300px] bottom-[2%]
            h-[680px] w-[680px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute right-[8%] top-[18%]
            hidden h-[280px] w-[280px]
            rounded-full
            border border-[#cc785c]/[0.035]
            lg:block
          "
        />

        <span className="absolute left-[8%] top-[42%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/35 lg:block" />

        <span className="absolute bottom-[20%] right-[10%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

        <span
          className="
            absolute left-[2.4%] top-1/2
            hidden -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.28em]
            text-muted-foreground/30
            xl:block
            dark:text-zinc-400/25
          "
        >
          Learn / Understand / Resolve
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header
          className="
            grid gap-9
            lg:grid-cols-[0.7fr_1.3fr]
            lg:items-end
            lg:gap-20
          "
        >
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
              Guides & Help
            </Badge>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span className="h-px w-8 bg-[#cc785c]/40" />

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.2em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                Knowledge Station / 12
              </span>
            </div>
          </div>

          <div>
            <h2
              id="resources-title"
              className="
                max-w-[850px]
                text-balance
                font-serif
                text-[2.8rem]
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
              Everything you need
              <br className="hidden sm:block" />

              <span className="text-[#cc785c]">
                {" "}
                to understand VaahanSafe.
              </span>
            </h2>

            <p
              className="
                mt-6 max-w-[620px]
                text-sm leading-7
                text-muted-foreground
                sm:text-base
                sm:leading-8
                dark:text-zinc-400
              "
            >
              Explore product guidance, QR placement, privacy,
              activation and support — without having to understand
              the technology behind the platform.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* RESOURCE INDEX                                               */}
        {/* ============================================================ */}

        <div className="mt-16 lg:mt-24">
          <div
            className="
              flex items-center justify-between
              gap-4
              border-b border-border
              pb-4
              dark:border-white/[0.07]
            "
          >
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.2em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                VaahanSafe Knowledge Index
              </span>
            </div>

            <span
              className="
                hidden
                font-mono text-[8px]
                uppercase tracking-[0.16em]
                text-[#b0aaa2]
                sm:block
                dark:text-zinc-500
              "
            >
              Product / Vehicle / Safety
            </span>
          </div>

          <div
            className="
              grid
              lg:grid-cols-[1.12fr_0.88fr]
              lg:gap-16
            "
          >
            {/* ======================================================== */}
            {/* DOCUMENTATION                                            */}
            {/* ======================================================== */}

            <div className="py-8 sm:py-10 lg:py-12">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <span
                    className="
                      font-mono text-[8px]
                      uppercase tracking-[0.18em]
                      text-[#cc785c]
                    "
                  >
                    01 / Learn
                  </span>

                  <h3
                    className="
                      mt-3
                      font-serif text-3xl
                      font-normal
                      tracking-[-0.03em]
                      text-[#252523]
                      sm:text-4xl
                      dark:text-zinc-100
                    "
                  >
                    Documents &amp; Guides
                  </h3>
                </div>

                <div
                  className="
                    flex h-10 w-10
                    shrink-0 items-center justify-center
                    rounded-[10px]
                    border border-border
                    text-[#cc785c]
                    dark:border-white/[0.07]
                  "
                >
                  <VaahanIcon
                    name="document"
                    size={15}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <p
                className="
                  mt-4 max-w-[520px]
                  text-[11px]
                  leading-6
                  text-muted-foreground
                  sm:text-[12px]
                  dark:text-muted-foreground
                "
              >
                Everything you need to understand and use VaahanSafe.
              </p>

              {/* resource rows */}

              <div
                className="
                  mt-8
                  border-t border-border
                  dark:border-white/[0.07]
                "
              >
                {documents.map((document) => (
                  <ResourceRow
                    key={document.number}
                    number={document.number}
                    icon={document.icon}
                    title={document.title}
                    description={document.description}
                    meta={document.type}
                  />
                ))}
              </div>

              <Link
                href="/documents"
                className="
                  group mt-8
                  inline-flex items-center
                  gap-3
                  rounded-[8px]
                  border border-border
                  px-4 py-2.5
                  text-[10px]
                  font-medium
                  text-[#3f3f46]
                  transition-colors
                  hover:border-[#cc785c]/25
                  hover:bg-[#cc785c]/[0.04]
                  hover:text-[#a9583e]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#cc785c]/30
                  focus-visible:ring-offset-2
                  dark:border-white/[0.09]
                  dark:text-zinc-200
                  dark:hover:bg-white/[0.03]
                "
              >
                <span>View all documents</span>

                <VaahanIcon
                  name="arrow-right"
                  size={12}
                  className="
                    transition-transform
                    group-hover:translate-x-0.5
                    motion-reduce:transform-none
                  "
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* ======================================================== */}
            {/* HELP                                                    */}
            {/* ======================================================== */}

            <div
              className="
                relative
                border-t border-border
                py-8
                sm:py-10
                lg:border-l
                lg:border-t-0
                lg:py-12
                lg:pl-12
                dark:border-white/[0.07]
              "
            >
              {/* subtle support rail */}

              <div
                aria-hidden="true"
                className="
                  absolute left-0 top-12
                  hidden h-20 w-px
                  bg-[#cc785c]
                  lg:block
                "
              />

              <div className="flex items-end justify-between gap-6">
                <div>
                  <span
                    className="
                      font-mono text-[8px]
                      uppercase tracking-[0.18em]
                      text-[#5db8a6]
                    "
                  >
                    02 / Resolve
                  </span>

                  <h3
                    className="
                      mt-3
                      font-serif text-3xl
                      font-normal
                      tracking-[-0.03em]
                      text-[#252523]
                      sm:text-4xl
                      dark:text-zinc-100
                    "
                  >
                    Help when you need it
                  </h3>
                </div>

                <div
                  className="
                    flex h-10 w-10
                    shrink-0 items-center justify-center
                    rounded-[10px]
                    border border-border
                    text-[#5db8a6]
                    dark:border-white/[0.07]
                  "
                >
                  <VaahanIcon
                    name="help"
                    size={15}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <p
                className="
                  mt-4 max-w-[480px]
                  text-[11px]
                  leading-6
                  text-muted-foreground
                  sm:text-[12px]
                  dark:text-muted-foreground
                "
              >
                Find the next step for activation, QR replacement,
                contacts, scan activity and account services.
              </p>

              <div
                className="
                  mt-8
                  border-t border-border
                  dark:border-white/[0.07]
                "
              >
                {helpTopics.map((topic) => (
                  <HelpRow
                    key={topic.number}
                    number={topic.number}
                    icon={topic.icon}
                    title={topic.title}
                    description={topic.description}
                    category={topic.category}
                  />
                ))}
              </div>

              <Link
                href="/help"
                className="
                  group mt-8
                  inline-flex items-center
                  gap-3
                  rounded-[8px]
                  border border-border
                  px-4 py-2.5
                  text-[10px]
                  font-medium
                  text-[#3f3f46]
                  transition-colors
                  hover:border-[#5db8a6]/25
                  hover:bg-[#5db8a6]/[0.04]
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#5db8a6]/25
                  focus-visible:ring-offset-2
                  dark:border-white/[0.09]
                  dark:text-zinc-200
                  dark:hover:bg-white/[0.03]
                "
              >
                <span>Visit Help Center</span>

                <VaahanIcon
                  name="arrow-right"
                  size={12}
                  className="
                    transition-transform
                    group-hover:translate-x-0.5
                    motion-reduce:transform-none
                  "
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* QUICK ROUTE RAIL                                             */}
        {/* ============================================================ */}

        <div
          className="
            mt-4
            border-y border-border
            dark:border-white/[0.07]
          "
        >
          <div
            className="
              grid
              md:grid-cols-3
            "
          >
            <QuickRoute
              index="01"
              href="/how-it-works"
              icon="route"
              title="How it works"
              description="Follow the complete QR journey."
            />

            <QuickRoute
              index="02"
              href="/safety"
              icon="shield"
              title="Safety & privacy"
              description="Understand the information boundary."
            />

            <QuickRoute
              index="03"
              href="/pricing"
              icon="receipt"
              title="Plans"
              description="Understand identity and available services."
              last
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* CLOSING                                                      */}
        {/* ============================================================ */}

        <footer
          className="
            mt-14 flex
            flex-col gap-6
            sm:flex-row
            sm:items-end
            sm:justify-between
            lg:mt-20
          "
        >
          <div>
            <span
              className="
                font-mono text-[8px]
                uppercase tracking-[0.18em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Designed to be understood
            </span>

            <p
              className="
                mt-3 max-w-[720px]
                font-serif text-2xl
                font-normal leading-[1.15]
                tracking-[-0.025em]
                text-[#252523]
                sm:text-3xl
                dark:text-zinc-100
              "
            >
              Understand the product.
              <span className="text-[#cc785c]">
                {" "}
                Find the next step.
              </span>
            </p>
          </div>

          <div
            aria-hidden="true"
            className="
              flex shrink-0 items-center gap-3
            "
          >
            <span className="h-px w-8 bg-[#cc785c]/35" />

            <span
              className="
                font-mono text-[7px]
                uppercase tracking-[0.18em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Learn / Resolve
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}

/* ================================================================== */
/* RESOURCE ROW                                                       */
/* ================================================================== */

function ResourceRow({
  number,
  icon,
  title,
  description,
  meta,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
  meta: string;
}) {
  return (
    <div
      className="
        group grid
        grid-cols-[28px_34px_minmax(0,1fr)]
        gap-3
        border-b border-border
        py-4
        transition-colors
        dark:border-white/[0.07]
        sm:grid-cols-[30px_36px_minmax(0,1fr)_auto]
        sm:items-center
      "
    >
      <span
        className="
          font-mono text-[7px]
          tracking-[0.13em]
          text-[#b0aaa2]
          dark:text-zinc-500
        "
      >
        {number}
      </span>

      <div
        className="
          flex h-8 w-8
          items-center justify-center
          rounded-[8px]
          border border-border
          text-muted-foreground
          transition-colors
          group-hover:border-[#cc785c]/15
          group-hover:text-[#cc785c]
          dark:border-white/[0.07]
        "
      >
        <VaahanIcon
          name={icon as any}
          size={11}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <p
          className="
            m-0
            text-[10px]
            font-medium
            text-[#3f3f46]
            dark:text-zinc-200
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-[8px]
            leading-4
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {description}
        </p>

        <span
          className="
            mt-2 inline-block
            font-mono text-[6px]
            uppercase tracking-[0.14em]
            text-[#cc785c]
            sm:hidden
          "
        >
          {meta}
        </span>
      </div>

      <span
        className="
          hidden
          font-mono text-[6px]
          uppercase tracking-[0.14em]
          text-muted-foreground
          sm:block
          dark:text-zinc-500
        "
      >
        {meta}
      </span>
    </div>
  );
}

/* ================================================================== */
/* HELP ROW                                                           */
/* ================================================================== */

function HelpRow({
  number,
  icon,
  title,
  description,
  category,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
  category: string;
}) {
  return (
    <div
      className="
        group grid
        grid-cols-[28px_34px_minmax(0,1fr)]
        gap-3
        border-b border-border
        py-4
        dark:border-white/[0.07]
        sm:grid-cols-[30px_36px_minmax(0,1fr)_auto]
        sm:items-center
      "
    >
      <span
        className="
          font-mono text-[7px]
          tracking-[0.13em]
          text-[#b0aaa2]
          dark:text-zinc-500
        "
      >
        {number}
      </span>

      <div
        className="
          flex h-8 w-8
          items-center justify-center
          rounded-[8px]
          border border-border
          text-muted-foreground
          transition-colors
          group-hover:border-[#5db8a6]/15
          group-hover:text-[#5db8a6]
          dark:border-white/[0.07]
        "
      >
        <VaahanIcon
          name={icon as any}
          size={11}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0">
        <p
          className="
            m-0
            text-[10px]
            font-medium
            text-[#3f3f46]
            dark:text-zinc-200
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-[8px]
            leading-4
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {description}
        </p>

        <span
          className="
            mt-2 inline-block
            font-mono text-[6px]
            uppercase tracking-[0.14em]
            text-[#5db8a6]
            sm:hidden
          "
        >
          {category}
        </span>
      </div>

      <span
        className="
          hidden
          font-mono text-[6px]
          uppercase tracking-[0.14em]
          text-[#5db8a6]
          sm:block
        "
      >
        {category}
      </span>
    </div>
  );
}

/* ================================================================== */
/* QUICK ROUTE                                                        */
/* ================================================================== */

function QuickRoute({
  index,
  href,
  icon,
  title,
  description,
  last = false,
}: {
  index: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group relative
        flex min-h-[112px]
        items-center gap-4
        px-4 py-5
        transition-colors
        hover:bg-muted
        focus-visible:z-10
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-[#cc785c]/25
        dark:hover:bg-white/[0.025]

        ${
          last
            ? ""
            : "border-b border-border md:border-b-0 md:border-r dark:border-white/[0.07]"
        }
      `}
    >
      <span
        className="
          absolute left-4 top-3
          font-mono text-[6px]
          tracking-[0.13em]
          text-[#b0aaa2]
          dark:text-zinc-500
        "
      >
        {index}
      </span>

      <div
        className="
          mt-3
          flex h-9 w-9
          shrink-0 items-center justify-center
          rounded-[9px]
          border border-border
          text-muted-foreground
          transition-colors
          group-hover:border-[#cc785c]/15
          group-hover:text-[#cc785c]
          dark:border-white/[0.07]
        "
      >
        <VaahanIcon
          name={icon as any}
          size={12}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <p
          className="
            text-[10px]
            font-medium
            text-[#3f3f46]
            dark:text-zinc-200
          "
        >
          {title}
        </p>

        <p
          className="
            mt-1
            text-[8px]
            leading-4
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {description}
        </p>
      </div>

      <VaahanIcon
        name="arrow-right"
        size={11}
        className="
          mt-3 shrink-0
          text-[#b0aaa2]
          transition-all
          group-hover:translate-x-0.5
          group-hover:text-[#cc785c]
          motion-reduce:transform-none
          dark:text-zinc-500
        "
        aria-hidden="true"
      />
    </Link>
  );
}