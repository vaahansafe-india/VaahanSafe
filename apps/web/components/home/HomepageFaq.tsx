import Link from "next/link";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@vaahansafe/ui/components";

const FAQS = [
  {
    id: "faq-what-is",
    index: "01",
    category: "Product",
    q: "What is VaahanSafe?",
    a: "VaahanSafe gives your vehicle a QR-based safety identity. When the QR is scanned, it can open a focused safety view containing the information you have chosen to make available.",
  },
  {
    id: "faq-how-to-scan",
    index: "02",
    category: "Scanning",
    q: "How does someone scan a VaahanSafe QR?",
    a: "A person can scan the QR using a compatible smartphone camera or QR scanner. The QR opens the vehicle's VaahanSafe safety view in the browser, so a separate VaahanSafe app is not required for the finder.",
  },
  {
    id: "faq-finder-app",
    index: "03",
    category: "Scanning",
    q: "Does the finder need a VaahanSafe account?",
    a: "No. The public safety view is designed for people who may not have a VaahanSafe account. They can scan the vehicle QR and view the information made available for that vehicle.",
  },
  {
    id: "faq-visible-info",
    index: "04",
    category: "Privacy",
    q: "What can someone see after scanning?",
    a: "The safety view can contain selected vehicle context, an emergency contact action, and optional safety information that the owner has chosen to make public. Private account information stays separate from this public view.",
  },
  {
    id: "faq-address-privacy",
    index: "05",
    category: "Privacy",
    q: "Is my home address shown publicly?",
    a: "No. Residential address and account email are not intended to be part of the public safety profile. VaahanSafe separates private account information from the information selected for public safety use.",
  },
  {
    id: "faq-retail-activation",
    index: "06",
    category: "Activation",
    q: "I bought a retail QR. How do I activate it?",
    a: "Start from the VaahanSafe activation experience, follow the instructions supplied with your sticker, verify the activation information, and link the QR identity to your vehicle.",
  },
  {
    id: "faq-scratch-area",
    index: "07",
    category: "Activation",
    q: "What is the scratch area for?",
    a: "For retail kits that use scratch activation, the concealed code helps ensure that the person holding the purchased activation material can complete the sticker activation process.",
  },
  {
    id: "faq-lost-damaged",
    index: "08",
    category: "QR",
    q: "What if my QR sticker is lost or damaged?",
    a: "Use your VaahanSafe account to access the available replacement or support options. A replacement QR should be associated safely with the vehicle while the previous sticker is prevented from acting as the current identity.",
  },
  {
    id: "faq-multiple-vehicles",
    index: "09",
    category: "Account",
    q: "Can I manage more than one vehicle?",
    a: "VaahanSafe is designed around individual vehicle identities. Where multi-vehicle management is available, each vehicle has its own QR identity and its own safety-profile settings.",
  },
  {
    id: "faq-qr-vs-sub",
    index: "10",
    category: "Plans",
    q: "Is the QR the same as a VaahanSafe plan?",
    a: "No. The QR represents the vehicle's physical VaahanSafe identity, while a plan represents the services or features available to the account. Keeping these concepts separate makes the vehicle identity easier to understand and manage.",
  },
  {
    id: "faq-sub-expiry",
    index: "11",
    category: "Plans",
    q: "What happens when a plan ends?",
    a: "The exact behavior depends on the plan terms available at that time. Your account should clearly show the plan status, affected services, and available renewal options before you make a decision.",
  },
  {
    id: "faq-placement",
    index: "12",
    category: "Sticker",
    q: "Where should I place the QR sticker?",
    a: "Place the sticker where it is easy to notice and scan without interfering with safe vehicle operation or visibility. Follow the placement instructions supplied with your VaahanSafe sticker for your vehicle type.",
  },
  {
    id: "faq-get-help",
    index: "13",
    category: "Support",
    q: "Where can I get help?",
    a: "Visit the VaahanSafe Help Center for common questions and setup guidance, or explore the documentation for more detailed product information.",
  },
] as const;

