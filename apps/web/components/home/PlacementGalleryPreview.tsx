import Link from "next/link";

import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import {
  ALL_CORNERS_PATH,
  DEMO_QR_PATH,
} from "@vaahansafe/ui/brand";

/* ================================================================== */
/* PLACEMENT GALLERY                                                  */
/* ================================================================== */

export function PlacementGalleryPreview() {
  return (
    <section
      id="placement"
      aria-labelledby="placement-title"
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
      {/* IDENTITY FIELD                                                */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="
            absolute -left-[280px] top-[18%]
            h-[620px] w-[620px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -right-[240px] bottom-[6%]
            h-[560px] w-[560px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute left-[8%] top-[32%]
            hidden h-1.5 w-1.5
            rounded-full
            bg-[#cc785c]/50
            lg:block
          "
        />

        <div
          className="
            absolute right-[9%] top-[44%]
            hidden h-1.5 w-1.5
            rounded-full
            bg-[#5db8a6]/40
            lg:block
          "
        />

        <span
          className="
            absolute left-[2.5%] top-1/2
            hidden -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.28em]
            text-muted-foreground/30
            xl:block
            dark:text-zinc-400/25
          "
        >
          Vehicle / Placement / Identity
        </span>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header
          className="
            grid gap-9
            lg:grid-cols-[0.72fr_1.28fr]
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
                bg-muted/80
                px-3.5 py-1.5
                font-mono text-[9px]
                font-medium uppercase
                tracking-[0.2em]
                text-muted-foreground
                dark:border-zinc-700
                dark:bg-zinc-900/80
                dark:text-zinc-400
              "
            >
              Placement Guide
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
                Physical World / 10
              </span>
            </div>
          </div>

          <div>
            <h2
              id="placement-title"
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
              Made to be noticed
              <br className="hidden sm:block" />
              <span className="text-[#cc785c]">
                {" "}
                when someone needs it.
              </span>
            </h2>

            <p
              className="
                mt-6 max-w-[620px]
                text-sm leading-7
                text-muted-foreground
                sm:text-base sm:leading-8
                dark:text-zinc-400
              "
            >
              Placement is part of the identity. The QR should be easy
              to notice and scan while staying clear of areas that affect
              safe vehicle use or visibility.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* PLACEMENT FIELD                                              */}
        {/* ============================================================ */}

        <div
          className="
            mt-16 grid gap-4
            md:grid-cols-12
            lg:mt-24
            lg:gap-5
          "
        >
          {/* ========================================================== */}
          {/* PRIMARY CAR COMPOSITION                                    */}
          {/* ========================================================== */}

          <article
            className="
              relative overflow-hidden
              rounded-[22px]
              border border-[#2b2926]
              bg-[#09090b]
              text-[#fafafa]
              md:col-span-8
              md:min-h-[540px]
              lg:min-h-[610px]
            "
          >
            {/* geometry */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div
                className="
                  absolute -right-32 -top-36
                  h-[440px] w-[440px]
                  rounded-full
                  border border-white/[0.035]
                "
              />

              <div
                className="
                  absolute -right-16 -top-20
                  h-[280px] w-[280px]
                  rounded-full
                  border border-[#cc785c]/[0.07]
                "
              />

              <span
                className="
                  absolute right-[13%] top-[18%]
                  h-1.5 w-1.5
                  rounded-full bg-[#cc785c]/70
                "
              />

              <span
                className="
                  absolute bottom-[19%] left-[11%]
                  h-1 w-1
                  rounded-full bg-[#5db8a6]/60
                "
              />
            </div>

            {/* top metadata */}

            <header
              className="
                relative z-10
                flex items-center justify-between
                gap-4
                border-b border-white/[0.07]
                px-5 py-4
                sm:px-7
              "
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[8px] tracking-[0.17em] text-[#cc785c]">
                  01
                </span>

                <span className="h-px w-5 bg-white/[0.12]" />

                <span
                  className="
                    font-mono text-[8px]
                    uppercase tracking-[0.18em]
                    text-[#71717a]
                  "
                >
                  Passenger vehicle
                </span>
              </div>

              <span
                className="
                  font-mono text-[7px]
                  uppercase tracking-[0.17em]
                  text-[#5db8a6]
                "
              >
                Windshield
              </span>
            </header>

            {/* car stage */}

            <div
              className="
                relative flex
                min-h-[330px]
                items-center justify-center
                px-5 py-6
                sm:min-h-[380px] sm:px-7 sm:py-8
                lg:min-h-[420px]
              "
            >
              <CarPlacementIllustration />
            </div>

            {/* bottom explanation */}

            <footer
              className="
                relative z-10
                grid gap-5
                border-t border-white/[0.07]
                px-5 py-5
                sm:grid-cols-[1fr_auto]
                sm:items-end
                sm:px-7 sm:py-6
              "
            >
              <div>
                <span
                  className="
                    font-mono text-[7px]
                    uppercase tracking-[0.18em]
                    text-[#71717a]
                  "
                >
                  Example placement
                </span>

                <h3
                  className="
                    mt-2
                    font-serif text-2xl
                    font-normal
                    tracking-[-0.025em]
                    text-[#fafafa]
                    sm:text-3xl
                  "
                >
                  Passenger car glass
                </h3>

                <p
                  className="
                    mt-2 max-w-lg
                    text-[11px]
                    leading-6
                    text-muted-foreground
                  "
                >
                  Position the sticker where it can be found and scanned
                  without obstructing the driver&apos;s field of view.
                </p>
              </div>

              <PlacementSignal
                icon="qr"
                label="Visible + scannable"
              />
            </footer>
          </article>

          {/* ========================================================== */}
          {/* RIGHT EDITORIAL COLUMN                                     */}
          {/* ========================================================== */}

          <div
            className="
              grid gap-4
              md:col-span-4
              lg:gap-5
            "
          >
            <PlacementStory
              number="02"
              icon="bike"
              eyebrow="Two-wheeler"
              title="Bike or scooter"
              description="Choose a stable, visible surface that keeps the QR easy to notice and scan."
              accent="coral"
            >
              <BikePlacementIllustration />
            </PlacementStory>

            <PlacementStory
              number="03"
              icon="shield"
              eyebrow="Rider"
              title="Helmet placement"
              description="Where supported by the product instructions, a separate rider placement can provide another visible safety identity point."
              accent="teal"
            >
              <HelmetPlacementIllustration />
            </PlacementStory>
          </div>

          {/* ========================================================== */}
          {/* BOTTOM PRODUCT STRIP                                       */}
          {/* ========================================================== */}

          <article
            className="
              relative overflow-hidden
              rounded-[18px]
              border border-border
              bg-muted
              md:col-span-5
              dark:border-white/[0.07]
              dark:bg-zinc-900
            "
          >
            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <PlacementNumber number="04" />

                <VaahanIcon
                  name="qr"
                  size={15}
                  className="text-[#cc785c]"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-8 flex justify-center">
                <RetailKitIllustration />
              </div>

              <span
                className="
                  mt-8 block
                  font-mono text-[7px]
                  uppercase tracking-[0.18em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                Before placement
              </span>

              <h3
                className="
                  mt-2
                  font-serif text-2xl
                  tracking-[-0.025em]
                  text-[#252523]
                  dark:text-zinc-100
                "
              >
                Retail QR kit
              </h3>

              <p
                className="
                  mt-2 text-[10px]
                  leading-5
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                The sticker begins as a physical product and becomes
                connected to a vehicle during activation.
              </p>
            </div>
          </article>

          {/* ========================================================== */}
          {/* PLACEMENT PRINCIPLE                                        */}
          {/* ========================================================== */}

          <article
            className="
              relative overflow-hidden
              rounded-[18px]
              border border-border
              bg-muted
              md:col-span-7
              dark:border-white/[0.07]
              dark:bg-zinc-900
            "
          >
            <div
              className="
                grid h-full
                gap-8 p-6
                sm:p-8
                lg:grid-cols-[1fr_0.9fr]
                lg:items-center
              "
            >
              <div>
                <PlacementNumber number="05" />

                <span
                  className="
                    mt-8 block
                    font-mono text-[7px]
                    uppercase tracking-[0.18em]
                    text-muted-foreground
                    dark:text-zinc-500
                  "
                >
                  Placement principle
                </span>

                <h3
                  className="
                    mt-3 max-w-md
                    font-serif text-3xl
                    font-normal leading-[1.05]
                    tracking-[-0.03em]
                    text-[#252523]
                    sm:text-4xl
                    dark:text-zinc-100
                  "
                >
                  Visible enough to find.
                  <span className="text-[#cc785c]">
                    {" "}
                    Thoughtful enough to belong.
                  </span>
                </h3>

                <p
                  className="
                    mt-4 max-w-md
                    text-[11px]
                    leading-6
                    text-muted-foreground
                    dark:text-muted-foreground
                  "
                >
                  Final placement should follow the instructions supplied
                  with the VaahanSafe product and should never interfere
                  with vehicle visibility, controls, safety equipment or
                  legally required markings.
                </p>
              </div>

              <PlacementPrincipleDiagram />
            </div>
          </article>
        </div>

        {/* ============================================================ */}
        {/* PLACEMENT SEQUENCE                                           */}
        {/* ============================================================ */}

        <div
          className="
            mt-5
            grid
            border-y border-border
            sm:grid-cols-3
            sm:divide-x
            sm:divide-border
            dark:border-white/[0.07]
            dark:sm:divide-white/[0.07]
          "
        >
          <PlacementStep
            number="01"
            title="Choose"
            description="Find a suitable visible surface."
          />

          <PlacementStep
            number="02"
            title="Place"
            description="Follow the supplied placement guidance."
          />

          <PlacementStep
            number="03"
            title="Check"
            description="Confirm the QR remains easy to scan."
          />
        </div>

        {/* ============================================================ */}
        {/* CTA                                                          */}
        {/* ============================================================ */}

        <div
          className="
            mt-12 flex
            flex-col gap-6
            sm:flex-row
            sm:items-center
            sm:justify-between
            lg:mt-14
          "
        >
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

            <span
              className="
                font-mono text-[8px]
                uppercase tracking-[0.18em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Placement examples are illustrative
            </span>
          </div>

          <Button
            variant="outline"
            asChild
            className="
              h-11
              rounded-[8px]
              border-border
              bg-transparent
              px-6
              text-[11px]
              font-medium
              text-[#252523]
              shadow-none
              hover:border-[#cc785c]/30
              hover:bg-[#cc785c]/[0.05]
              hover:text-[#cc785c]
              dark:border-white/[0.09]
              dark:text-zinc-100
              dark:hover:bg-[#cc785c]/[0.06]
            "
          >
            <Link
              href="/gallery"
              className="group flex items-center gap-2"
            >
              <span>Explore placement guide</span>

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
/* CAR PLACEMENT                                                      */
/* ================================================================== */

function CarPlacementIllustration() {
  return (
    <div
      className="
        relative flex w-full
        max-w-[640px]
        items-center justify-center
      "
    >
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-[#11100e] shadow-2xl">
        <img
          src="/images/gallery/car-windshield-placement.jpg"
          alt="Passenger car windshield corner placement with VaahanSafe QR safety decal"
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          loading="eager"
        />

        {/* Top badge overlay */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c] animate-pulse" />
          <span>Windshield Identity Point</span>
        </div>

        {/* Bottom caption overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#e4e4e7]">
            Physical vehicle → Scannable identity
          </span>
          <span className="rounded border border-[#cc785c]/30 bg-[#cc785c]/20 px-2 py-0.5 font-mono text-[8px] font-medium tracking-wider text-[#cc785c]">
            RHD Passenger Corner
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* PLACEMENT STORY                                                    */
/* ================================================================== */

function PlacementStory({
  number,
  icon,
  eyebrow,
  title,
  description,
  accent,
  children,
}: {
  number: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: "coral" | "teal";
  children: React.ReactNode;
}) {
  const isCoral = accent === "coral";

  return (
    <article
      className="
        relative flex min-h-[260px]
        flex-col overflow-hidden
        rounded-[18px]
        border border-border
        bg-muted
        dark:border-white/[0.07]
        dark:bg-zinc-900
      "
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <PlacementNumber number={number} />

        <div
          className={`
            flex h-8 w-8 items-center justify-center
            rounded-[8px] border
            ${
              isCoral
                ? "border-[#cc785c]/15 bg-[#cc785c]/[0.06] text-[#cc785c]"
                : "border-[#5db8a6]/15 bg-[#5db8a6]/[0.06] text-[#5db8a6]"
            }
          `}
        >
          <VaahanIcon
            name={icon as any}
            size={13}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="flex min-h-[110px] items-center justify-center px-5 py-3">
        {children}
      </div>

      <div
        className="
          mt-auto
          border-t border-border
          px-5 py-5
          dark:border-white/[0.06]
        "
      >
        <span
          className="
            font-mono text-[7px]
            uppercase tracking-[0.18em]
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {eyebrow}
        </span>

        <h3
          className="
            mt-2 font-serif text-xl
            tracking-[-0.02em]
            text-[#252523]
            dark:text-zinc-100
          "
        >
          {title}
        </h3>

        <p
          className="
            mt-2 text-[10px]
            leading-5
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {description}
        </p>
      </div>
    </article>
  );
}

/* ================================================================== */
/* BIKE ILLUSTRATION                                                  */
/* ================================================================== */

function BikePlacementIllustration() {
  return (
    <div className="group relative aspect-[16/9] w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-white shadow-xs dark:border-white/[0.08] dark:bg-zinc-950">
      <img
        src="/images/gallery/motorcycle-placement.jpg"
        alt="Motorcycle side cowl placement with VaahanSafe QR safety decal"
        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/65 px-2 py-0.5 font-mono text-[8px] text-white backdrop-blur-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        <span>Side cowl placement</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* HELMET ILLUSTRATION                                                */
/* ================================================================== */

function HelmetPlacementIllustration() {
  return (
    <div className="group relative aspect-[16/9] w-full max-w-[280px] overflow-hidden rounded-xl border border-border bg-white shadow-xs dark:border-white/[0.08] dark:bg-zinc-950">
      <img
        src="/images/gallery/helmet-placement.jpg"
        alt="Helmet placement advisory with VaahanSafe QR decal"
        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/65 px-2 py-0.5 font-mono text-[8px] text-white backdrop-blur-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
        <span>Rider gear profile</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* RETAIL KIT                                                         */
/* ================================================================== */

function RetailKitIllustration() {
  return (
    <div
      aria-hidden="true"
      className="
        relative h-[150px] w-[210px]
      "
    >
      {/* rear envelope */}

      <div
        className="
          absolute left-2 top-5
          h-[120px] w-[170px]
          rotate-[-5deg]
          rounded-[12px]
          border border-[#d8d1c8]
          bg-[#e8e0d2]
          dark:border-white/[0.08]
          dark:bg-zinc-900
        "
      />

      {/* front package */}

      <div
        className="
          absolute right-1 top-0
          h-[135px] w-[175px]
          rotate-[3deg]
          rounded-[13px]
          border border-border
          bg-background
          p-4
          shadow-[0_16px_45px_rgba(20,20,19,0.09)]
          dark:border-white/[0.08]
          dark:bg-zinc-950
        "
      >
        <div className="flex items-center justify-between">
          <span
            className="
              text-[8px] font-semibold
              tracking-[0.06em]
              text-[#252523]
              dark:text-zinc-50
            "
          >
            VAHAN
            <span className="text-[#cc785c]">
              SAFE
            </span>
          </span>

          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
        </div>

        <div className="mt-5 flex justify-center">
          <div
            className="
              flex h-14 w-14
              items-center justify-center
              rounded-[8px]
              border border-border
              bg-white
              p-2
            "
          >
            <MiniQr />
          </div>
        </div>

        <span
          className="
            mt-4 block text-center
            font-mono text-[6px]
            uppercase tracking-[0.16em]
            text-muted-foreground
          "
        >
          Vehicle QR Identity
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* PLACEMENT PRINCIPLE                                                */
/* ================================================================== */

function PlacementPrincipleDiagram() {
  return (
    <div
      aria-hidden="true"
      className="
        relative mx-auto
        flex h-[230px] w-full
        max-w-[300px]
        items-center justify-center
      "
    >
      <span
        className="
          absolute h-[210px] w-[210px]
          rounded-full
          border border-[#09090b]/[0.055]
          dark:border-white/[0.05]
        "
      />

      <span
        className="
          absolute h-[145px] w-[145px]
          rounded-full
          border border-[#cc785c]/[0.11]
        "
      />

      <div
        className="
          relative flex h-[82px] w-[82px]
          items-center justify-center
          rounded-[18px]
          border border-border
          bg-background
          shadow-[0_14px_40px_rgba(20,20,19,0.08)]
          dark:border-white/[0.08]
          dark:bg-zinc-950
        "
      >
        <MiniQr />
      </div>

      <DiagramLabel
        className="left-0 top-6"
        number="01"
        label="Visible"
      />

      <DiagramLabel
        className="right-0 top-6"
        number="02"
        label="Reachable"
      />

      <DiagramLabel
        className="bottom-4 left-1/2 -translate-x-1/2"
        number="03"
        label="Scannable"
      />
    </div>
  );
}

function DiagramLabel({
  className,
  number,
  label,
}: {
  className: string;
  number: string;
  label: string;
}) {
  return (
    <div
      className={`
        absolute flex items-center gap-2
        ${className}
      `}
    >
      <span className="font-mono text-[7px] text-[#cc785c]">
        {number}
      </span>

      <span
        className="
          font-mono text-[7px]
          uppercase tracking-[0.15em]
          text-muted-foreground
          dark:text-zinc-500
        "
      >
        {label}
      </span>
    </div>
  );
}

/* ================================================================== */
/* PLACEMENT SIGNAL                                                   */
/* ================================================================== */

function PlacementSignal({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div
      className="
        inline-flex w-fit
        items-center gap-2
        rounded-full
        border border-white/[0.08]
        bg-white/[0.035]
        px-3 py-2
      "
    >
      <VaahanIcon
        name={icon as any}
        size={11}
        className="text-[#cc785c]"
        aria-hidden="true"
      />

      <span
        className="
          font-mono text-[7px]
          uppercase tracking-[0.15em]
          text-muted-foreground
        "
      >
        {label}
      </span>
    </div>
  );
}

/* ================================================================== */
/* NUMBER                                                             */
/* ================================================================== */

function PlacementNumber({
  number,
}: {
  number: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[8px] tracking-[0.15em] text-[#cc785c]">
        {number}
      </span>

      <span className="h-px w-5 bg-[#cc785c]/30" />
    </div>
  );
}

/* ================================================================== */
/* PLACEMENT STEP                                                     */
/* ================================================================== */

function PlacementStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        flex min-h-[96px]
        items-center gap-4
        border-b border-border
        px-3 py-5
        last:border-b-0
        sm:border-b-0
        sm:px-6
        dark:border-white/[0.07]
      "
    >
      <div
        className="
          flex h-8 w-8 shrink-0
          items-center justify-center
          rounded-full
          border border-[#cc785c]/15
          bg-[#cc785c]/[0.05]
        "
      >
        <span className="font-mono text-[7px] text-[#cc785c]">
          {number}
        </span>
      </div>

      <div>
        <span
          className="
            block text-[11px]
            font-medium
            text-[#252523]
            dark:text-[#e8e4dd]
          "
        >
          {title}
        </span>

        <span
          className="
            mt-1 block text-[9px]
            leading-4
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {description}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SYNTHETIC QR                                                       */
/* ================================================================== */

/**
 * Illustrative only.
 * It must never encode a real public ID, activation secret,
 * customer record, or live qr.vaahansafe.com destination.
 */
function MiniQr() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className="h-[70%] w-[70%] text-foreground"
    >
      <path
        d={ALL_CORNERS_PATH}
        fill="#cc785c"
      />

      <path
        d={DEMO_QR_PATH}
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}