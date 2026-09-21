import { HOMEPAGE_DEMO_DATA } from "../../lib/demo/homepage-demo";
import { Badge } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

/**
 * STATION 13 — VERIFIED FIELD EVIDENCE
 *
 * HARD PRODUCT RULE:
 * ------------------------------------------------------------
 * This section MUST NOT render unless formally approved,
 * publishable pilot/customer evidence exists.
 *
 * Never:
 * - invent quotes
 * - invent customer names
 * - invent cities
 * - invent vehicle counts
 * - invent ratings
 * - invent adoption metrics
 * - render placeholder testimonials
 *
 * No evidence = no section.
 */
export function EvidenceSection() {
  const { evidenceConfig } = HOMEPAGE_DEMO_DATA;

  const evidenceItems = evidenceConfig.evidenceItems ?? [];

  if (
    !evidenceConfig.hasPublishedEvidence ||
    evidenceItems.length === 0
  ) {
    return null;
  }

  return (
    <section
      id="field-evidence"
      aria-labelledby="field-evidence-title"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-muted
        py-24
        sm:py-28
        lg:py-36
        dark:border-border
        dark:bg-zinc-950
      "
    >
      {/* ============================================================ */}
      {/* BACKGROUND — FIELD RECORD SYSTEM                             */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* oversized record geometry */}
        <div
          className="
            absolute
            -right-[280px] top-[12%]
            h-[650px] w-[650px]
            rounded-full
            border border-[#09090b]/[0.035]
            dark:border-white/[0.025]
          "
        />

        <div
          className="
            absolute
            -right-[170px] top-[20%]
            h-[430px] w-[430px]
            rounded-full
            border border-[#cc785c]/[0.06]
          "
        />

        {/* soft coral atmosphere */}
        <div
          className="
            absolute right-[4%] top-[35%]
            h-[380px] w-[380px]
            rounded-full
            bg-[#cc785c]/[0.035]
            blur-[110px]
          "
        />

        {/* left micro rail */}
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
          Field / Evidence / Published
        </span>

        {/* sparse coordinates */}
        <span className="absolute left-[8%] top-[27%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/45 lg:block" />

        <span className="absolute right-[11%] bottom-[28%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

        <span className="absolute bottom-[16%] left-[18%] hidden h-1 w-1 rounded-full bg-[#e8a55a]/40 lg:block" />
      </div>

      <div
        className="
          relative mx-auto
          max-w-[1240px]
          px-5
          sm:px-8
          lg:px-10
        "
      >
        {/* ============================================================ */}
        {/* HEADER                                                       */}
        {/* ============================================================ */}

        <header
          className="
            grid gap-8
            lg:grid-cols-[0.75fr_1.25fr]
            lg:items-end
            lg:gap-16
          "
        >
          {/* classification */}
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
                backdrop-blur-sm
                dark:border-zinc-700
                dark:bg-zinc-900/80
                dark:text-zinc-400
              "
            >
              Verified Field Evidence
            </Badge>

            <div className="mt-6 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span
                  className="
                    absolute inline-flex
                    h-full w-full
                    animate-ping
                    rounded-full
                    bg-[#5db872]
                    opacity-20
                    motion-reduce:hidden
                  "
                />

                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5db872]" />
              </span>

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.2em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                Published evidence only
              </span>
            </div>
          </div>

          {/* title */}
          <div>
            <span
              className="
                mb-4 block
                font-mono text-[8px]
                uppercase tracking-[0.22em]
                text-[#cc785c]
              "
            >
              Field Record / 13
            </span>

            <h2
              id="field-evidence-title"
              className="
                max-w-[760px]
                text-balance
                font-serif
                text-[2.65rem]
                font-normal
                leading-[0.98]
                tracking-[-0.045em]
                text-foreground
                sm:text-5xl
                md:text-6xl
                lg:text-[4.25rem]
                dark:text-zinc-50
              "
            >
              What we learn
              <br className="hidden sm:block" />
              <span className="text-[#cc785c]">
                {" "}
                in the real world.
              </span>
            </h2>

            <p
              className="
                mt-6 max-w-xl
                text-sm leading-7
                text-muted-foreground
                sm:text-base
                dark:text-zinc-400
              "
            >
              Published observations and experiences from approved
              VaahanSafe pilots and customers.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* RECORD DIVIDER                                               */}
        {/* ============================================================ */}

        <div
          aria-hidden="true"
          className="
            my-14 flex
            items-center gap-4
            sm:my-16
            lg:my-20
          "
        >
          <span className="h-px flex-1 bg-[#dcd5cc] dark:bg-white/[0.07]" />

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-500">
              Evidence Archive
            </span>

            <span className="h-1.5 w-1.5 rounded-full bg-[#5db8a6]" />
          </div>

          <span className="h-px flex-1 bg-[#dcd5cc] dark:bg-white/[0.07]" />
        </div>

        {/* ============================================================ */}
        {/* FIELD RECORDS                                                */}
        {/* ============================================================ */}

        <div className="space-y-5 sm:space-y-6">
          {evidenceItems.map((item, index) => (
            <EvidenceRecord
              key={item.id}
              item={item}
              index={index}
              total={evidenceItems.length}
            />
          ))}
        </div>

        {/* ============================================================ */}
        {/* EVIDENCE FOOTER                                              */}
        {/* ============================================================ */}

        <div
          className="
            mt-12 grid gap-6
            border-t border-[#dcd5cc]
            pt-7
            sm:mt-16
            sm:grid-cols-[1fr_auto]
            sm:items-center
            dark:border-white/[0.07]
          "
        >
          <div className="flex max-w-xl items-start gap-3">
            <VaahanIcon
              name="shield"
              size={14}
              className="mt-0.5 shrink-0 text-[#5db8a6]"
              aria-hidden="true"
            />

            <p
              className="
                text-[10px] leading-5
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              This area is intentionally limited to evidence that has
              been reviewed and approved for public presentation.
            </p>
          </div>

          <div
            className="
              flex items-center gap-3
              font-mono text-[8px]
              uppercase tracking-[0.18em]
              text-muted-foreground
              dark:text-zinc-500
            "
          >
            <span>
              {String(evidenceItems.length).padStart(2, "0")} published
              {evidenceItems.length === 1 ? " record" : " records"}
            </span>

            <span className="h-1 w-1 rounded-full bg-[#cc785c]" />

            <span>VaahanSafe</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* EVIDENCE RECORD                                                    */
/* ================================================================== */

function EvidenceRecord({
  item,
  index,
  total,
}: {
  item: {
    id: string;
    quote: string;
    source: string;
    context: string;
  };
  index: number;
  total: number;
}) {
  const recordNumber = String(index + 1).padStart(2, "0");
  const totalNumber = String(total).padStart(2, "0");

  return (
    <article
      className="
        group relative
        overflow-hidden
        rounded-[18px]
        border border-[#ddd6cd]
        bg-background/75
        transition-[border-color,transform]
        duration-300
        hover:border-[#cc785c]/30
        sm:rounded-[22px]
        dark:border-white/[0.07]
        dark:bg-zinc-900
        dark:hover:border-[#cc785c]/20
        motion-reduce:transition-none
      "
    >
      {/* hover signal */}
      <span
        aria-hidden="true"
        className="
          absolute inset-y-0 left-0
          w-[3px]
          origin-bottom
          scale-y-0
          bg-[#cc785c]
          transition-transform
          duration-500
          ease-out
          group-hover:scale-y-100
          motion-reduce:transition-none
        "
      />

      {/* subtle internal field */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -right-24 -top-24
          h-64 w-64
          rounded-full
          border border-[#cc785c]/[0.045]
          opacity-0
          transition-opacity duration-500
          group-hover:opacity-100
          dark:border-[#cc785c]/[0.06]
          motion-reduce:transition-none
        "
      />

      <div
        className="
          relative grid
          lg:grid-cols-[180px_minmax(0,1fr)_230px]
        "
      >
        {/* ========================================================== */}
        {/* RECORD INDEX                                               */}
        {/* ========================================================== */}

        <div
          className="
            flex items-center justify-between
            border-b border-border
            px-5 py-4
            sm:px-6
            lg:flex-col
            lg:items-start
            lg:justify-between
            lg:border-b-0
            lg:border-r
            lg:py-7
            dark:border-white/[0.07]
          "
        >
          <div>
            <span
              className="
                block font-mono
                text-[7px] uppercase
                tracking-[0.2em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Field Record
            </span>

            <span
              className="
                mt-1.5 block
                font-mono text-[13px]
                tracking-[0.08em]
                text-[#cc785c]
              "
            >
              {recordNumber}
              <span className="text-[#b5afa7] dark:text-zinc-500">
                {" "}
                / {totalNumber}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

            <span
              className="
                font-mono text-[7px]
                uppercase tracking-[0.16em]
                text-[#5b8f68]
                dark:text-[#8fd0a0]
              "
            >
              Published
            </span>
          </div>
        </div>

        {/* ========================================================== */}
        {/* QUOTE                                                      */}
        {/* ========================================================== */}

        <div
          className="
            relative
            px-5 py-7
            sm:px-7 sm:py-8
            lg:px-10 lg:py-10
          "
        >
          {/* editorial quote marker */}
          <span
            aria-hidden="true"
            className="
              absolute left-5 top-5
              font-serif text-5xl
              leading-none
              text-[#cc785c]/15
              sm:left-7
              lg:left-10
            "
          >
            “
          </span>

          <blockquote
            className="
              relative z-10
              max-w-[690px]
              pt-5
              font-serif
              text-[1.45rem]
              font-normal
              leading-[1.32]
              tracking-[-0.025em]
              text-[#252523]
              sm:text-[1.7rem]
              lg:text-[1.9rem]
              dark:text-zinc-100
            "
          >
            {item.quote}
          </blockquote>
        </div>

        {/* ========================================================== */}
        {/* SOURCE                                                     */}
        {/* ========================================================== */}

        <footer
          className="
            flex flex-col justify-between
            gap-6
            border-t border-border
            bg-[#f1ece4]/60
            px-5 py-6
            sm:px-6
            lg:border-l
            lg:border-t-0
            lg:py-7
            dark:border-white/[0.07]
            dark:bg-[#1b1a18]
          "
        >
          <div>
            <span
              className="
                block font-mono
                text-[7px] uppercase
                tracking-[0.19em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Source
            </span>

            <span
              className="
                mt-2 block
                text-[12px] font-medium
                leading-5
                text-[#252523]
                dark:text-[#e8e4dd]
              "
            >
              {item.source}
            </span>
          </div>

          <div>
            <span
              className="
                block font-mono
                text-[7px] uppercase
                tracking-[0.19em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Context
            </span>

            <span
              className="
                mt-2 block
                font-mono text-[9px]
                leading-5
                text-muted-foreground
                dark:text-muted-foreground
              "
            >
              {item.context}
            </span>
          </div>

          <div
            aria-hidden="true"
            className="flex items-center gap-2 pt-1"
          >
            <span className="h-px flex-1 bg-[#d8d1c8] dark:bg-white/[0.07]" />

            <VaahanIcon
              name="check"
              size={11}
              className="text-[#5db872]"
            />
          </div>
        </footer>
      </div>
    </article>
  );
}