export function HomepageFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
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
            absolute -left-[280px] top-[12%]
            h-[660px] w-[660px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <div
          className="
            absolute -left-[150px] top-[20%]
            h-[410px] w-[410px]
            rounded-full
            border border-[#cc785c]/[0.045]
          "
        />

        <div
          className="
            absolute -right-[180px] bottom-[6%]
            h-[520px] w-[520px]
            rounded-full
            border border-[#09090b]/[0.025]
            dark:border-white/[0.02]
          "
        />

        <span className="absolute left-[8%] top-[22%] hidden h-1.5 w-1.5 rounded-full bg-[#cc785c]/40 lg:block" />

        <span className="absolute right-[9%] top-[38%] hidden h-1.5 w-1.5 rounded-full bg-[#5db8a6]/35 lg:block" />

        <span className="absolute bottom-[18%] left-[14%] hidden h-1 w-1 rounded-full bg-[#e8a55a]/45 lg:block" />

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
          Questions / Product / Clarity
        </span>
      </div>

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8 lg:px-10">
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
                backdrop-blur-sm
                dark:border-zinc-700
                dark:bg-zinc-900/80
                dark:text-zinc-400
              "
            >
              Questions, answered
            </Badge>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-px w-9 bg-[#cc785c]/45" />

              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.2em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                Product Guide / 14
              </span>
            </div>
          </div>

          <div>
            <h2
              id="faq-title"
              className="
                max-w-[780px]
                text-balance
                font-serif
                text-[2.7rem]
                font-normal
                leading-[0.98]
                tracking-[-0.045em]
                text-foreground
                sm:text-5xl
                md:text-6xl
                lg:text-[4.35rem]
                dark:text-zinc-50
              "
            >
              Before you put it
              <br className="hidden sm:block" />
              <span className="text-[#cc785c]">
                {" "}
                on your vehicle.
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
              Straightforward answers about the QR, scanning, privacy,
              activation and the vehicle identity behind it.
            </p>
          </div>
        </header>

        {/* ============================================================ */}
        {/* FAQ SYSTEM                                                   */}
        {/* ============================================================ */}

        <div
          className="
            mt-16 grid gap-10
            lg:mt-24
            lg:grid-cols-[270px_minmax(0,1fr)]
            lg:gap-16
            xl:grid-cols-[300px_minmax(0,1fr)]
            xl:gap-20
          "
        >
          {/* ========================================================== */}
          {/* LEFT INDEX                                                 */}
          {/* ========================================================== */}

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <span
                className="
                  font-mono text-[8px]
                  uppercase tracking-[0.21em]
                  text-muted-foreground
                  dark:text-zinc-500
                "
              >
                Question Index
              </span>

              <div
                className="
                  mt-5
                  border-y border-border
                  py-5
                  dark:border-white/[0.07]
                "
              >
                <FaqIndexRow
                  index="01–03"
                  label="Understanding VaahanSafe"
                />

                <FaqIndexRow
                  index="04–05"
                  label="Privacy"
                />

                <FaqIndexRow
                  index="06–07"
                  label="Activation"
                />

                <FaqIndexRow
                  index="08–09"
                  label="Vehicle & QR"
                />

                <FaqIndexRow
                  index="10–11"
                  label="Plans"
                />

                <FaqIndexRow
                  index="12–13"
                  label="Placement & Help"
                />
              </div>

              {/* Help route */}
              <div
                className="
                  mt-7
                  rounded-[14px]
                  border border-border
                  bg-muted
                  p-5
                  dark:border-white/[0.07]
                  dark:bg-zinc-900
                "
              >
                <div
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-[9px]
                    border border-[#cc785c]/15
                    bg-[#cc785c]/[0.07]
                    text-[#cc785c]
                  "
                >
                  <VaahanIcon
                    name="help"
                    size={15}
                    aria-hidden="true"
                  />
                </div>

                <h3
                  className="
                    mt-5
                    font-serif text-xl
                    font-normal
                    tracking-[-0.02em]
                    text-[#252523]
                    dark:text-zinc-100
                  "
                >
                  Need something else?
                </h3>

                <p
                  className="
                    mt-2 text-[10px]
                    leading-5
                    text-muted-foreground
                    dark:text-zinc-500
                  "
                >
                  More detailed setup and product guidance is available
                  in the Help Center.
                </p>

                <Link
                  href="/help"
                  className="
                    group mt-5
                    inline-flex items-center
                    gap-2
                    text-[10px]
                    font-medium
                    text-[#cc785c]
                    outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#cc785c]
                    focus-visible:ring-offset-2
                  "
                >
                  Open Help Center

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
          </aside>

          {/* ========================================================== */}
          {/* QUESTIONS                                                  */}
          {/* ========================================================== */}

          <div>
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
                Essential questions
              </span>

              <span
                className="
                  font-mono text-[8px]
                  tracking-[0.16em]
                  text-[#cc785c]
                "
              >
                {String(FAQS.length).padStart(2, "0")} / FAQ
              </span>
            </div>

            <Accordion
              type="single"
              collapsible
              className="w-full"
            >
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="
                    group
                    border-b border-border
                    dark:border-white/[0.07]
                  "
                >
                  <AccordionTrigger
                    hideChevron
                    className="
                      py-0
                      text-left
                      hover:no-underline
                    "
                  >
                    <div
                      className="
                        grid w-full
                        grid-cols-[34px_minmax(0,1fr)_36px]
                        items-center
                        gap-3
                        py-5
                        sm:grid-cols-[46px_minmax(0,1fr)_90px_40px]
                        sm:gap-4
                        sm:py-6
                      "
                    >
                      {/* index */}
                      <span
                        className="
                          font-mono text-[8px]
                          tracking-[0.16em]
                          text-[#b0aaa2]
                          transition-colors
                          group-data-[state=open]:text-[#cc785c]
                          dark:text-zinc-500
                        "
                      >
                        {faq.index}
                      </span>

                      {/* question */}
                      <span
                        className="
                          pr-2
                          font-serif
                          text-[1.2rem]
                          font-normal
                          leading-[1.2]
                          tracking-[-0.02em]
                          text-[#252523]
                          transition-colors
                          group-hover:text-[#cc785c]
                          group-data-[state=open]:text-[#cc785c]
                          sm:text-[1.35rem]
                          dark:text-[#e8e4dd]
                        "
                      >
                        {faq.q}
                      </span>

                      {/* category */}
                      <span
                        className="
                          hidden
                          justify-self-end
                          font-mono text-[7px]
                          uppercase tracking-[0.15em]
                          text-muted-foreground
                          sm:block
                          dark:text-[#5f5c57]
                        "
                      >
                        {faq.category}
                      </span>

                      {/* custom open indicator */}
                      <span
                        aria-hidden="true"
                        className="
                          relative flex
                          h-8 w-8
                          items-center justify-center
                          justify-self-end
                          rounded-full
                          border border-border
                          transition-[background-color,border-color]
                          group-hover:border-[#cc785c]/25
                          group-data-[state=open]:border-[#cc785c]/20
                          group-data-[state=open]:bg-[#cc785c]/[0.07]
                          dark:border-white/[0.08]
                        "
                      >
                        <span
                          className="
                            absolute h-px w-3
                            bg-[#71717a]
                            transition-colors
                            group-data-[state=open]:bg-[#cc785c]
                            dark:bg-[#a1a1aa]
                          "
                        />

                        <span
                          className="
                            absolute h-3 w-px
                            bg-[#71717a]
                            transition-[transform,opacity,background-color]
                            duration-200
                            group-data-[state=open]:rotate-90
                            group-data-[state=open]:opacity-0
                            group-data-[state=open]:bg-[#cc785c]
                            dark:bg-[#a1a1aa]
                            motion-reduce:transition-none
                          "
                        />
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-0">
                    <div
                      className="
                        grid
                        grid-cols-[34px_minmax(0,1fr)]
                        gap-3
                        pb-7
                        sm:grid-cols-[46px_minmax(0,1fr)]
                        sm:gap-4
                        sm:pb-8
                      "
                    >
                      {/* answer rail */}
                      <div className="flex justify-center">
                        <span
                          aria-hidden="true"
                          className="
                            h-full min-h-12 w-px
                            bg-gradient-to-b
                            from-[#cc785c]/45
                            to-transparent
                          "
                        />
                      </div>

                      <div className="max-w-[680px]">
                        <span
                          className="
                            mb-2 block
                            font-mono text-[7px]
                            uppercase tracking-[0.19em]
                            text-[#cc785c]
                          "
                        >
                          Answer
                        </span>

                        <p
                          className="
                            text-[13px]
                            leading-6
                            text-muted-foreground
                            sm:text-[14px]
                            sm:leading-7
                            dark:text-zinc-400
                          "
                        >
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* ======================================================== */}
            {/* MOBILE HELP ROUTE                                        */}
            {/* ======================================================== */}

            <div
              className="
                mt-8
                rounded-[14px]
                border border-border
                bg-muted
                p-5
                lg:hidden
                dark:border-white/[0.07]
                dark:bg-zinc-900
              "
            >
              <div className="flex items-start gap-4">
                <div
                  className="
                    flex h-9 w-9
                    shrink-0 items-center justify-center
                    rounded-[9px]
                    bg-[#cc785c]/[0.07]
                    text-[#cc785c]
                  "
                >
                  <VaahanIcon
                    name="help"
                    size={15}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h3
                    className="
                      font-serif
                      text-lg
                      text-[#252523]
                      dark:text-zinc-100
                    "
                  >
                    Still have a question?
                  </h3>

                  <p
                    className="
                      mt-1.5
                      text-[10px]
                      leading-5
                      text-muted-foreground
                      dark:text-zinc-500
                    "
                  >
                    Find more setup and product guidance in the Help
                    Center.
                  </p>

                  <Link
                    href="/help"
                    className="
                      mt-4 inline-flex
                      items-center gap-2
                      text-[10px]
                      font-medium
                      text-[#cc785c]
                    "
                  >
                    Open Help Center

                    <VaahanIcon
                      name="arrow-right"
                      size={11}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM KNOWLEDGE RAIL                                        */}
        {/* ============================================================ */}

        <div
          className="
            mt-16 grid
            border-y border-border
            sm:grid-cols-3
            sm:divide-x
            sm:divide-border
            lg:mt-24
            dark:border-white/[0.07]
            dark:sm:divide-white/[0.07]
          "
        >
          <KnowledgeRoute
            href="/how-it-works"
            index="01"
            icon="route"
            title="How it works"
            description="Follow the QR journey"
          />

          <KnowledgeRoute
            href="/safety"
            index="02"
            icon="shield"
            title="Safety & privacy"
            description="Understand information controls"
          />

          <KnowledgeRoute
            href="/documents"
            index="03"
            icon="document"
            title="Documents"
            description="Read detailed product guidance"
          />
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* QUESTION INDEX                                                     */
/* ================================================================== */

function FaqIndexRow({
  index,
  label,
}: {
  index: string;
  label: string;
}) {
  return (
    <div
      className="
        grid grid-cols-[48px_1fr]
        gap-3
        py-2.5
      "
    >
      <span
        className="
          font-mono text-[7px]
          tracking-[0.12em]
          text-[#cc785c]
        "
      >
        {index}
      </span>

      <span
        className="
          text-[10px]
          text-muted-foreground
          dark:text-muted-foreground
        "
      >
        {label}
      </span>
    </div>
  );
}

/* ================================================================== */
/* KNOWLEDGE ROUTE                                                    */
/* ================================================================== */

function KnowledgeRoute({
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
        min-h-[100px]
        items-center gap-4
        border-b border-border
        px-3 py-5
        outline-none
        transition-colors
        hover:bg-muted
        focus-visible:bg-muted
        sm:border-b-0
        sm:px-5
        lg:px-6
        dark:border-white/[0.07]
        dark:hover:bg-white/[0.02]
        dark:focus-visible:bg-white/[0.02]
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
        {index}
      </span>

      <div
        className="
          flex h-9 w-9
          shrink-0 items-center justify-center
          rounded-[9px]
          border border-border
          text-muted-foreground
          transition-colors
          group-hover:border-[#cc785c]/20
          group-hover:bg-[#cc785c]/[0.06]
          group-hover:text-[#cc785c]
          dark:border-white/[0.07]
          dark:text-zinc-500
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
            text-[#252523]
            dark:text-zinc-200
          "
        >
          {title}
        </span>

        <span
          className="
            mt-1 block
            text-[9px]
            text-muted-foreground
            dark:text-zinc-500
          "
        >
          {description}
        </span>
      </div>

      <VaahanIcon
        name="arrow-right"
        size={12}
        className="
          text-[#b0aaa2]
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