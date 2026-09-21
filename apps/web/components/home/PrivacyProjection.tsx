import { VaahanIcon } from "@vaahansafe/icons";
import { Badge } from "@vaahansafe/ui/components";

/* ================================================================== */
/* PRIVACY PROJECTION                                                 */
/* ================================================================== */

export function PrivacyProjection() {
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-title"
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
      {/* AMBIENT IDENTITY FIELD                                       */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          className="
            absolute -left-[300px] top-[14%]
            h-[680px] w-[680px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -right-[280px] bottom-[3%]
            h-[620px] w-[620px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute left-1/2 top-[58%]
            hidden h-[520px] w-[520px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#cc785c]/[0.035]
            lg:block
          "
        />

        <span className="absolute left-[8%] top-[34%] hidden h-1.5 w-1.5 rounded-full bg-[#a1a1aa]/30 lg:block" />

        <span className="absolute right-[8%] top-[40%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/40 lg:block" />

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
          Private / Control / Public
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
              Privacy by Choice
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
                Privacy Projection / 09
              </span>
            </div>
          </div>

          <div>
            <h2
              id="privacy-title"
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
              Your account is private.
              <br className="hidden sm:block" />

              <span className="text-[#cc785c]">
                {" "}
                Your safety view is selective.
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
              A VaahanSafe scan does not need to become a window into
              your account. You choose which supported safety details
              are made available through the vehicle&apos;s public view.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* PRIVACY PROJECTION SYSTEM                                    */}
        {/* ============================================================ */}

        <div
          className="
            relative mt-16
            lg:mt-24
          "
        >
          {/* architecture label */}

          <div
            className="
              mb-5 flex
              items-center justify-between
              border-b border-border
              pb-4
              dark:border-white/[0.07]
            "
          >
            <span
              className="
                font-mono text-[8px]
                uppercase tracking-[0.2em]
                text-muted-foreground
                dark:text-zinc-500
              "
            >
              Information Boundary
            </span>

            <span
              className="
                font-mono text-[8px]
                uppercase tracking-[0.17em]
                text-[#cc785c]
              "
            >
              You decide what crosses
            </span>
          </div>

          {/* ========================================================== */}
          {/* DESKTOP: HORIZONTAL PROJECTION                             */}
          {/* MOBILE: VERTICAL STORY                                     */}
          {/* ========================================================== */}

          <div
            className="
              grid overflow-hidden
              rounded-[24px]
              border border-border
              bg-muted
              sm:rounded-[28px]
              lg:grid-cols-[1fr_150px_1fr]
              dark:border-white/[0.07]
              dark:bg-zinc-900
            "
          >
            {/* ======================================================== */}
            {/* PRIVATE ACCOUNT                                          */}
            {/* ======================================================== */}

            <article
              className="
                relative overflow-hidden
                p-6
                sm:p-8
                lg:p-10
              "
            >
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

                <span className="absolute left-[9%] top-[24%] h-1 w-1 rounded-full bg-[#a1a1aa]/40" />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className="
                        font-mono text-[8px]
                        uppercase tracking-[0.18em]
                        text-muted-foreground
                        dark:text-zinc-500
                      "
                    >
                      01 / Private
                    </span>

                    <h3
                      className="
                        mt-4
                        font-serif text-3xl
                        font-normal
                        tracking-[-0.03em]
                        text-[#252523]
                        sm:text-4xl
                        dark:text-zinc-100
                      "
                    >
                      Your account
                    </h3>
                  </div>

                  <div
                    className="
                      flex h-10 w-10
                      items-center justify-center
                      rounded-[10px]
                      border border-border
                      bg-background
                      text-muted-foreground
                      dark:border-white/[0.07]
                      dark:bg-zinc-950
                      dark:text-muted-foreground
                    "
                  >
                    <VaahanIcon
                      name="lock"
                      size={15}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <p
                  className="
                    mt-4 max-w-md
                    text-[11px]
                    leading-6
                    text-muted-foreground
                    sm:text-[12px]
                    dark:text-muted-foreground
                  "
                >
                  Information used to manage your VaahanSafe account
                  remains separate from the public safety view.
                </p>

                <div className="mt-8 space-y-2">
                  <PrivateField
                    label="Residential address"
                    status="Private"
                  />

                  <PrivateField
                    label="Account email"
                    status="Private"
                  />

                  <PrivateField
                    label="Verified mobile"
                    status="Private"
                  />

                  <PrivateField
                    label="Account information"
                    status="Private"
                  />
                </div>

                <div
                  className="
                    mt-7 flex items-start gap-3
                    border-t border-border
                    pt-5
                    dark:border-white/[0.07]
                  "
                >
                  <VaahanIcon
                    name="shield"
                    size={13}
                    className="
                      mt-0.5 shrink-0
                      text-muted-foreground
                    "
                    aria-hidden="true"
                  />

                  <p
                    className="
                      text-[9px]
                      leading-5
                      text-muted-foreground
                      dark:text-zinc-500
                    "
                  >
                    Private account information is not presented as part
                    of this demo public safety view.
                  </p>
                </div>
              </div>
            </article>

            {/* ======================================================== */}
            {/* CONTROL BOUNDARY                                         */}
            {/* ======================================================== */}

            <div
              className="
                relative flex
                min-h-[250px]
                flex-col items-center justify-center
                overflow-hidden
                border-y border-border
                bg-background
                px-6 py-9
                lg:min-h-0
                lg:border-x
                lg:border-y-0
                dark:border-white/[0.07]
                dark:bg-zinc-950
              "
            >
              {/* projection spine */}

              <span
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

              <span
                aria-hidden="true"
                className="
                  absolute left-0 top-1/2
                  h-px w-full
                  -translate-y-1/2
                  bg-[#e4e4e7]
                  lg:hidden
                  dark:bg-white/[0.07]
                "
              />

              {/* owner control object */}

              <div
                className="
                  relative z-10
                  flex h-[92px] w-[92px]
                  items-center justify-center
                  rounded-full
                  border border-[#cc785c]/20
                  bg-background
                  shadow-[0_12px_40px_rgba(20,20,19,0.06)]
                  dark:bg-zinc-950
                "
              >
                <div
                  className="
                    flex h-[68px] w-[68px]
                    items-center justify-center
                    rounded-full
                    border border-[#cc785c]/10
                    bg-[#cc785c]/[0.05]
                    text-[#cc785c]
                  "
                >
                  <VaahanIcon
                    name="shield"
                    size={22}
                    aria-hidden="true"
                  />
                </div>

                <span
                  aria-hidden="true"
                  className="
                    absolute -right-1 top-1/2
                    h-2.5 w-2.5
                    -translate-y-1/2
                    rounded-full
                    border-[3px] border-[#fafafa]
                    bg-[#cc785c]
                    dark:border-[#09090b]
                  "
                />
              </div>

              <span
                className="
                  relative z-10
                  mt-5
                  font-mono text-[8px]
                  uppercase tracking-[0.18em]
                  text-[#cc785c]
                "
              >
                Your controls
              </span>

              <span
                className="
                  relative z-10
                  mt-2
                  max-w-[110px]
                  text-center text-[9px]
                  leading-4
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                Choose what can appear
              </span>

              {/* directional marker */}

              <div
                aria-hidden="true"
                className="
                  relative z-10 mt-5
                  flex h-8 w-8
                  items-center justify-center
                  rounded-full
                  border border-border
                  bg-background
                  text-[#cc785c]
                  dark:border-white/[0.08]
                  dark:bg-zinc-900
                "
              >
                <VaahanIcon
                  name="arrow-right"
                  size={12}
                  className="rotate-90 lg:rotate-0"
                />
              </div>
            </div>

            {/* ======================================================== */}
            {/* PUBLIC SAFETY VIEW                                       */}
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
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div
                  className="
                    absolute -right-24 -top-24
                    h-72 w-72
                    rounded-full
                    border border-white/[0.04]
                  "
                />

                <div
                  className="
                    absolute -right-12 -top-12
                    h-44 w-44
                    rounded-full
                    border border-[#5db8a6]/[0.07]
                  "
                />

                <span className="absolute right-[12%] top-[25%] h-1 w-1 rounded-full bg-[#5db8a6]/55" />
              </div>

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className="
                        font-mono text-[8px]
                        uppercase tracking-[0.18em]
                        text-[#5db8a6]
                      "
                    >
                      03 / Public
                    </span>

                    <h3
                      className="
                        mt-4
                        font-serif text-3xl
                        font-normal
                        tracking-[-0.03em]
                        text-[#fafafa]
                        sm:text-4xl
                      "
                    >
                      Safety view
                    </h3>
                  </div>

                  <div
                    className="
                      flex items-center gap-2
                      rounded-full
                      border border-[#5db872]/15
                      bg-[#5db872]/[0.06]
                      px-2.5 py-1.5
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

                    <span
                      className="
                        font-mono text-[7px]
                        uppercase tracking-[0.15em]
                        text-[#5db872]
                      "
                    >
                      Demo
                    </span>
                  </div>
                </div>

                <p
                  className="
                    mt-4 max-w-md
                    text-[11px]
                    leading-6
                    text-[#a1a1aa]
                    sm:text-[12px]
                  "
                >
                  A focused view containing only the supported
                  information selected for public safety use.
                </p>

                {/* public projection */}

                <div
                  className="
                    mt-8 overflow-hidden
                    rounded-[14px]
                    border border-white/[0.07]
                    bg-[#18181b]
                  "
                >
                  <div
                    className="
                      flex items-center justify-between
                      border-b border-white/[0.06]
                      px-4 py-3
                    "
                  >
                    <div className="flex items-center gap-2">
                      <VaahanIcon
                        name="car"
                        size={12}
                        className="text-[#cc785c]"
                        aria-hidden="true"
                      />

                      <span
                        className="
                          font-mono text-[7px]
                          uppercase tracking-[0.17em]
                          text-[#71717a]
                        "
                      >
                        Demo Vehicle
                      </span>
                    </div>

                    <span
                      className="
                        font-mono text-[7px]
                        tracking-[0.1em]
                        text-[#cc785c]
                      "
                    >
                      VS-7F3K-9021
                    </span>
                  </div>

                  <PublicField
                    icon="car"
                    label="Vehicle context"
                    value="Selected"
                  />

                  <PublicField
                    icon="phone"
                    label="Emergency contact"
                    value="Selected"
                  />

                  <PublicField
                    icon="shield"
                    label="Blood group"
                    value="Optional"
                  />

                  <PublicField
                    icon="activity"
                    label="Safety notes"
                    value="Optional"
                    last
                  />
                </div>

                <div
                  className="
                    mt-6
                    flex items-start gap-3
                    border-t border-white/[0.07]
                    pt-5
                  "
                >
                  <div
                    className="
                      flex h-7 w-7
                      shrink-0 items-center justify-center
                      rounded-[7px]
                      border border-[#5db8a6]/10
                      bg-[#5db8a6]/[0.05]
                      text-[#5db8a6]
                    "
                  >
                    <VaahanIcon
                      name="check"
                      size={11}
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <span
                      className="
                        block text-[9px]
                        font-medium
                        text-[#e4e4e7]
                      "
                    >
                      Selected information only
                    </span>

                    <span
                      className="
                        mt-1 block
                        text-[8px]
                        leading-4
                        text-[#71717a]
                      "
                    >
                      This illustration contains synthetic information,
                      not a customer record.
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FIELD SELECTION                                              */}
        {/* ============================================================ */}

        <div className="mt-12 lg:mt-16">
          <div
            className="
              grid gap-3
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <PrivacyRule
              number="01"
              icon="home"
              title="Address"
              state="Private"
              description="Not part of the public safety view."
            />

            <PrivacyRule
              number="02"
              icon="mail"
              title="Account email"
              state="Private"
              description="Used for the account, not the public profile."
            />

            <PrivacyRule
              number="03"
              icon="phone"
              title="Emergency contact"
              state="Controlled"
              description="Presented according to supported owner settings."
              accent
            />

            <PrivacyRule
              number="04"
              icon="shield"
              title="Safety information"
              state="Optional"
              description="Displayed only when the owner chooses to share it."
              accent
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
            lg:mt-20
            dark:border-white/[0.07]
          "
        >
          <p
            className="
              max-w-[760px]
              font-serif text-2xl
              font-normal leading-[1.18]
              tracking-[-0.025em]
              text-[#252523]
              sm:text-3xl
              lg:text-[2rem]
              dark:text-zinc-100
            "
          >
            The scan reveals a safety view,
            <span className="text-[#cc785c]">
              {" "}
              not your VaahanSafe account.
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
              Private → Control → Public
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* PRIVATE FIELD                                                      */
/* ================================================================== */

function PrivateField({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  return (
    <div
      className="
        flex min-h-[48px]
        items-center justify-between
        gap-4
        rounded-[10px]
        border border-border
        bg-background/70
        px-3.5 py-2.5
        dark:border-white/[0.07]
        dark:bg-zinc-950/50
      "
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <VaahanIcon
          name="lock"
          size={11}
          className="
            shrink-0
            text-muted-foreground
          "
          aria-hidden="true"
        />

        <span
          className="
            truncate
            text-[10px]
            font-medium
            text-[#3f3f46]
            dark:text-[#c9c5be]
          "
        >
          {label}
        </span>
      </div>

      <span
        className="
          shrink-0
          font-mono text-[7px]
          uppercase tracking-[0.14em]
          text-muted-foreground
          dark:text-zinc-500
        "
      >
        {status}
      </span>
    </div>
  );
}

/* ================================================================== */
/* PUBLIC FIELD                                                       */
/* ================================================================== */

function PublicField({
  icon,
  label,
  value,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`
        flex min-h-[52px]
        items-center justify-between
        gap-4
        px-4 py-3
        ${last ? "" : "border-b border-white/[0.055]"}
      `}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="
            flex h-7 w-7
            shrink-0 items-center justify-center
            rounded-[7px]
            border border-white/[0.06]
            bg-[#18181b]
            text-muted-foreground
          "
        >
          <VaahanIcon
            name={icon as any}
            size={11}
            aria-hidden="true"
          />
        </div>

        <span
          className="
            truncate text-[9px]
            text-[#a1a1aa]
          "
        >
          {label}
        </span>
      </div>

      <span
        className="
          shrink-0
          font-mono text-[7px]
          uppercase tracking-[0.13em]
          text-[#5db8a6]
        "
      >
        {value}
      </span>
    </div>
  );
}

/* ================================================================== */
/* PRIVACY RULE                                                       */
/* ================================================================== */

function PrivacyRule({
  number,
  icon,
  title,
  state,
  description,
  accent = false,
}: {
  number: string;
  icon: string;
  title: string;
  state: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <article
      className="
        group
        border-t border-border
        py-5
        dark:border-white/[0.07]
      "
    >
      <div className="flex items-start justify-between gap-5">
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
            items-center justify-center
            rounded-[8px]
            border
            ${
              accent
                ? "border-[#cc785c]/15 bg-[#cc785c]/[0.05] text-[#cc785c]"
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
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3
            className="
              text-[11px]
              font-medium
              text-[#252523]
              dark:text-zinc-200
            "
          >
            {title}
          </h3>

          <span
            className={`
              font-mono text-[7px]
              uppercase tracking-[0.14em]
              ${
                accent
                  ? "text-[#cc785c]"
                  : "text-muted-foreground dark:text-zinc-500"
              }
            `}
          >
            {state}
          </span>
        </div>

        <p
          className="
            mt-2
            text-[9px]
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