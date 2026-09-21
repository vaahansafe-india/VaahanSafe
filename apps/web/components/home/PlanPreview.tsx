import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import {
  ALL_CORNERS_PATH,
  DEMO_QR_PATH,
} from "@vaahansafe/ui/brand";

export function PlanPreview() {
  return (
    <section
      id="pricing"
      aria-labelledby="plan-preview-title"
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
            absolute -left-[260px] top-[18%]
            h-[620px] w-[620px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -right-[260px] bottom-[5%]
            h-[680px] w-[680px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -right-[90px] bottom-[20%]
            h-[360px] w-[360px]
            rounded-full
            border border-[#cc785c]/[0.04]
          "
        />

        <span className="absolute left-[8%] top-[31%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/40 lg:block" />

        <span className="absolute bottom-[24%] right-[9%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

        <span
          className="
            absolute left-[2.5%] top-1/2
            hidden -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.28em]
            text-muted-foreground/35
            xl:block
            dark:text-zinc-400/30
          "
        >
          Identity / Services / Control
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
              Identity & Plan
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
                Product Model / 08
              </span>
            </div>
          </div>

          <div>
            <h2
              id="plan-preview-title"
              className="
                max-w-[820px]
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
              The identity is the QR.
              <br className="hidden sm:block" />

              <span className="text-[#cc785c]">
                {" "}
                The plan is what surrounds it.
              </span>
            </h2>

            <p
              className="
                mt-6 max-w-[640px]
                text-sm leading-7
                text-muted-foreground
                sm:text-base
                sm:leading-8
                dark:text-zinc-400
              "
            >
              Your vehicle&apos;s VaahanSafe identity and your VaahanSafe
              plan are separate concepts. The QR identifies the vehicle;
              the plan determines the services available around that
              identity.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* IDENTITY / PLAN COMPOSITION                                  */}
        {/* ============================================================ */}

        <div
          className="
            mt-16 overflow-hidden
            rounded-[24px]
            border border-border
            bg-muted
            sm:rounded-[28px]
            lg:mt-24
            dark:border-white/[0.07]
            dark:bg-zinc-900
          "
        >
          {/* top architecture rail */}

          <div
            className="
              flex items-center justify-between
              gap-4
              border-b border-border
              px-5 py-4
              sm:px-7
              lg:px-9
              dark:border-white/[0.07]
            "
          >
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.19em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                VaahanSafe Product Relationship
              </span>
            </div>

            <span
              className="
                hidden
                font-mono text-[8px]
                uppercase tracking-[0.18em]
                text-[#b0aaa2]
                sm:block
                dark:text-zinc-500
              "
            >
              Identity ≠ Plan
            </span>
          </div>

          <div
            className="
              grid
              lg:grid-cols-[0.92fr_100px_1.08fr]
              lg:items-stretch
            "
          >
            {/* ======================================================== */}
            {/* QR IDENTITY                                              */}
            {/* ======================================================== */}

            <article
              className="
                relative overflow-hidden
                p-6
                sm:p-8
                lg:p-10
              "
            >
              {/* subtle identity geometry */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div
                  className="
                    absolute -left-24 -top-24
                    h-72 w-72
                    rounded-full
                    border border-[#09090b]/[0.035]
                    dark:border-white/[0.025]
                  "
                />

                <div
                  className="
                    absolute -left-12 -top-12
                    h-44 w-44
                    rounded-full
                    border border-[#cc785c]/[0.055]
                  "
                />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <span
                      className="
                        font-mono text-[8px]
                        uppercase tracking-[0.19em]
                        text-[#cc785c]
                      "
                    >
                      01 / Vehicle Identity
                    </span>

                    <h3
                      className="
                        mt-4
                        font-serif text-3xl
                        font-normal
                        tracking-[-0.035em]
                        text-[#252523]
                        sm:text-4xl
                        dark:text-zinc-100
                      "
                    >
                      Your VaahanSafe QR
                    </h3>
                  </div>

                  <span
                    className="
                      rounded-full
                      border border-[#cc785c]/15
                      bg-[#cc785c]/[0.06]
                      px-2.5 py-1
                      font-mono text-[7px]
                      uppercase tracking-[0.15em]
                      text-[#cc785c]
                    "
                  >
                    Identity
                  </span>
                </div>

                <p
                  className="
                    mt-4 max-w-md
                    text-[12px]
                    leading-6
                    text-muted-foreground
                    sm:text-[13px]
                    dark:text-muted-foreground
                  "
                >
                  The physical QR represents the VaahanSafe identity
                  assigned to this vehicle.
                </p>

                {/* QR artifact */}

                <div
                  className="
                    mt-9 flex
                    flex-col items-center
                    gap-7
                    sm:flex-row
                  "
                >
                  <DemoIdentityQr />

                  <div className="w-full">
                    <span
                      className="
                        font-mono text-[7px]
                        uppercase tracking-[0.18em]
                        text-muted-foreground
                        dark:text-zinc-500
                      "
                    >
                      Example VaahanSafe ID
                    </span>

                    <p
                      className="
                        mt-2
                        font-mono text-lg
                        font-medium
                        tracking-[0.1em]
                        text-[#cc785c]
                      "
                    >
                      VS-7F3K-9021
                    </p>

                    <div
                      className="
                        mt-5
                        border-t border-border
                        pt-4
                        dark:border-white/[0.07]
                      "
                    >
                      <IdentityFact
                        icon="car"
                        label="Belongs to"
                        value="One vehicle identity"
                      />

                      <IdentityFact
                        icon="qr"
                        label="Purpose"
                        value="Opens its safety view"
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="
                    mt-8
                    flex items-start gap-3
                    rounded-[12px]
                    border border-border
                    bg-background/60
                    p-4
                    dark:border-white/[0.07]
                    dark:bg-zinc-950/50
                  "
                >
                  <VaahanIcon
                    name="shield"
                    size={14}
                    className="mt-0.5 shrink-0 text-[#cc785c]"
                    aria-hidden="true"
                  />

                  <p
                    className="
                      text-[10px]
                      leading-5
                      text-muted-foreground
                      dark:text-zinc-500
                    "
                  >
                    Think of this as the identity your vehicle carries
                    into the physical world.
                  </p>
                </div>
              </div>
            </article>

            {/* ======================================================== */}
            {/* RELATIONSHIP CONNECTOR                                   */}
            {/* ======================================================== */}

            <div
              className="
                relative flex
                min-h-[110px]
                items-center justify-center
                border-y border-border
                lg:min-h-0
                lg:border-x
                lg:border-y-0
                dark:border-white/[0.07]
              "
            >
              <div
                aria-hidden="true"
                className="
                  absolute left-1/2 top-0
                  hidden h-full w-px
                  -translate-x-1/2
                  bg-[#e4e4e7]
                  lg:block
                  dark:bg-white/[0.07]
                "
              />

              <div
                className="
                  relative z-10
                  flex h-12 w-12
                  items-center justify-center
                  rounded-full
                  border border-border
                  bg-background
                  text-[#cc785c]
                  dark:border-white/[0.09]
                  dark:bg-zinc-950
                "
              >
                <VaahanIcon
                  name="arrow-right"
                  size={15}
                  className="rotate-90 lg:rotate-0"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* PLAN / SERVICES                                         */}
            {/* ======================================================== */}

            <article
              className="
                relative overflow-hidden
                bg-[#09090b]
                p-6
                text-[#fafafa]
                sm:p-8
                lg:p-10
              "
            >
              {/* internal product field */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div
                  className="
                    absolute -right-28 -top-28
                    h-80 w-80
                    rounded-full
                    border border-white/[0.04]
                  "
                />

                <div
                  className="
                    absolute -right-14 -top-14
                    h-48 w-48
                    rounded-full
                    border border-[#5db8a6]/[0.07]
                  "
                />

                <span className="absolute right-[12%] top-[28%] h-1.5 w-1.5 rounded-full bg-[#5db8a6]/45" />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <span
                      className="
                        font-mono text-[8px]
                        uppercase tracking-[0.19em]
                        text-[#5db8a6]
                      "
                    >
                      02 / Services
                    </span>

                    <h3
                      className="
                        mt-4
                        font-serif text-3xl
                        font-normal
                        tracking-[-0.035em]
                        text-[#fafafa]
                        sm:text-4xl
                      "
                    >
                      Your VaahanSafe plan
                    </h3>
                  </div>

                  <span
                    className="
                      rounded-full
                      border border-[#5db8a6]/15
                      bg-[#5db8a6]/[0.06]
                      px-2.5 py-1
                      font-mono text-[7px]
                      uppercase tracking-[0.15em]
                      text-[#5db8a6]
                    "
                  >
                    Services
                  </span>
                </div>

                <p
                  className="
                    mt-4 max-w-md
                    text-[12px]
                    leading-6
                    text-[#a1a1aa]
                    sm:text-[13px]
                  "
                >
                  A plan determines which VaahanSafe services and
                  account features are available around your vehicle
                  identity.
                </p>

                {/* service constellation */}

                <div className="mt-9 space-y-2.5">
                  <ServiceLine
                    index="01"
                    icon="shield"
                    title="Safety profile controls"
                    description="Manage the safety information available for the vehicle."
                  />

                  <ServiceLine
                    index="02"
                    icon="phone"
                    title="Contact features"
                    description="Manage the contact options supported by your plan."
                  />

                  <ServiceLine
                    index="03"
                    icon="activity"
                    title="Scan activity"
                    description="Access scan-related features when included in your plan."
                  />

                  <ServiceLine
                    index="04"
                    icon="qr"
                    title="QR support"
                    description="Access applicable QR support or replacement options."
                  />
                </div>

                <div
                  className="
                    mt-8
                    flex items-start gap-3
                    border-t border-white/[0.07]
                    pt-5
                  "
                >
                  <VaahanIcon
                    name="receipt"
                    size={14}
                    className="mt-0.5 shrink-0 text-[#5db8a6]"
                    aria-hidden="true"
                  />

                  <p
                    className="
                      text-[10px]
                      leading-5
                      text-[#71717a]
                    "
                  >
                    Available services can vary by plan. Review the
                    current plan details before choosing.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SIMPLE EXPLANATION                                          */}
        {/* ============================================================ */}

        <div
          className="
            mt-10
            grid gap-3
            sm:grid-cols-3
            lg:mt-12
          "
        >
          <RelationshipStep
            number="01"
            label="Vehicle"
            text="Your physical vehicle"
            icon="car"
          />

          <RelationshipStep
            number="02"
            label="Identity"
            text="Its VaahanSafe QR"
            icon="qr"
            accent
          />

          <RelationshipStep
            number="03"
            label="Services"
            text="Features around that identity"
            icon="shield"
          />
        </div>

        {/* ============================================================ */}
        {/* CLOSING / CTA                                               */}
        {/* ============================================================ */}

        <div
          className="
            mt-14 flex
            flex-col gap-7
            border-t border-border
            pt-8
            sm:flex-row
            sm:items-end
            sm:justify-between
            lg:mt-20
            dark:border-white/[0.07]
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
              The simple distinction
            </span>

            <p
              className="
                mt-3 max-w-2xl
                font-serif text-2xl
                font-normal leading-[1.15]
                tracking-[-0.025em]
                text-[#252523]
                sm:text-3xl
                dark:text-zinc-100
              "
            >
              One identifies your vehicle.
              <span className="text-[#cc785c]">
                {" "}
                The other defines the services around it.
              </span>
            </p>
          </div>

          <Button
            variant="outline"
            asChild
            className="
              group h-11
              w-full shrink-0
              rounded-[8px]
              border-border
              bg-transparent
              px-5
              text-[11px]
              font-medium
              text-[#252523]
              shadow-none
              hover:border-[#cc785c]/25
              hover:bg-[#cc785c]/[0.05]
              hover:text-[#a9583e]
              sm:w-auto
              dark:border-white/[0.1]
              dark:text-zinc-100
              dark:hover:bg-white/[0.04]
            "
          >
            <Link
              href="/pricing"
              className="flex items-center gap-2"
            >
              <span>Explore Plans</span>

              <VaahanIcon
                name="arrow-right"
                size={13}
                className="
                  transition-transform
                  group-hover:translate-x-0.5
                  motion-reduce:transform-none
                "
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* DEMO IDENTITY QR                                                   */
/* ================================================================== */

function DemoIdentityQr() {
  return (
    <div
      className="
        relative flex
        h-[142px] w-[142px]
        shrink-0
        items-center justify-center
        rounded-[16px]
        border border-border
        bg-background
        p-4
        shadow-[0_18px_50px_rgba(20,20,19,0.08)]
      "
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)]"
      >
        <path
          d={ALL_CORNERS_PATH}
          fill="#cc785c"
        />
      </svg>

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="
          relative z-10
          h-[88px] w-[88px]
          text-foreground
        "
      >
        <path
          d={DEMO_QR_PATH}
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>

      <span
        aria-hidden="true"
        className="
          absolute -right-1 -top-1
          h-3 w-3
          rounded-full
          border-[3px] border-[#f4f4f5]
          bg-[#cc785c]
          dark:border-[#18181b]
        "
      />
    </div>
  );
}

/* ================================================================== */
/* IDENTITY FACT                                                      */
/* ================================================================== */

function IdentityFact({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex items-center
        justify-between gap-4
        py-2
      "
    >
      <div className="flex items-center gap-2">
        <VaahanIcon
          name={icon as any}
          size={11}
          className="text-muted-foreground"
          aria-hidden="true"
        />

        <span
          className="
            text-[9px]
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {label}
        </span>
      </div>

      <span
        className="
          text-right text-[9px]
          font-medium
          text-[#3f3f46]
          dark:text-[#c9c5be]
        "
      >
        {value}
      </span>
    </div>
  );
}

/* ================================================================== */
/* SERVICE LINE                                                       */
/* ================================================================== */

function ServiceLine({
  index,
  icon,
  title,
  description,
}: {
  index: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        group grid
        grid-cols-[28px_36px_minmax(0,1fr)]
        items-center
        gap-3
        rounded-[11px]
        border border-white/[0.065]
        bg-[#18181b]
        px-3.5 py-3
        transition-colors
        hover:border-white/[0.1]
        hover:bg-[#22211e]
      "
    >
      <span
        className="
          font-mono text-[7px]
          tracking-[0.12em]
          text-[#71717a]
        "
      >
        {index}
      </span>

      <div
        className="
          flex h-8 w-8
          items-center justify-center
          rounded-[8px]
          border border-[#5db8a6]/10
          bg-[#5db8a6]/[0.045]
          text-[#5db8a6]
        "
      >
        <VaahanIcon
          name={icon as any}
          size={12}
          aria-hidden="true"
        />
      </div>

      <div>
        <span
          className="
            block text-[10px]
            font-medium
            text-[#e4e4e7]
          "
        >
          {title}
        </span>

        <span
          className="
            mt-0.5 block
            text-[8px]
            leading-4
            text-[#71717a]
          "
        >
          {description}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* RELATIONSHIP STEP                                                  */
/* ================================================================== */

function RelationshipStep({
  number,
  label,
  text,
  icon,
  accent = false,
}: {
  number: string;
  label: string;
  text: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className="
        flex items-center
        gap-4
        border-t border-border
        py-4
        dark:border-white/[0.07]
      "
    >
      <span
        className="
          font-mono text-[7px]
          tracking-[0.14em]
          text-[#b0aaa2]
          dark:text-zinc-500
        "
      >
        {number}
      </span>

      <div
        className={`
          flex h-8 w-8
          shrink-0 items-center justify-center
          rounded-[8px]
          border
          ${
            accent
              ? "border-[#cc785c]/15 bg-[#cc785c]/[0.06] text-[#cc785c]"
              : "border-border text-muted-foreground dark:border-white/[0.07]"
          }
        `}
      >
        <VaahanIcon
          name={icon as any}
          size={12}
          aria-hidden="true"
        />
      </div>

      <div>
        <span
          className="
            block
            font-mono text-[7px]
            uppercase tracking-[0.16em]
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {label}
        </span>

        <span
          className="
            mt-1 block
            text-[10px]
            text-[#3f3f46]
            dark:text-zinc-400
          "
        >
          {text}
        </span>
      </div>
    </div>
  );
}