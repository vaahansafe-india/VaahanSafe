import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";
import { HOMEPAGE_DEMO_DATA } from "../../lib/demo/homepage-demo";

export function EmergencyScanPreview() {
  const { vehicle, emergency } = HOMEPAGE_DEMO_DATA;

  return (
    <section
      id="emergency-scan"
      aria-labelledby="emergency-scan-title"
      className="
        relative isolate overflow-hidden
        border-b border-border
        bg-background
        py-24 text-foreground
        sm:py-28
        lg:py-36
        dark:border-border
        dark:bg-zinc-950
        dark:text-zinc-50
      "
    >
      {/* ============================================================ */}
      {/* ATMOSPHERE                                                   */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Main scan field */}
        <div
          className="
            absolute left-1/2 top-[55%]
            h-[760px] w-[760px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#09090b]/[0.035]
            dark:border-white/[0.025]
            lg:h-[1080px] lg:w-[1080px]
          "
        />

        <div
          className="
            absolute left-1/2 top-[55%]
            h-[520px] w-[520px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#cc785c]/[0.06]
            dark:border-[#cc785c]/[0.04]
            lg:h-[760px] lg:w-[760px]
          "
        />

        {/* Coral identity light */}
        <div
          className="
            absolute left-[58%] top-[54%]
            h-[480px] w-[480px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            bg-[#cc785c]/[0.06]
            blur-[120px]
          "
        />

        {/* Teal support light */}
        <div
          className="
            absolute bottom-[-160px] left-[15%]
            h-[360px] w-[360px]
            rounded-full
            bg-[#5db8a6]/[0.035]
            blur-[100px]
          "
        />

        {/* sparse coordinate system */}
        <span className="absolute left-[7%] top-[34%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/50 lg:block" />

        <span className="absolute right-[8%] top-[44%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/40 lg:block" />

        <span className="absolute bottom-[18%] left-[12%] hidden h-1 w-1 rounded-full bg-[#e8a55a]/45 lg:block" />

        <span
          className="
            absolute left-[2.5%] top-1/2 hidden
            -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.26em]
            text-muted-foreground
            dark:text-[#5e5a54]
            xl:block
          "
        >
          Scan / Resolve / Connect
        </span>

        <span
          className="
            absolute right-[2.5%] top-1/2 hidden
            rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.26em]
            text-muted-foreground
            dark:text-[#5e5a54]
            xl:block
          "
        >
          Public Safety View / Demo
        </span>
      </div>

      <div
        className="
          relative mx-auto
          max-w-[1380px]
          px-5
          sm:px-8
          lg:px-10
        "
      >
        {/* ============================================================ */}
        {/* EDITORIAL INTRO                                              */}
        {/* ============================================================ */}

        <header className="mx-auto max-w-[900px] text-center">
          <Badge
            variant="outline"
            className="
              mb-6 rounded-full
              border-border
              bg-muted
              px-3.5 py-1.5
              font-mono text-[9px]
              font-medium uppercase
              tracking-[0.2em]
              text-muted-foreground
              dark:border-white/[0.09]
              dark:bg-white/[0.035]
              dark:text-zinc-400
            "
          >
            When Someone Scans
          </Badge>

          <h2
            id="emergency-scan-title"
            className="
              text-balance
              font-serif
              text-[2.65rem]
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
            The useful information
            <br className="hidden sm:block" />
            <span className="text-[#cc785c]">
              {" "}
              comes forward.
            </span>
          </h2>

          <p
            className="
              mx-auto mt-7
              max-w-2xl
              text-pretty
              text-base leading-7
              text-muted-foreground
              sm:text-lg sm:leading-8
              dark:text-zinc-400
            "
          >
            A scan opens a focused safety view containing the
            information the vehicle owner has chosen to make available.
          </p>
        </header>

        {/* ============================================================ */}
        {/* SCAN JOURNEY                                                 */}
        {/* ============================================================ */}

        <div className="mx-auto mt-14 max-w-[900px] sm:mt-16 lg:mt-20">
          <div
            className="
              relative grid
              grid-cols-4
              items-start
            "
          >
            {/* connecting rail */}
            <div
              aria-hidden="true"
              className="
                absolute left-[12.5%] right-[12.5%]
                top-[5px]
                h-px
                bg-gradient-to-r
                from-[#cc785c]/45
                via-[#09090b]/[0.1]
                to-[#5db872]/35
                dark:via-white/[0.12]
              "
            />

            <JourneyState
              number="01"
              label="Scan"
              active
            />

            <JourneyState
              number="02"
              label="Identify"
            />

            <JourneyState
              number="03"
              label="View"
            />

            <JourneyState
              number="04"
              label="Connect"
              success
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN EXPERIENCE                                              */}
        {/* ============================================================ */}

        <div
          className="
            mx-auto mt-16
            grid max-w-[1180px]
            items-center
            gap-14
            lg:mt-24
            lg:grid-cols-[0.8fr_1.2fr]
            lg:gap-16
          "
        >
          {/* ========================================================== */}
          {/* LEFT NARRATIVE                                             */}
          {/* ========================================================== */}

          <div className="order-2 lg:order-1">
            <span
              className="
                font-mono text-[9px]
                uppercase tracking-[0.2em]
                text-[#cc785c]
              "
            >
              04 / Finder experience
            </span>

            <h3
              className="
                mt-5 max-w-lg
                font-serif
                text-3xl
                font-normal
                leading-[1.05]
                tracking-[-0.035em]
                text-foreground
                sm:text-4xl
                lg:text-[3.2rem]
                dark:text-zinc-50
              "
            >
              No account.
              <br />
              No app.
              <br />
              <span className="text-muted-foreground dark:text-muted-foreground">
                Just the information that matters.
              </span>
            </h3>

            <p
              className="
                mt-7 max-w-md
                text-sm leading-7
                text-muted-foreground
                sm:text-[15px]
                dark:text-muted-foreground
              "
            >
              The finder experience stays separate from the owner
              dashboard. It is designed around quick identification,
              selected safety information and a clear way to reach an
              emergency contact.
            </p>

            {/* indexed principles */}
            <div className="mt-10 border-t border-border dark:border-white/[0.08]">
              <FinderPrinciple
                index="01"
                title="Scan to open"
                description="The QR leads directly to the vehicle's public safety view."
              />

              <FinderPrinciple
                index="02"
                title="Owner-controlled information"
                description="Only information intended for the public safety profile is presented."
              />

              <FinderPrinciple
                index="03"
                title="Clear next action"
                description="The interface keeps the emergency contact action prominent and easy to understand."
              />
            </div>

            {/* Privacy boundary */}
            <div
              className="
                mt-8 flex items-start gap-3
                border-l border-[#5db8a6]/35
                pl-4
              "
            >
              <VaahanIcon
                name="shield"
                size={15}
                className="mt-0.5 shrink-0 text-[#5db8a6]"
                aria-hidden="true"
              />

              <p className="max-w-md text-[11px] leading-5 text-muted-foreground dark:text-zinc-500">
                Account details such as private addresses and email
                addresses are not part of this demo public view.
              </p>
            </div>
          </div>

          {/* ========================================================== */}
          {/* RIGHT — FINDER OBJECT                                      */}
          {/* ========================================================== */}

          <div
            className="
              relative order-1
              flex justify-center
              lg:order-2
              lg:justify-end
            "
          >
            {/* surrounding identity field */}
            <div
              aria-hidden="true"
              className="
                absolute left-1/2 top-1/2
                h-[460px] w-[460px]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                border border-[#09090b]/[0.035]
                dark:border-white/[0.025]
                sm:h-[600px] sm:w-[600px]
              "
            />

            <div
              aria-hidden="true"
              className="
                absolute left-1/2 top-1/2
                h-[350px] w-[350px]
                -translate-x-1/2 -translate-y-1/2
                rounded-full
                border border-[#cc785c]/[0.06]
                dark:border-[#cc785c]/[0.045]
                sm:h-[470px] sm:w-[470px]
              "
            />

            {/* annotation — desktop only */}
            <div
              aria-hidden="true"
              className="
                absolute -left-8 top-[28%]
                hidden items-center
                xl:flex
              "
            >
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
                Identity found
              </span>

              <span className="ml-3 h-px w-14 bg-[#cc785c]/35" />

              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
            </div>

            <div
              aria-hidden="true"
              className="
                absolute -right-10 bottom-[25%]
                hidden items-center
                xl:flex
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

              <span className="mr-3 h-px w-14 bg-[#5db872]/30" />

              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
                Contact ready
              </span>
            </div>

            <FinderPhone
              vehicle={vehicle}
              emergency={emergency}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* PRIVACY PROJECTION STRIP                                     */}
        {/* ============================================================ */}

        <div
          className="
            mx-auto mt-20
            max-w-[1080px]
            border-y border-border
            py-8
            sm:mt-28
            sm:py-10
            dark:border-white/[0.07]
          "
        >
          <div
            className="
              grid gap-8
              md:grid-cols-[1fr_auto_1fr_auto_1fr]
              md:items-center
              md:gap-6
            "
          >
            <ProjectionState
              label="Private Account"
              title="Your details"
              icon="lock"
              muted
            />

            <ProjectionConnector />

            <ProjectionState
              label="Your Controls"
              title="Choose what appears"
              icon="shield"
              accent
            />

            <ProjectionConnector />

            <ProjectionState
              label="Safety View"
              title="Selected info only"
              icon="check"
              success
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* CLOSING                                                      */}
        {/* ============================================================ */}

        <div className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
          <span
            className="
              mx-auto mb-6 block
              h-1.5 w-1.5
              rounded-full
              bg-[#cc785c]
            "
          />

          <p
            className="
              text-balance
              font-serif
              text-2xl
              leading-[1.25]
              tracking-[-0.025em]
              text-foreground
              sm:text-3xl
              dark:text-zinc-50
            "
          >
            The QR opens the door.
            <span className="text-[#cc785c]">
              {" "}
              You decide what is on the other side.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* FINDER PHONE                                                       */
/* ================================================================== */

function FinderPhone({
  vehicle,
  emergency,
}: {
  vehicle: any;
  emergency: any;
}) {
  return (
    <div
      aria-label="Synthetic VaahanSafe roadside safety profile preview"
      className="
        relative w-full
        max-w-[370px]
        rounded-[38px]
        border border-white/[0.11]
        bg-[#0f0f0e]
        p-[7px]
        shadow-[0_45px_120px_rgba(0,0,0,0.45)]
        sm:max-w-[390px]
        sm:rounded-[44px]
        sm:p-[8px]
      "
    >
      {/* device highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-10 top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {/* screen */}
      <div
        className="
          relative overflow-hidden
          rounded-[32px]
          bg-[#09090b]
          sm:rounded-[36px]
        "
      >
        {/* subtle internal glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute -right-20 -top-20
            h-52 w-52
            rounded-full
            bg-[#cc785c]/[0.07]
            blur-[70px]
          "
        />

        {/* status region */}
        <div
          className="
            relative flex h-9
            items-center justify-between
            px-5
            font-mono text-[8px]
            text-[#71717a]
          "
        >
          <span>09:41</span>

          <div className="absolute left-1/2 top-2 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-[#0b0b0a]" />

          <span>● ●</span>
        </div>

        <div className="relative px-4 pb-5 pt-2 sm:px-5 sm:pb-6">
          {/* ========================================================== */}
          {/* BRAND HEADER                                               */}
          {/* ========================================================== */}

          <div
            className="
              flex items-center justify-between
              border-b border-white/[0.07]
              pb-4
            "
          >
            <div className="flex items-center gap-2.5">
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
                <span
                  className="
                    block text-[10px]
                    font-medium
                    tracking-[0.04em]
                    text-[#fafafa]
                  "
                >
                  VaahanSafe
                </span>

                <span
                  className="
                    mt-0.5 block
                    font-mono text-[7px]
                    uppercase tracking-[0.17em]
                    text-[#71717a]
                  "
                >
                  Vehicle safety view
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

              <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-[#8fd0a0]">
                Active
              </span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* IDENTITY FOUND                                             */}
          {/* ========================================================== */}

          <div className="pt-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.19em]
                  text-[#cc785c]
                "
              >
                Vehicle identified
              </span>
            </div>

            <h3
              className="
                mt-3
                font-serif
                text-[1.65rem]
                leading-[1.05]
                tracking-[-0.025em]
                text-[#fafafa]
              "
            >
              {vehicle.vehicleDisplay}
            </h3>

            <div
              className="
                mt-3 flex
                flex-wrap items-center
                gap-x-3 gap-y-2
                text-[9px]
                text-muted-foreground
              "
            >
              <span>{vehicle.vehicleType}</span>

              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full bg-[#4f4c47]"
              />

              <span>{vehicle.color}</span>

              <span
                aria-hidden="true"
                className="h-1 w-1 rounded-full bg-[#4f4c47]"
              />

              <span className="font-mono text-[#c7c2ba]">
                {vehicle.plateMasked}
              </span>
            </div>
          </div>

          {/* ========================================================== */}
          {/* IDENTITY CODE                                              */}
          {/* ========================================================== */}

          <div
            className="
              mt-5 flex
              items-center justify-between
              rounded-[12px]
              border border-white/[0.07]
              bg-[#20201d]
              px-4 py-3
            "
          >
            <div>
              <span
                className="
                  block font-mono
                  text-[7px] uppercase
                  tracking-[0.18em]
                  text-[#71717a]
                "
              >
                VaahanSafe ID
              </span>

              <span
                className="
                  mt-1 block
                  font-mono text-[11px]
                  tracking-[0.08em]
                  text-[#cc785c]
                "
              >
                {vehicle.visibleCode}
              </span>
            </div>

            <div
              className="
                flex h-8 w-8
                items-center justify-center
                rounded-full
                border border-[#5db872]/15
                bg-[#5db872]/[0.06]
                text-[#5db872]
              "
            >
              <VaahanIcon
                name="check"
                size={13}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* ========================================================== */}
          {/* PRIMARY ACTION                                             */}
          {/* ========================================================== */}

          <button
            type="button"
            className="
              group mt-4 flex
              min-h-[52px] w-full
              items-center justify-between
              rounded-[12px]
              bg-[#cc785c]
              px-4
              text-left
              text-white
              outline-none
              transition-colors
              hover:bg-[#a9583e]
              focus-visible:ring-2
              focus-visible:ring-[#fafafa]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[#09090b]
            "
          >
            <div className="flex items-center gap-3">
              <span
                className="
                  flex h-8 w-8
                  items-center justify-center
                  rounded-[8px]
                  bg-white/[0.12]
                "
              >
                <VaahanIcon
                  name="phone"
                  size={15}
                  aria-hidden="true"
                />
              </span>

              <div>
                <span className="block text-[11px] font-medium">
                  Contact emergency person
                </span>

                <span className="mt-0.5 block text-[8px] text-white/65">
                  {emergency.primaryContactRole}
                </span>
              </div>
            </div>

            <VaahanIcon
              name="arrow-right"
              size={14}
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </button>

          {/* ========================================================== */}
          {/* SELECTED SAFETY INFO                                       */}
          {/* ========================================================== */}

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.18em]
                  text-[#71717a]
                "
              >
                Selected safety information
              </span>

              <span
                className="
                  font-mono text-[7px]
                  uppercase tracking-[0.14em]
                  text-[#e8a55a]
                "
              >
                Owner selected
              </span>
            </div>

            <div
              className="
                overflow-hidden
                rounded-[12px]
                border border-white/[0.07]
                bg-[#18181b]
              "
            >
              <SafetyRow
                icon="activity"
                label="Blood group"
                value={emergency.bloodGroup}
                accent
              />

              <div className="h-px bg-white/[0.06]" />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="
                      flex h-8 w-8
                      shrink-0 items-center justify-center
                      rounded-[8px]
                      bg-[#e8a55a]/[0.08]
                      text-[#e8a55a]
                    "
                  >
                    <VaahanIcon
                      name="shield"
                      size={13}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <span className="block text-[9px] text-[#71717a]">
                      Safety note
                    </span>

                    <p className="mt-1.5 text-[10px] leading-5 text-[#c0bbb3]">
                      {emergency.safetyNotes}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* PRIVACY NOTICE                                             */}
          {/* ========================================================== */}

          <div
            className="
              mt-5 flex items-start
              gap-2.5
              border-t border-white/[0.07]
              pt-4
            "
          >
            <VaahanIcon
              name="lock"
              size={12}
              className="mt-0.5 shrink-0 text-[#5db8a6]"
              aria-hidden="true"
            />

            <p className="text-[8px] leading-4 text-[#71717a]">
              This demo view contains synthetic information and represents
              only the safety details selected for public display.
            </p>
          </div>

          {/* home indicator */}
          <div
            aria-hidden="true"
            className="
              mx-auto mt-5
              h-1 w-24
              rounded-full
              bg-white/15
            "
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* JOURNEY                                                            */
/* ================================================================== */

function JourneyState({
  number,
  label,
  active = false,
  success = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  success?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center text-center">
      <span
        className={`
          relative z-10
          h-[11px] w-[11px]
          rounded-full
          border-2 border-[#fafafa] dark:border-[#09090b]
          ${
            active
              ? "bg-[#cc785c]"
              : success
                ? "bg-[#5db872]"
                : "bg-[#e4e4e7] dark:bg-[#514e49]"
          }
        `}
      />

      <span
        className={`
          mt-3 font-mono
          text-[7px]
          uppercase
          tracking-[0.15em]
          sm:text-[8px]
          ${
            active
              ? "text-[#cc785c]"
              : success
                ? "text-[#5db872] dark:text-[#8fd0a0]"
                : "text-muted-foreground dark:text-zinc-500"
          }
        `}
      >
        {number}
      </span>

      <span
        className="
          mt-1
          text-[9px]
          text-muted-foreground
          sm:text-[10px]
          dark:text-zinc-400
        "
      >
        {label}
      </span>
    </div>
  );
}

/* ================================================================== */
/* PRINCIPLE                                                          */
/* ================================================================== */

function FinderPrinciple({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        grid grid-cols-[36px_1fr]
        gap-3
        border-b border-border
        py-5
        last:border-b-0
        dark:border-white/[0.07]
      "
    >
      <span
        className="
          pt-0.5
          font-mono text-[8px]
          tracking-[0.15em]
          text-[#cc785c]
        "
      >
        {index}
      </span>

      <div>
        <h4 className="text-[12px] font-medium text-foreground dark:text-[#e8e4dd]">
          {title}
        </h4>

        <p className="mt-1.5 max-w-md text-[10px] leading-5 text-muted-foreground dark:text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SAFETY ROW                                                         */
/* ================================================================== */

function SafetyRow({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-3">
        <div
          className="
            flex h-8 w-8
            items-center justify-center
            rounded-[8px]
            bg-[#e8a55a]/[0.08]
            text-[#e8a55a]
          "
        >
          <VaahanIcon
            name={icon as any}
            size={13}
            aria-hidden="true"
          />
        </div>

        <span className="text-[9px] text-[#71717a]">
          {label}
        </span>
      </div>

      <span
        className={`
          font-mono text-[10px]
          ${
            accent
              ? "text-[#e8a55a]"
              : "text-[#e8e4dd]"
          }
        `}
      >
        {value}
      </span>
    </div>
  );
}

/* ================================================================== */
/* PRIVACY PROJECTION                                                 */
/* ================================================================== */

function ProjectionState({
  label,
  title,
  icon,
  muted = false,
  accent = false,
  success = false,
}: {
  label: string;
  title: string;
  icon: string;
  muted?: boolean;
  accent?: boolean;
  success?: boolean;
}) {
  const iconColor = success
    ? "text-[#5db872]"
    : accent
      ? "text-[#cc785c]"
      : muted
        ? "text-muted-foreground dark:text-zinc-500"
        : "text-muted-foreground dark:text-zinc-400";

  return (
    <div className="flex items-center gap-4 md:justify-center">
      <div
        className="
          flex h-10 w-10
          shrink-0 items-center justify-center
          rounded-[10px]
          border border-border
          bg-muted
          dark:border-white/[0.07]
          dark:bg-white/[0.025]
        "
      >
        <VaahanIcon
          name={icon as any}
          size={15}
          className={iconColor}
          aria-hidden="true"
        />
      </div>

      <div>
        <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-500">
          {label}
        </span>

        <span className="mt-1 block text-[10px] font-medium text-foreground dark:text-[#c8c3bb]">
          {title}
        </span>
      </div>
    </div>
  );
}

function ProjectionConnector() {
  return (
    <>
      {/* desktop */}
      <div
        aria-hidden="true"
        className="hidden items-center md:flex"
      >
        <span className="h-px w-8 bg-gradient-to-r from-[#09090b]/[0.08] to-[#cc785c]/25 dark:from-white/[0.08] lg:w-14" />

        <VaahanIcon
          name="arrow-right"
          size={11}
          className="ml-1 text-muted-foreground dark:text-zinc-500"
        />
      </div>

      {/* mobile */}
      <div
        aria-hidden="true"
        className="ml-5 h-7 w-px bg-gradient-to-b from-[#09090b]/[0.08] to-[#cc785c]/25 md:hidden dark:from-white/[0.08]"
      />
    </>
  );
}