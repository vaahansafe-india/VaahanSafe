import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import {
  ALL_CORNERS_PATH,
  DEMO_QR_PATH,
} from "@vaahansafe/ui/brand";

/* ================================================================== */
/* PHYSICAL STICKER ANATOMY                                          */
/* ================================================================== */

export function PhysicalStickerAnatomy() {
  return (
    <section
      id="physical-sticker"
      aria-labelledby="physical-sticker-title"
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
      {/* AMBIENT IDENTITY GEOMETRY                                    */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="
            absolute -left-[320px] top-[16%]
            h-[700px] w-[700px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -left-[170px] top-[25%]
            h-[430px] w-[430px]
            rounded-full
            border border-[#cc785c]/[0.045]
          "
        />

        <div
          className="
            absolute -right-[240px] bottom-[8%]
            h-[580px] w-[580px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <span className="absolute left-[7%] top-[22%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/45 lg:block" />

        <span className="absolute right-[9%] top-[34%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

        <span className="absolute bottom-[18%] left-[16%] hidden h-1 w-1 rounded-full bg-[#e8a55a]/45 lg:block" />

        <span
          className="
            absolute left-[2.4%] top-1/2
            hidden -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.28em]
            text-muted-foreground/35
            xl:block
            dark:text-zinc-400/25
          "
        >
          Physical / Identity / Activation
        </span>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header
          className="
            grid gap-8
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
              Physical QR Identity
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
                Product Anatomy / 04
              </span>
            </div>
          </div>

          <div>
            <h2
              id="physical-sticker-title"
              className="
                max-w-[800px]
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
              Small on the vehicle.
              <br className="hidden sm:block" />
              <span className="text-[#cc785c]">
                {" "}
                Important when scanned.
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
              The VaahanSafe sticker carries a visible vehicle identity
              and a QR that connects the physical vehicle to its digital
              safety view.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* PRODUCT SPECIMEN                                             */}
        {/* ============================================================ */}

        <div
          className="
            relative mt-16
            lg:mt-24
            lg:min-h-[720px]
          "
        >
          {/* desktop annotation rails */}

          <div
            aria-hidden="true"
            className="
              absolute left-[17%] top-[26%]
              hidden h-px w-[17%]
              bg-[#e4e4e7]
              lg:block
              dark:bg-white/[0.08]
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute right-[17%] top-[26%]
              hidden h-px w-[17%]
              bg-[#e4e4e7]
              lg:block
              dark:bg-white/[0.08]
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute bottom-[22%] left-[17%]
              hidden h-px w-[17%]
              bg-[#e4e4e7]
              lg:block
              dark:bg-white/[0.08]
            "
          />

          <div
            aria-hidden="true"
            className="
              absolute bottom-[22%] right-[17%]
              hidden h-px w-[17%]
              bg-[#e4e4e7]
              lg:block
              dark:bg-white/[0.08]
            "
          />

          {/* ========================================================== */}
          {/* DESKTOP CALLOUT A                                          */}
          {/* ========================================================== */}

          <div
            className="
              mb-4
              lg:absolute
              lg:left-0
              lg:top-[15%]
              lg:w-[240px]
            "
          >
            <StickerCallout
              letter="A"
              eyebrow="Scan"
              title="Vehicle QR"
              description="The visible QR is the entry point to the vehicle's VaahanSafe safety identity."
              icon="qr"
            />
          </div>

          {/* ========================================================== */}
          {/* DESKTOP CALLOUT B                                          */}
          {/* ========================================================== */}

          <div
            className="
              mb-4
              lg:absolute
              lg:right-0
              lg:top-[15%]
              lg:w-[240px]
            "
          >
            <StickerCallout
              letter="B"
              eyebrow="Identify"
              title="Visible VaahanSafe ID"
              description="A readable identity code provides a human-friendly reference alongside the QR."
              icon="car"
            />
          </div>

          {/* ========================================================== */}
          {/* CENTRAL PRODUCT                                            */}
          {/* ========================================================== */}

          <div className="relative mx-auto max-w-[560px]">
            {/* product orbit */}

            <div
              aria-hidden="true"
              className="
                absolute left-1/2 top-1/2
                h-[118%] w-[118%]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                border border-[#09090b]/[0.035]
                dark:border-white/[0.035]
              "
            />

            <div
              aria-hidden="true"
              className="
                absolute left-1/2 top-1/2
                h-[103%] w-[103%]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                border border-[#cc785c]/[0.065]
              "
            />

            {/* floating product index */}

            <div
              className="
                absolute -top-5 left-5 z-20
                hidden items-center gap-2
                rounded-full
                border border-border
                bg-background/90
                px-3 py-1.5
                backdrop-blur-md
                sm:flex
                dark:border-white/[0.08]
                dark:bg-zinc-950/90
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span
                className="
                  font-mono text-[7px]
                  uppercase tracking-[0.18em]
                  text-muted-foreground
                  dark:text-muted-foreground
                "
              >
                VaahanSafe / Physical Identity
              </span>
            </div>

            {/* ======================================================== */}
            {/* STICKER                                                  */}
            {/* ======================================================== */}

            <article
              aria-label="Illustration of a VaahanSafe QR sticker"
              className="
                relative overflow-hidden
                rounded-[26px]
                border border-[#2c2a27]
                bg-[#09090b]
                p-4
                text-[#fafafa]
                shadow-[0_40px_120px_rgba(20,20,19,0.22)]
                sm:p-5
              "
            >
              {/* internal identity geometry */}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div
                  className="
                    absolute -right-24 -top-28
                    h-72 w-72
                    rounded-full
                    border border-white/[0.04]
                  "
                />

                <div
                  className="
                    absolute -right-12 -top-14
                    h-44 w-44
                    rounded-full
                    border border-[#cc785c]/[0.08]
                  "
                />

                <span className="absolute right-[10%] top-[24%] h-1 w-1 rounded-full bg-[#cc785c]/60" />

                <span className="absolute bottom-[15%] left-[9%] h-1 w-1 rounded-full bg-[#5db8a6]/45" />
              </div>

              <div
                className="
                  relative
                  rounded-[20px]
                  border border-white/[0.075]
                  bg-[#18181b]
                  p-5
                  sm:p-7
                "
              >
                {/* brand header */}

                <header
                  className="
                    flex items-center justify-between
                    gap-4
                    border-b border-white/[0.07]
                    pb-5
                  "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                        relative flex h-9 w-9
                        items-center justify-center
                        rounded-[9px]
                        bg-background
                        text-[#09090b]
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
                          absolute -right-0.5 -top-0.5
                          h-2 w-2
                          rounded-full
                          border-2 border-[#18181b]
                          bg-[#cc785c]
                        "
                      />
                    </div>

                    <div>
                      <span className="block text-[12px] font-semibold tracking-[0.04em]">
                        VAHAN
                        <span className="text-[#cc785c]">
                          SAFE
                        </span>
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

                  <span
                    className="
                      hidden
                      font-mono text-[7px]
                      uppercase tracking-[0.16em]
                      text-[#71717a]
                      sm:block
                    "
                  >
                    Identity / Demo
                  </span>
                </header>

                {/* ==================================================== */}
                {/* QR IDENTITY                                          */}
                {/* ==================================================== */}

                <div
                  className="
                    grid gap-6
                    py-7
                    sm:grid-cols-[150px_minmax(0,1fr)]
                    sm:items-center
                  "
                >
                  <div className="flex justify-center sm:justify-start">
                    <DemoStickerQr />
                  </div>

                  <div className="text-center sm:text-left">
                    <span
                      className="
                        font-mono text-[8px]
                        uppercase tracking-[0.18em]
                        text-[#71717a]
                      "
                    >
                      VaahanSafe ID
                    </span>

                    <p
                      className="
                        mt-2
                        font-mono text-lg
                        font-medium
                        tracking-[0.11em]
                        text-[#cc785c]
                        sm:text-xl
                      "
                    >
                      VS-7F3K-9021
                    </p>

                    <div
                      className="
                        mt-5 flex
                        items-center justify-center
                        gap-2
                        sm:justify-start
                      "
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

                      <span
                        className="
                          font-mono text-[7px]
                          uppercase tracking-[0.17em]
                          text-[#71717a]
                        "
                      >
                        Vehicle identity
                      </span>
                    </div>
                  </div>
                </div>

                {/* ==================================================== */}
                {/* SCRATCH ACTIVATION                                   */}
                {/* ==================================================== */}

                <div
                  className="
                    relative overflow-hidden
                    rounded-[13px]
                    border border-white/[0.07]
                    bg-[#09090b]
                    p-4
                  "
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <VaahanIcon
                        name="lock"
                        size={12}
                        className="text-[#cc785c]"
                        aria-hidden="true"
                      />

                      <span
                        className="
                          font-mono text-[7px]
                          uppercase tracking-[0.18em]
                          text-muted-foreground
                        "
                      >
                        Retail activation
                      </span>
                    </div>

                    <span
                      className="
                        font-mono text-[7px]
                        uppercase tracking-[0.15em]
                        text-[#5db8a6]
                      "
                    >
                      Concealed
                    </span>
                  </div>

                  <div
                    className="
                      relative mt-3
                      flex h-12
                      items-center justify-center
                      overflow-hidden
                      rounded-[8px]
                      border border-white/[0.08]
                      bg-[#18181b]
                    "
                  >
                    {/* metallic-style line texture without fake photo */}

                    <div
                      aria-hidden="true"
                      className="
                        absolute inset-0
                        opacity-[0.18]
                        [background-image:repeating-linear-gradient(115deg,transparent_0px,transparent_5px,rgba(255,255,255,0.12)_6px,transparent_7px)]
                      "
                    />

                    <span
                      className="
                        relative z-10
                        font-mono text-[8px]
                        font-medium uppercase
                        tracking-[0.22em]
                        text-[#a1a1aa]
                      "
                    >
                      Scratch to activate
                    </span>
                  </div>

                  <p
                    className="
                      mt-3
                      text-center text-[9px]
                      leading-5
                      text-[#71717a]
                    "
                  >
                    Used during activation of supported retail stickers.
                  </p>
                </div>

                {/* ==================================================== */}
                {/* PRODUCT FOOTER                                       */}
                {/* ==================================================== */}

                <footer
                  className="
                    mt-5 flex
                    items-center justify-between
                    gap-4
                    border-t border-white/[0.07]
                    pt-4
                  "
                >
                  <div className="flex items-center gap-2">
                    <VaahanIcon
                      name="qr"
                      size={11}
                      className="text-[#71717a]"
                      aria-hidden="true"
                    />

                    <span
                      className="
                        font-mono text-[7px]
                        uppercase tracking-[0.15em]
                        text-[#71717a]
                      "
                    >
                      Scan → Safety View
                    </span>
                  </div>

                  <span
                    className="
                      font-mono text-[7px]
                      uppercase tracking-[0.15em]
                      text-[#cc785c]
                    "
                  >
                    Demo specimen
                  </span>
                </footer>
              </div>
            </article>
          </div>

          {/* ========================================================== */}
          {/* CALLOUT C                                                  */}
          {/* ========================================================== */}

          <div
            className="
              mt-4
              lg:absolute
              lg:bottom-[10%]
              lg:left-0
              lg:mt-0
              lg:w-[240px]
            "
          >
            <StickerCallout
              letter="C"
              eyebrow="Activate"
              title="Concealed activation area"
              description="Supported retail stickers can include a concealed activation code used during ownership setup."
              icon="lock"
              tone="teal"
            />
          </div>

          {/* ========================================================== */}
          {/* CALLOUT D                                                  */}
          {/* ========================================================== */}

          <div
            className="
              mt-4
              lg:absolute
              lg:bottom-[10%]
              lg:right-0
              lg:mt-0
              lg:w-[240px]
            "
          >
            <StickerCallout
              letter="D"
              eyebrow="Place"
              title="Physical vehicle identity"
              description="The sticker gives the physical vehicle a visible connection to its VaahanSafe identity."
              icon="shield"
              tone="amber"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* PUBLIC VS ACTIVATION                                         */}
        {/* ============================================================ */}

        <div
          className="
            mt-16
            overflow-hidden
            rounded-[18px]
            border border-border
            bg-muted
            lg:mt-20
            dark:border-white/[0.07]
            dark:bg-zinc-900
          "
        >
          <div
            className="
              grid
              lg:grid-cols-[1fr_auto_1fr]
              lg:items-stretch
            "
          >
            {/* public identity */}

            <IdentityLayer
              number="01"
              icon="qr"
              eyebrow="Visible on the vehicle"
              title="Public identity"
              description="The QR and visible VaahanSafe ID are designed to identify the vehicle's VaahanSafe safety profile."
              signal="Scannable"
              tone="coral"
            />

            {/* center relationship */}

            <div
              className="
                relative flex
                min-h-[84px]
                items-center justify-center
                border-y border-border
                px-7
                lg:min-h-full
                lg:border-x
                lg:border-y-0
                dark:border-white/[0.07]
              "
            >
              <div className="flex flex-col items-center gap-2">
                <span
                  className="
                    font-mono text-[7px]
                    uppercase tracking-[0.17em]
                    text-muted-foreground
                    dark:text-zinc-500
                  "
                >
                  Different roles
                </span>

                <VaahanIcon
                  name="arrow-right"
                  size={13}
                  className="
                    rotate-90 text-[#cc785c]
                    lg:rotate-0
                  "
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* activation proof */}

            <IdentityLayer
              number="02"
              icon="lock"
              eyebrow="Used during setup"
              title="Activation proof"
              description="The concealed activation information is separate from the public vehicle identity and is used only in the retail activation flow."
              signal="Concealed"
              tone="teal"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* CLOSING STATEMENT                                            */}
        {/* ============================================================ */}

        <div
          className="
            mt-14 flex
            flex-col gap-6
            border-t border-border
            pt-8
            sm:flex-row
            sm:items-end
            sm:justify-between
            dark:border-white/[0.07]
          "
        >
          <p
            className="
              max-w-2xl
              font-serif text-2xl
              font-normal leading-[1.2]
              tracking-[-0.025em]
              text-[#252523]
              sm:text-3xl
              dark:text-zinc-100
            "
          >
            The QR identifies the vehicle.
            <span className="text-[#cc785c]">
              {" "}
              Activation establishes the connection.
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-3">
            <span className="h-px w-8 bg-[#cc785c]/40" />

            <span
              className="
                font-mono text-[8px]
                uppercase tracking-[0.18em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Two purposes / one product
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* STICKER CALLOUT                                                    */
/* ================================================================== */

function StickerCallout({
  letter,
  eyebrow,
  title,
  description,
  icon,
  tone = "coral",
}: {
  letter: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  tone?: "coral" | "teal" | "amber";
}) {
  const toneStyles = {
    coral: {
      accent: "text-[#cc785c]",
      border: "border-[#cc785c]/15",
      background: "bg-[#cc785c]/[0.06]",
      dot: "bg-[#cc785c]",
    },
    teal: {
      accent: "text-[#5db8a6]",
      border: "border-[#5db8a6]/15",
      background: "bg-[#5db8a6]/[0.06]",
      dot: "bg-[#5db8a6]",
    },
    amber: {
      accent: "text-[#e8a55a]",
      border: "border-[#e8a55a]/15",
      background: "bg-[#e8a55a]/[0.06]",
      dot: "bg-[#e8a55a]",
    },
  }[tone];

  return (
    <article
      className="
        relative
        border-t border-border
        py-5
        dark:border-white/[0.07]
        lg:border-t-0
        lg:py-0
      "
    >
      <div className="flex items-start gap-4">
        <div
          className={`
            flex h-10 w-10
            shrink-0 items-center justify-center
            rounded-[10px]
            border
            ${toneStyles.border}
            ${toneStyles.background}
            ${toneStyles.accent}
          `}
        >
          <VaahanIcon
            name={icon as any}
            size={15}
            aria-hidden="true"
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span
              className={`
                font-mono text-[8px]
                font-medium tracking-[0.15em]
                ${toneStyles.accent}
              `}
            >
              {letter}
            </span>

            <span className="h-px w-4 bg-[#d8d1c8] dark:bg-white/[0.08]" />

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
          </div>

          <h3
            className="
              mt-2
              text-[12px]
              font-medium
              text-[#252523]
              dark:text-[#e8e4dd]
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-2
              text-[10px]
              leading-5
              text-muted-foreground
              dark:text-zinc-500
            "
          >
            {description}
          </p>
        </div>
      </div>

      <span
        aria-hidden="true"
        className={`
          absolute hidden
          h-1.5 w-1.5
          rounded-full
          lg:block
          ${toneStyles.dot}
          ${
            letter === "A" || letter === "C"
              ? "-right-[5px] top-1/2"
              : "-left-[5px] top-1/2"
          }
        `}
      />
    </article>
  );
}

/* ================================================================== */
/* IDENTITY LAYER                                                     */
/* ================================================================== */

function IdentityLayer({
  number,
  icon,
  eyebrow,
  title,
  description,
  signal,
  tone,
}: {
  number: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  signal: string;
  tone: "coral" | "teal";
}) {
  const isCoral = tone === "coral";

  return (
    <div className="p-6 sm:p-8 lg:p-9">
      <div className="flex items-start justify-between gap-6">
        <div
          className={`
            flex h-10 w-10
            items-center justify-center
            rounded-[10px]
            border
            ${
              isCoral
                ? "border-[#cc785c]/15 bg-[#cc785c]/[0.06] text-[#cc785c]"
                : "border-[#5db8a6]/15 bg-[#5db8a6]/[0.06] text-[#5db8a6]"
            }
          `}
        >
          <VaahanIcon
            name={icon as any}
            size={15}
            aria-hidden="true"
          />
        </div>

        <span
          className="
            font-mono text-[8px]
            tracking-[0.16em]
            text-[#b0aaa2]
            dark:text-zinc-500
          "
        >
          {number}
        </span>
      </div>

      <span
        className="
          mt-6 block
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
          mt-2
          font-serif text-2xl
          font-normal
          tracking-[-0.025em]
          text-[#252523]
          dark:text-zinc-100
        "
      >
        {title}
      </h3>

      <p
        className="
          mt-3 max-w-md
          text-[11px]
          leading-6
          text-muted-foreground
          dark:text-muted-foreground
        "
      >
        {description}
      </p>

      <div className="mt-6 flex items-center gap-2">
        <span
          className={`
            h-1.5 w-1.5 rounded-full
            ${isCoral ? "bg-[#cc785c]" : "bg-[#5db8a6]"}
          `}
        />

        <span
          className={`
            font-mono text-[7px]
            uppercase tracking-[0.16em]
            ${isCoral ? "text-[#cc785c]" : "text-[#5db8a6]"}
          `}
        >
          {signal}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SYNTHETIC QR                                                       */
/* ================================================================== */

function DemoStickerQr() {
  return (
    <div
      className="
        relative
        flex h-[136px] w-[136px]
        items-center justify-center
        rounded-[15px]
        border border-white/[0.08]
        bg-background
        p-4
        shadow-[0_18px_50px_rgba(0,0,0,0.18)]
      "
    >
      {/* scan corner geometry */}

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-2 h-[calc(100%-16px)] w-[calc(100%-16px)]"
      >
        <path
          d={ALL_CORNERS_PATH}
          fill="#cc785c"
          opacity=".9"
        />
      </svg>

      {/* deliberately illustrative QR motif */}

      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
        className="relative z-10 h-[88px] w-[88px] text-foreground"
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
          border-[3px] border-[#18181b]
          bg-[#cc785c]
        "
      />
    </div>
  );
}