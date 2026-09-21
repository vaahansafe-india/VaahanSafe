import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import {
  getCustomerUrl,
  getActivateUrl,
} from "@vaahansafe/config";

export function FinalCtaStation() {
  const customerUrl = getCustomerUrl();
  const activateUrl = getActivateUrl();

  return (
    <section
      id="get-vaahansafe"
      aria-labelledby="final-cta-title"
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
      {/* OUTER IDENTITY FIELD                                         */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Large cropped identity geometry */}
        <div
          className="
            absolute left-1/2 top-1/2
            h-[720px] w-[720px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.025]
            sm:h-[920px] sm:w-[920px]
            lg:h-[1180px] lg:w-[1180px]
          "
        />

        <div
          className="
            absolute left-1/2 top-1/2
            h-[480px] w-[480px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#cc785c]/[0.045]
            sm:h-[660px] sm:w-[660px]
            lg:h-[880px] lg:w-[880px]
          "
        />

        {/* identity coordinates */}
        <span className="absolute left-[7%] top-[28%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/40 lg:block" />

        <span className="absolute bottom-[24%] right-[8%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

        <span className="absolute bottom-[18%] left-[14%] hidden h-1 w-1 rounded-full bg-[#e8a55a]/45 lg:block" />

        <span
          className="
            absolute left-[2.5%] top-1/2
            hidden -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.28em]
            text-muted-foreground/40
            xl:block
            dark:text-zinc-400/35
          "
        >
          Vehicle / Identity / Safety
        </span>

        <span
          className="
            absolute right-[2.5%] top-1/2
            hidden rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.28em]
            text-muted-foreground/40
            xl:block
            dark:text-zinc-400/35
          "
        >
          Get / Activate / Protect
        </span>
      </div>

      <div
        className="
          relative mx-auto
          max-w-[1320px]
          px-5
          sm:px-8
          lg:px-10
        "
      >
        {/* ============================================================ */}
        {/* FINAL STATION                                                */}
        {/* ============================================================ */}

        <div
          className="
            relative overflow-hidden
            rounded-[24px]
            border border-[#2c2a27]
            bg-[#09090b]
            text-[#fafafa]
            shadow-[0_45px_140px_rgba(20,20,19,0.22)]
            sm:rounded-[30px]
          "
        >
          {/* ========================================================== */}
          {/* INTERNAL ARCHITECTURAL FIELD                               */}
          {/* ========================================================== */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            {/* Coral light */}
            <div
              className="
                absolute -right-[180px] -top-[220px]
                h-[600px] w-[600px]
                rounded-full
                bg-[#cc785c]/[0.11]
                blur-[130px]
              "
            />

            {/* teal counter-light */}
            <div
              className="
                absolute -bottom-[260px] -left-[100px]
                h-[500px] w-[500px]
                rounded-full
                bg-[#5db8a6]/[0.045]
                blur-[120px]
              "
            />

            {/* Identity orbit */}
            <div
              className="
                absolute -right-[120px] top-1/2
                h-[560px] w-[560px]
                -translate-y-1/2
                rounded-full
                border border-white/[0.035]
              "
            />

            <div
              className="
                absolute -right-[20px] top-1/2
                h-[360px] w-[360px]
                -translate-y-1/2
                rounded-full
                border border-[#cc785c]/[0.07]
              "
            />

            {/* oversized ghost ID */}
            <span
              className="
                absolute -bottom-6 right-8
                hidden
                font-mono text-[5.5rem]
                font-medium
                tracking-[-0.07em]
                text-white/[0.018]
                lg:block
              "
            >
              VS
            </span>

            {/* scan fragments */}
            <span className="absolute right-[13%] top-[21%] hidden h-8 w-8 border-l border-t border-[#cc785c]/15 lg:block" />

            <span className="absolute bottom-[19%] right-[8%] hidden h-8 w-8 border-b border-r border-[#cc785c]/15 lg:block" />
          </div>

          {/* ========================================================== */}
          {/* TOP STATION BAR                                            */}
          {/* ========================================================== */}

          <div
            className="
              relative flex
              items-center justify-between
              gap-5
              border-b border-white/[0.07]
              px-5 py-4
              sm:px-7
              lg:px-9
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  relative flex h-8 w-8
                  items-center justify-center
                  rounded-[9px]
                  bg-background
                  text-[#09090b]
                "
              >
                <VaahanIcon
                  name="qr"
                  size={14}
                  aria-hidden="true"
                />

                <span
                  aria-hidden="true"
                  className="
                    absolute -right-0.5 -top-0.5
                    h-2 w-2
                    rounded-full
                    border-2 border-[#09090b]
                    bg-[#cc785c]
                  "
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium">
                  VaahanSafe
                </span>

                <span
                  className="
                    mt-0.5 block
                    font-mono text-[7px]
                    uppercase tracking-[0.18em]
                    text-[#71717a]
                  "
                >
                  Vehicle Safety Identity
                </span>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="h-px w-8 bg-[#cc785c]/35" />

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.18em]
                  text-[#71717a]
                "
              >
                Final Station / 15
              </span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* MAIN CTA COMPOSITION                                       */}
          {/* ========================================================== */}

          <div
            className="
              relative
              px-5 py-12
              sm:px-8 sm:py-16
              md:px-12
              lg:px-16 lg:py-20
              xl:px-20
            "
          >
            <div
              className="
                grid gap-14
                lg:grid-cols-[1.12fr_.88fr]
                lg:items-center
                lg:gap-20
              "
            >
              {/* ====================================================== */}
              {/* PRIMARY NARRATIVE                                      */}
              {/* ====================================================== */}

              <div>
                <Badge
                  variant="outline"
                  className="
                    mb-7 rounded-full
                    border-white/[0.1]
                    bg-white/[0.035]
                    px-3.5 py-1.5
                    font-mono text-[8px]
                    font-medium uppercase
                    tracking-[0.2em]
                    text-[#a1a1aa]
                  "
                >
                  Ready when your vehicle needs it
                </Badge>

                <h2
                  id="final-cta-title"
                  className="
                    max-w-[760px]
                    text-balance
                    font-serif
                    text-[2.8rem]
                    font-normal
                    leading-[0.96]
                    tracking-[-0.05em]
                    text-[#fafafa]
                    sm:text-5xl
                    md:text-6xl
                    lg:text-[4.5rem]
                    xl:text-[5rem]
                  "
                >
                  Give your vehicle
                  <br className="hidden sm:block" />
                  <span className="text-[#cc785c]">
                    {" "}
                    an identity that matters.
                  </span>
                </h2>

                <p
                  className="
                    mt-7 max-w-xl
                    text-sm leading-7
                    text-[#a1a1aa]
                    sm:text-base
                    sm:leading-8
                  "
                >
                  Your vehicle deserves an identity that can help when it matters.
                  Get VaahanSafe for your vehicle, or activate a retail
                  QR sticker you already have.
                </p>

                {/* Main actions */}
                <div
                  className="
                    mt-9 flex
                    flex-col gap-3
                    sm:flex-row
                    sm:items-center
                  "
                >
                  <Button
                    size="lg"
                    asChild
                    className="
                      group h-12
                      w-full
                      rounded-[9px]
                      bg-[#cc785c]
                      px-6
                      text-[12px]
                      font-medium
                      text-white
                      shadow-none
                      hover:bg-[#a9583e]
                      focus-visible:ring-[#cc785c]
                      sm:w-auto
                    "
                  >
                    <a
                      href={customerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>Get VaahanSafe</span>

                      <VaahanIcon
                        name="arrow-right"
                        size={14}
                        className="
                          ml-2
                          transition-transform
                          duration-200
                          group-hover:translate-x-0.5
                          motion-reduce:transform-none
                        "
                        aria-hidden="true"
                      />
                    </a>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="
                      h-12
                      w-full
                      rounded-[9px]
                      border-white/[0.11]
                      bg-white/[0.035]
                      px-6
                      text-[12px]
                      font-medium
                      text-[#f4f4f5]
                      shadow-none
                      hover:border-white/[0.18]
                      hover:bg-white/[0.06]
                      hover:text-white
                      sm:w-auto
                    "
                  >
                    <a
                      href={activateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <VaahanIcon
                        name="qr"
                        size={14}
                        className="mr-2 text-[#cc785c]"
                        aria-hidden="true"
                      />

                      <span>Activate Retail QR</span>
                    </a>
                  </Button>
                </div>

                {/* Micro reassurance */}
                <div
                  className="
                    mt-7 flex flex-wrap
                    items-center
                    gap-x-5 gap-y-3
                  "
                >
                  <MicroSignal
                    icon="qr"
                    text="Permanent QR identity"
                  />

                  <MicroSignal
                    icon="shield"
                    text="Owner-controlled safety view"
                  />

                  <MicroSignal
                    icon="phone"
                    text="Emergency contact access"
                  />
                </div>
              </div>

              {/* ====================================================== */}
              {/* TWO ROUTES / ONE IDENTITY                              */}
              {/* ====================================================== */}

              <div className="relative">
                {/* Vertical identity spine */}
                <div
                  aria-hidden="true"
                  className="
                    absolute bottom-[70px]
                    left-[21px] top-[70px]
                    hidden w-px
                    bg-gradient-to-b
                    from-[#cc785c]/50
                    via-white/[0.08]
                    to-[#5db8a6]/35
                    sm:block
                  "
                />

                <div
                  className="
                    mb-5 flex
                    items-center justify-between
                    gap-4
                  "
                >
                  <span
                    className="
                      font-mono text-[8px]
                      uppercase tracking-[0.2em]
                      text-[#71717a]
                    "
                  >
                    Two ways to begin
                  </span>

                  <span
                    className="
                      font-mono text-[8px]
                      uppercase tracking-[0.18em]
                      text-[#cc785c]
                    "
                  >
                    One identity
                  </span>
                </div>

                <div className="space-y-3">
                  <AcquisitionRoute
                    index="01"
                    icon="car"
                    eyebrow="Getting VaahanSafe"
                    title="Start online"
                    description="Add your vehicle and begin the VaahanSafe setup from your account."
                    action="Get VaahanSafe"
                    href={customerUrl}
                    accent="coral"
                  />

                  <AcquisitionRoute
                    index="02"
                    icon="qr"
                    eyebrow="Already have a sticker?"
                    title="Activate retail QR"
                    description="Scan or activate the VaahanSafe sticker you already purchased."
                    action="Start activation"
                    href={activateUrl}
                    accent="teal"
                  />
                </div>

                {/* Convergence */}
                <div
                  className="
                    mt-4
                    rounded-[13px]
                    border border-white/[0.07]
                    bg-[#09090b]/60
                    px-4 py-4
                  "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        relative flex h-9 w-9
                        shrink-0 items-center justify-center
                        rounded-[10px]
                        border border-[#cc785c]/20
                        bg-[#cc785c]/[0.07]
                        text-[#cc785c]
                      "
                    >
                      <VaahanIcon
                        name="shield"
                        size={15}
                        aria-hidden="true"
                      />

                      <span
                        aria-hidden="true"
                        className="
                          absolute -right-1 -top-1
                          h-2 w-2
                          rounded-full
                          bg-[#5db872]
                        "
                      />
                    </div>

                    <div>
                      <span
                        className="
                          block font-mono
                          text-[7px] uppercase
                          tracking-[0.18em]
                          text-[#71717a]
                        "
                      >
                        Destination
                      </span>

                      <span
                        className="
                          mt-1 block
                          text-[10px]
                          font-medium
                          text-[#e4e4e7]
                        "
                      >
                        Your vehicle&apos;s VaahanSafe identity
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* DEEP ROUTE RAIL                                            */}
          {/* ========================================================== */}

          <nav
            aria-label="Explore VaahanSafe"
            className="
              relative
              border-t border-white/[0.07]
              bg-[#151513]/60
            "
          >
            <div
              className="
                grid
                sm:grid-cols-3
                sm:divide-x
                sm:divide-white/[0.07]
              "
            >
              <DeepRoute
                href="/how-it-works"
                index="01"
                icon="route"
                title="How it works"
                description="See the full QR journey"
              />

              <DeepRoute
                href="/safety"
                index="02"
                icon="shield"
                title="Safety & privacy"
                description="Understand what can be shown"
              />

              <DeepRoute
                href="/pricing"
                index="03"
                icon="receipt"
                title="Plans"
                description="Explore available options"
              />
            </div>
          </nav>

          {/* bottom identity spectrum */}
          <div
            aria-hidden="true"
            className="
              h-[3px] w-full
              bg-gradient-to-r
              from-[#cc785c]
              via-[#e8a55a]
              to-[#5db8a6]
            "
          />
        </div>

        {/* ============================================================ */}
        {/* EXTERNAL STATION CAPTION                                     */}
        {/* ============================================================ */}

        <div
          className="
            mt-5 flex
            flex-col items-center
            justify-between gap-3
            px-1
            sm:flex-row
          "
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#cc785c]/40" />

            <span
              className="
                font-mono text-[8px]
                uppercase tracking-[0.18em]
                text-muted-foreground/60
                dark:text-zinc-400/55
              "
            >
              VaahanSafe / Vehicle Identity
            </span>
          </div>

          <span
            className="
              text-center text-[10px]
              text-muted-foreground
              sm:text-right
              dark:text-zinc-500
            "
          >
            Choose the route that matches how you received VaahanSafe.
          </span>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* ACQUISITION ROUTE                                                  */
/* ================================================================== */

function AcquisitionRoute({
  index,
  icon,
  eyebrow,
  title,
  description,
  action,
  href,
  accent,
}: {
  index: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  href: string;
  accent: "coral" | "teal";
}) {
  const accentClasses =
    accent === "coral"
      ? {
          dot: "bg-[#cc785c]",
          icon: "text-[#cc785c] bg-[#cc785c]/[0.08] border-[#cc785c]/15",
          action: "text-[#cc785c]",
        }
      : {
          dot: "bg-[#5db8a6]",
          icon: "text-[#5db8a6] bg-[#5db8a6]/[0.07] border-[#5db8a6]/15",
          action: "text-[#7fc9ba]",
        };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        group relative block
        rounded-[15px]
        border border-white/[0.07]
        bg-[#20201d]/85
        p-4
        outline-none
        transition-[background-color,border-color,transform]
        duration-300
        hover:-translate-y-0.5
        hover:border-white/[0.12]
        hover:bg-[#24231f]
        focus-visible:ring-2
        focus-visible:ring-[#cc785c]
        focus-visible:ring-offset-2
        focus-visible:ring-offset-[#09090b]
        sm:p-5
        motion-reduce:transform-none
        motion-reduce:transition-none
      "
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div
            className={`
              flex h-11 w-11
              shrink-0 items-center justify-center
              rounded-[11px]
              border
              ${accentClasses.icon}
            `}
          >
            <VaahanIcon
              name={icon as any}
              size={17}
              aria-hidden="true"
            />
          </div>

          <span
            aria-hidden="true"
            className={`
              absolute -left-[3px] top-1/2
              hidden h-1.5 w-1.5
              -translate-x-full -translate-y-1/2
              rounded-full
              sm:block
              ${accentClasses.dot}
            `}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className="
                  font-mono text-[7px]
                  uppercase tracking-[0.18em]
                  text-[#71717a]
                "
              >
                {index} / {eyebrow}
              </span>

              <h3
                className="
                  mt-1.5
                  text-[12px]
                  font-medium
                  text-[#f4f4f5]
                "
              >
                {title}
              </h3>
            </div>

            <VaahanIcon
              name="arrow-right"
              size={13}
              className="
                mt-1 shrink-0
                text-[#71717a]
                transition-[transform,color]
                duration-200
                group-hover:translate-x-0.5
                group-hover:text-[#fafafa]
                motion-reduce:transform-none
              "
              aria-hidden="true"
            />
          </div>

          <p
            className="
              mt-2 max-w-sm
              text-[9px]
              leading-5
              text-[#71717a]
              sm:text-[10px]
            "
          >
            {description}
          </p>

          <span
            className={`
              mt-4 inline-flex items-center
              gap-1.5
              text-[9px]
              font-medium
              ${accentClasses.action}
            `}
          >
            {action}

            <span
              aria-hidden="true"
              className="
                h-px w-5
                bg-current opacity-35
                transition-[width,opacity]
                duration-200
                group-hover:w-8
                group-hover:opacity-60
                motion-reduce:transition-none
              "
            />
          </span>
        </div>
      </div>
    </a>
  );
}

/* ================================================================== */
/* MICRO SIGNAL                                                       */
/* ================================================================== */

function MicroSignal({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <VaahanIcon
        name={icon as any}
        size={11}
        className="text-[#71717a]"
        aria-hidden="true"
      />

      <span className="text-[9px] text-[#71717a]">
        {text}
      </span>
    </div>
  );
}

/* ================================================================== */
/* DEEP ROUTE                                                        */
/* ================================================================== */

function DeepRoute({
  href,
  index,
  icon,
  title,
  description,
}: {
  href: string;
  index: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="
        group flex
        min-h-[92px]
        items-center gap-4
        border-b border-white/[0.07]
        px-5 py-5
        outline-none
        transition-colors
        hover:bg-white/[0.025]
        focus-visible:bg-white/[0.04]
        sm:border-b-0
        sm:px-6
        lg:px-8
      "
    >
      <span
        className="
          font-mono text-[8px]
          tracking-[0.16em]
          text-[#71717a]
        "
      >
        {index}
      </span>

      <div
        className="
          flex h-9 w-9
          shrink-0 items-center justify-center
          rounded-[9px]
          border border-white/[0.07]
          bg-white/[0.025]
          text-[#71717a]
          transition-colors
          group-hover:border-[#cc785c]/15
          group-hover:bg-[#cc785c]/[0.06]
          group-hover:text-[#cc785c]
        "
      >
        <VaahanIcon
          name={icon as any}
          size={14}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <span
          className="
            block text-[11px]
            font-medium
            text-[#e4e4e7]
          "
        >
          {title}
        </span>

        <span
          className="
            mt-1 block
            text-[9px]
            text-[#71717a]
          "
        >
          {description}
        </span>
      </div>

      <VaahanIcon
        name="arrow-right"
        size={12}
        className="
          shrink-0
          text-[#71717a]
          transition-[transform,color]
          group-hover:translate-x-0.5
          group-hover:text-[#cc785c]
          motion-reduce:transform-none
        "
        aria-hidden="true"
      />
    </Link>
  );
}