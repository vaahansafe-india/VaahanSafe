"use client";

import { useState } from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import { Badge, Button } from "@vaahansafe/ui/components";
import { getCustomerUrl } from "@vaahansafe/config";

type AppTabKey =
  | "dashboard"
  | "vehicle"
  | "qr"
  | "contacts"
  | "history"
  | "subscription";

type TabItem = {
  key: AppTabKey;
  label: string;
  shortLabel: string;
  icon: string;
  index: string;
};

const tabs: TabItem[] = [
  {
    key: "dashboard",
    label: "Overview",
    shortLabel: "Home",
    icon: "dashboard",
    index: "01",
  },
  {
    key: "vehicle",
    label: "My Vehicle",
    shortLabel: "Vehicle",
    icon: "car",
    index: "02",
  },
  {
    key: "qr",
    label: "My QR",
    shortLabel: "QR",
    icon: "qr",
    index: "03",
  },
  {
    key: "contacts",
    label: "Emergency Contacts",
    shortLabel: "Contacts",
    icon: "phone",
    index: "04",
  },
  {
    key: "history",
    label: "Scan History",
    shortLabel: "Scans",
    icon: "activity",
    index: "05",
  },
  {
    key: "subscription",
    label: "Plan",
    shortLabel: "Plan",
    icon: "receipt",
    index: "06",
  },
];

export function CustomerAppShowcase() {
  const [activeTab, setActiveTab] =
    useState<AppTabKey>("dashboard");

  const customerUrl = getCustomerUrl();

  return (
    <section
      id="customer-app"
      aria-labelledby="customer-app-title"
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
      {/* SECTION ATMOSPHERE                                           */}
      {/* ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* large identity orbit */}
        <div
          className="
            absolute left-1/2 top-[52%]
            h-[620px] w-[620px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#cc785c]/[0.06]
            sm:h-[820px] sm:w-[820px]
            lg:h-[1120px] lg:w-[1120px]
          "
        />

        <div
          className="
            absolute left-1/2 top-[52%]
            h-[420px] w-[420px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            border border-[#09090b]/[0.035]
            dark:border-[#fafafa]/[0.035]
            sm:h-[620px] sm:w-[620px]
            lg:h-[850px] lg:w-[850px]
          "
        />

        {/* warm product light */}
        <div
          className="
            absolute left-1/2 top-[55%]
            h-[520px] w-[720px]
            -translate-x-1/2 -translate-y-1/2
            rounded-full
            bg-[#cc785c]/[0.045]
            blur-[110px]
            sm:h-[720px] sm:w-[1000px]
          "
        />

        {/* sparse product coordinates */}
        <span className="absolute left-[7%] top-[34%] hidden h-1.5 w-1.5 bg-[#cc785c]/35 lg:block" />

        <span className="absolute right-[9%] top-[42%] hidden h-1.5 w-1.5 bg-[#5db8a6]/35 lg:block" />

        <span className="absolute bottom-[22%] left-[12%] hidden h-1 w-1 bg-[#e8a55a]/45 lg:block" />

        <span
          className="
            absolute left-[3%] top-1/2 hidden
            -rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.26em]
            text-muted-foreground/45
            xl:block
            dark:text-zinc-400/40
          "
        >
          Owner / Vehicle / Identity
        </span>

        <span
          className="
            absolute right-[3%] top-1/2 hidden
            rotate-90
            font-mono text-[8px]
            uppercase tracking-[0.26em]
            text-muted-foreground/45
            xl:block
            dark:text-zinc-400/40
          "
        >
          Control / Profile / Safety
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
        {/* EDITORIAL HEADER                                             */}
        {/* ============================================================ */}

        <header className="mx-auto max-w-[850px] text-center">
          <Badge
            variant="outline"
            className="
              mb-6 rounded-full
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
            Your VaahanSafe
          </Badge>

          <h2
            id="customer-app-title"
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
              lg:text-[4.4rem]
              dark:text-zinc-50
            "
          >
            Your vehicle identity,
            <br className="hidden sm:block" />
            <span className="text-[#cc785c]">
              {" "}
              under your control.
            </span>
          </h2>

          <p
            className="
              mx-auto mt-7 max-w-2xl
              text-pretty text-base
              leading-7
              text-muted-foreground
              sm:text-lg sm:leading-8
              dark:text-zinc-400
            "
          >
            Keep your vehicle, QR identity, emergency contacts and
            safety profile together in one calm, focused experience.
          </p>
        </header>

        {/* ============================================================ */}
        {/* PRODUCT STAGE                                                */}
        {/* ============================================================ */}

        <div className="relative mx-auto mt-16 max-w-[1180px] sm:mt-20 lg:mt-28">
          {/* top annotation */}
          <div
            aria-hidden="true"
            className="
              mb-4 hidden items-center justify-between
              px-2 lg:flex
            "
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#cc785c]/50" />

              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/60 dark:text-zinc-400/60">
                Vehicle identity / owner view
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-muted-foreground/60 dark:text-zinc-400/60">
                Interactive preview
              </span>

              <span className="h-px w-10 bg-[#5db8a6]/50" />
            </div>
          </div>

          {/* ========================================================== */}
          {/* APP ARTIFACT                                               */}
          {/* ========================================================== */}

          <div
            className="
              relative overflow-hidden
              rounded-[22px]
              border border-[#2c2a27]
              bg-[#09090b]
              text-[#fafafa]
              shadow-[0_40px_120px_rgba(20,20,19,0.20)]
              sm:rounded-[28px]
            "
          >
            {/* Internal atmospheric geometry */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute -right-32 -top-36 h-[360px] w-[360px] rounded-full bg-[#cc785c]/[0.08] blur-[100px]" />

              <div className="absolute -bottom-40 left-[20%] h-[340px] w-[340px] rounded-full bg-[#5db8a6]/[0.035] blur-[100px]" />

              <div className="absolute right-[8%] top-[22%] h-[380px] w-[380px] rounded-full border border-white/[0.025]" />

              <div className="absolute right-[14%] top-[29%] h-[260px] w-[260px] rounded-full border border-[#cc785c]/[0.035]" />
            </div>

            {/* ======================================================== */}
            {/* PRODUCT BAR                                              */}
            {/* ======================================================== */}

            <div
              className="
                relative flex min-h-[64px]
                items-center justify-between
                gap-4
                border-b border-white/[0.07]
                px-4
                sm:px-6
                lg:px-7
              "
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="
                    relative flex h-9 w-9
                    shrink-0 items-center justify-center
                    rounded-[10px]
                    bg-background
                    text-[#09090b]
                  "
                >
                  <VaahanIcon
                    name="qr"
                    size={16}
                    aria-hidden="true"
                  />

                  <span
                    aria-hidden="true"
                    className="
                      absolute -right-1 -top-1
                      h-2.5 w-2.5
                      rounded-full
                      border-2 border-[#09090b]
                      bg-[#cc785c]
                    "
                  />
                </div>

                <div className="min-w-0">
                  <span
                    className="
                      block font-mono
                      text-[8px] uppercase
                      tracking-[0.2em]
                      text-[#71717a]
                    "
                  >
                    VaahanSafe
                  </span>

                  <span className="block truncate text-xs font-medium text-[#f5f1ea] sm:text-[13px]">
                    My Vehicle Identity
                  </span>
                </div>
              </div>

              {/* deliberately not a fake browser URL bar */}
              <div className="hidden items-center gap-2 md:flex">
                <span className="relative flex h-2 w-2">
                  <span
                    className="
                      absolute inline-flex
                      h-full w-full
                      animate-ping rounded-full
                      bg-[#5db872]
                      opacity-20
                      motion-reduce:hidden
                    "
                  />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5db872]" />
                </span>

                <span className="font-mono text-[8px] uppercase tracking-[0.17em] text-muted-foreground">
                  Profile ready
                </span>
              </div>

              <span
                className="
                  shrink-0
                  font-mono text-[8px]
                  font-medium uppercase
                  tracking-[0.16em]
                  text-[#cc785c]
                "
              >
                Demo
              </span>
            </div>

            {/* ======================================================== */}
            {/* MOBILE TAB STRIP                                         */}
            {/* ======================================================== */}

            <div
              className="
                relative border-b border-white/[0.07]
                bg-[#1c1b18]
                md:hidden
              "
            >
              <div
                role="tablist"
                aria-label="Customer app preview"
                className="
                  flex snap-x snap-mandatory
                  gap-1 overflow-x-auto
                  px-3 py-3
                  [scrollbar-width:none]
                  [&::-webkit-scrollbar]:hidden
                "
              >
                {tabs.map((tab) => {
                  const selected = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`vaahansafe-panel-${tab.key}`}
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        flex min-h-10 shrink-0
                        snap-start items-center gap-2
                        rounded-[8px]
                        px-3
                        text-[11px] font-medium
                        outline-none
                        transition-colors
                        focus-visible:ring-2
                        focus-visible:ring-[#cc785c]
                        focus-visible:ring-offset-2
                        focus-visible:ring-offset-[#09090b]
                        ${
                          selected
                            ? "bg-background text-[#09090b]"
                            : "text-muted-foreground hover:bg-white/[0.04] hover:text-[#fafafa]"
                        }
                      `}
                    >
                      <VaahanIcon
                        name={tab.icon as any}
                        size={14}
                        aria-hidden="true"
                      />

                      {tab.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* APPLICATION BODY                                         */}
            {/* ======================================================== */}

            <div
              className="
                relative grid
                md:grid-cols-[220px_minmax(0,1fr)]
                lg:grid-cols-[250px_minmax(0,1fr)]
              "
            >
              {/* ====================================================== */}
              {/* DESKTOP IDENTITY NAV                                   */}
              {/* ====================================================== */}

              <aside
                className="
                  relative hidden
                  min-h-[610px]
                  border-r border-white/[0.07]
                  bg-[#1c1b18]/80
                  p-4
                  md:flex md:flex-col
                  lg:p-5
                "
              >
                <div className="mb-6 px-2 pt-2">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#68655f]">
                    Owner space
                  </span>

                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    Everything connected to your vehicle identity.
                  </p>
                </div>

                <nav
                  role="tablist"
                  aria-label="Customer app preview"
                  className="space-y-1"
                >
                  {tabs.map((tab) => {
                    const selected = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        aria-controls={`vaahansafe-panel-${tab.key}`}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                          group relative flex
                          min-h-[46px] w-full
                          items-center gap-3
                          rounded-[9px]
                          px-3
                          text-left
                          outline-none
                          transition-colors
                          focus-visible:ring-2
                          focus-visible:ring-[#cc785c]
                          focus-visible:ring-offset-2
                          focus-visible:ring-offset-[#1c1b18]
                          ${
                            selected
                              ? "bg-background text-[#09090b]"
                              : "text-muted-foreground hover:bg-white/[0.035] hover:text-[#fafafa]"
                          }
                        `}
                      >
                        <span
                          className={`
                            font-mono text-[8px]
                            tracking-[0.12em]
                            ${
                              selected
                                ? "text-[#a9583e]"
                                : "text-[#5d5a55]"
                            }
                          `}
                        >
                          {tab.index}
                        </span>

                        <VaahanIcon
                          name={tab.icon as any}
                          size={15}
                          aria-hidden="true"
                          className={
                            selected
                              ? "text-[#cc785c]"
                              : "text-[#71717a]"
                          }
                        />

                        <span className="text-[11px] font-medium">
                          {tab.label}
                        </span>

                        {selected && (
                          <span
                            aria-hidden="true"
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-[#cc785c]"
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* identity footer */}
                <div className="mt-auto border-t border-white/[0.07] px-2 pt-5">
                  <span className="block font-mono text-[8px] uppercase tracking-[0.18em] text-[#5f5c57]">
                    VaahanSafe ID
                  </span>

                  <span className="mt-1.5 block font-mono text-[11px] tracking-[0.08em] text-[#cc785c]">
                    VS-7F3K-9021
                  </span>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

                    <span className="text-[9px] text-[#71717a]">
                      Identity active
                    </span>
                  </div>
                </div>
              </aside>

              {/* ====================================================== */}
              {/* DYNAMIC PRODUCT STAGE                                  */}
              {/* ====================================================== */}

              <main
                className="
                  relative min-w-0
                  bg-[#09090b]
                  px-4 py-5
                  sm:px-6 sm:py-7
                  lg:px-9 lg:py-9
                "
              >
                {/* stage header */}
                <div
                  className="
                    mb-7 flex
                    items-start justify-between
                    gap-5
                    border-b border-white/[0.07]
                    pb-5
                  "
                >
                  <div>
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#71717a]">
                      {tabs.find((tab) => tab.key === activeTab)?.index} /
                      {" "}
                      {
                        tabs.find((tab) => tab.key === activeTab)
                          ?.shortLabel
                      }
                    </span>

                    <h3
                      className="
                        mt-2 font-serif
                        text-2xl font-normal
                        tracking-[-0.025em]
                        text-[#fafafa]
                        sm:text-[1.8rem]
                      "
                    >
                      {getPanelTitle(activeTab)}
                    </h3>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

                    <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#71717a]">
                      Active
                    </span>
                  </div>
                </div>

                {/* Panel changes */}
                <div
                  key={activeTab}
                  id={`vaahansafe-panel-${activeTab}`}
                  role="tabpanel"
                  className="
                    min-h-[390px]
                    animate-[vaahanPanelIn_320ms_cubic-bezier(0.16,1,0.3,1)]
                    motion-reduce:animate-none
                  "
                >
                  {activeTab === "dashboard" && <OverviewPanel />}

                  {activeTab === "vehicle" && <VehiclePanel />}

                  {activeTab === "qr" && <QrPanel />}

                  {activeTab === "contacts" && <ContactsPanel />}

                  {activeTab === "history" && <HistoryPanel />}

                  {activeTab === "subscription" && <PlanPanel />}
                </div>

                {/* ==================================================== */}
                {/* APP FOOTER ACTION                                    */}
                {/* ==================================================== */}

                <div
                  className="
                    mt-7 flex flex-col
                    gap-4
                    border-t border-white/[0.07]
                    pt-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div className="flex items-center gap-2">
                    <VaahanIcon
                      name="shield"
                      size={13}
                      className="text-[#5db8a6]"
                      aria-hidden="true"
                    />

                    <span className="text-[10px] leading-5 text-[#71717a] sm:text-[11px]">
                      Your account controls what your public safety view
                      can show.
                    </span>
                  </div>

                  <Button
                    size="sm"
                    asChild
                    className="
                      h-10 shrink-0
                      rounded-[8px]
                      bg-[#cc785c]
                      px-4
                      text-[11px] font-medium
                      text-white
                      shadow-none
                      hover:bg-[#a9583e]
                      focus-visible:ring-[#cc785c]
                    "
                  >
                    <a
                      href={customerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open VaahanSafe

                      <VaahanIcon
                        name="arrow-right"
                        size={13}
                        className="ml-2"
                        aria-hidden="true"
                      />
                    </a>
                  </Button>
                </div>
              </main>
            </div>

            {/* identity spectrum */}
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

          {/* ========================================================== */}
          {/* OUTSIDE PRODUCT CAPTION                                    */}
          {/* ========================================================== */}

          <div
            className="
              mt-5 flex flex-col
              items-center justify-between
              gap-3
              px-1
              sm:flex-row
            "
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-[#cc785c]/40" />

              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground/65 dark:text-zinc-400/65">
                Synthetic product preview
              </span>
            </div>

            <span className="text-center text-[11px] text-muted-foreground sm:text-right">
              Preview content is illustrative and contains no customer
              information.
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION CLOSING                                              */}
        {/* ============================================================ */}

        <div className="mx-auto mt-16 max-w-3xl text-center sm:mt-20">
          <p
            className="
              text-balance
              font-serif
              text-2xl
              font-normal
              leading-[1.25]
              tracking-[-0.025em]
              text-foreground
              sm:text-3xl
              dark:text-zinc-50
            "
          >
            One place for the identity
            <span className="text-[#cc785c]">
              {" "}
              your vehicle carries into the world.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================== */
/* PANEL TITLES                                                       */
/* ================================================================== */

function getPanelTitle(tab: AppTabKey) {
  switch (tab) {
    case "dashboard":
      return "Your vehicle, at a glance.";

    case "vehicle":
      return "The vehicle behind the identity.";

    case "qr":
      return "The QR your vehicle carries.";

    case "contacts":
      return "The people who should be reachable.";

    case "history":
      return "A clear view of recent scans.";

    case "subscription":
      return "Your VaahanSafe plan.";

    default:
      return "Your VaahanSafe.";
  }
}

/* ================================================================== */
/* OVERVIEW                                                           */
/* ================================================================== */

function OverviewPanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      {/* Main vehicle identity */}
      <div
        className="
          relative overflow-hidden
          rounded-[16px]
          border border-white/[0.07]
          bg-[#22211e]
          p-5
          sm:p-6
        "
      >
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#cc785c]/[0.08] blur-[55px]"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-[13px]
                border border-[#cc785c]/20
                bg-[#cc785c]/10
                text-[#cc785c]
              "
            >
              <VaahanIcon
                name="bike"
                size={23}
                aria-hidden="true"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

              <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#8fd0a0]">
                Ready
              </span>
            </div>
          </div>

          <span className="mt-7 block font-mono text-[8px] uppercase tracking-[0.2em] text-[#6f6c66]">
            Primary vehicle
          </span>

          <h4 className="mt-2 font-serif text-[1.7rem] tracking-[-0.025em] text-[#fafafa]">
            Honda — Demo Vehicle
          </h4>

          <p className="mt-2 font-mono text-[10px] tracking-[0.04em] text-muted-foreground">
            DL 01 •••• 4821
          </p>

          <div className="mt-7 grid grid-cols-2 gap-5 border-t border-white/[0.06] pt-5">
            <IdentityMetric
              label="VaahanSafe ID"
              value="VS-7F3K-9021"
              accent
            />

            <IdentityMetric
              label="Safety profile"
              value="Ready"
            />

            <IdentityMetric
              label="Contacts"
              value="2 selected"
            />

            <IdentityMetric
              label="QR status"
              value="Active"
            />
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="space-y-4">
        <div
          className="
            rounded-[16px]
            border border-white/[0.07]
            bg-[#18181b]
            p-5
          "
        >
          <span className="font-mono text-[8px] uppercase tracking-[0.19em] text-[#68655f]">
            Recent activity
          </span>

          <div className="mt-5 flex gap-3">
            <div className="relative flex flex-col items-center">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#cc785c]" />

              <span className="mt-2 h-12 w-px bg-gradient-to-b from-[#cc785c]/35 to-transparent" />
            </div>

            <div>
              <span className="block text-[12px] font-medium text-[#ece8e1]">
                QR scanned
              </span>

              <span className="mt-1 block text-[10px] leading-5 text-[#71717a]">
                Demo scan • Yesterday
              </span>
            </div>
          </div>
        </div>

        <div
          className="
            rounded-[16px]
            border border-[#5db8a6]/10
            bg-[#5db8a6]/[0.045]
            p-5
          "
        >
          <div className="flex items-start gap-3">
            <VaahanIcon
              name="shield"
              size={16}
              className="mt-0.5 text-[#5db8a6]"
              aria-hidden="true"
            />

            <div>
              <span className="block text-[12px] font-medium text-[#ece8e1]">
                Safety profile ready
              </span>

              <p className="mt-1.5 text-[10px] leading-5 text-[#71717a]">
                Your selected public safety information is ready to be
                presented when needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* VEHICLE                                                            */
/* ================================================================== */

function VehiclePanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_.72fr]">
      <div
        className="
          rounded-[16px]
          border border-white/[0.07]
          bg-[#22211e]
          p-5
          sm:p-6
        "
      >
        <div className="flex items-center gap-4">
          <div
            className="
              flex h-14 w-14
              shrink-0 items-center justify-center
              rounded-[14px]
              border border-[#cc785c]/20
              bg-[#cc785c]/10
              text-[#cc785c]
            "
          >
            <VaahanIcon
              name="bike"
              size={26}
              aria-hidden="true"
            />
          </div>

          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#68655f]">
              My vehicle
            </span>

            <h4 className="mt-1 font-serif text-2xl tracking-[-0.025em] text-[#fafafa]">
              Honda — Demo Vehicle
            </h4>
          </div>
        </div>

        <dl className="mt-7 divide-y divide-white/[0.06]">
          <DetailRow
            label="Vehicle type"
            value="Two-wheeler"
          />

          <DetailRow
            label="Registration"
            value="DL 01 •••• 4821"
            mono
          />

          <DetailRow
            label="Fuel"
            value="Petrol"
          />

          <DetailRow
            label="Safety profile"
            value="Privacy controlled"
          />
        </dl>
      </div>

      <div
        className="
          relative overflow-hidden
          rounded-[16px]
          border border-white/[0.07]
          bg-[#18181b]
          p-5
        "
      >
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full border border-[#cc785c]/10"
        />

        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#68655f]">
          Connected identity
        </span>

        <div className="mt-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#cc785c]/15">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#cc785c]/25 bg-[#cc785c]/[0.06] text-[#cc785c]">
            <VaahanIcon
              name="qr"
              size={23}
              aria-hidden="true"
            />
          </div>
        </div>

        <p className="mt-8 max-w-[220px] text-[11px] leading-5 text-muted-foreground">
          This vehicle and its VaahanSafe QR belong to the same safety
          identity.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* QR                                                                 */
/* ================================================================== */

function QrPanel() {
  return (
    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div
        className="
          relative mx-auto
          flex h-[210px] w-full
          max-w-[250px]
          items-center justify-center
          rounded-[18px]
          border border-white/[0.07]
          bg-[#22211e]
          sm:h-[260px]
        "
      >
        <span className="absolute left-4 top-4 font-mono text-[8px] uppercase tracking-[0.18em] text-[#68655f]">
          My QR
        </span>

        <DemoQr />

        <span className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

          <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#8fd0a0]">
            Active
          </span>
        </span>
      </div>

      <div className="sm:pl-4">
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#68655f]">
          VaahanSafe ID
        </span>

        <div className="mt-2 font-mono text-lg tracking-[0.1em] text-[#cc785c] sm:text-xl">
          VS-7F3K-9021
        </div>

        <p className="mt-5 max-w-md text-[12px] leading-6 text-muted-foreground">
          This is the identity associated with your vehicle. Keep the
          physical QR in good condition and manage its profile from your
          VaahanSafe account.
        </p>

        <div className="mt-7 flex items-center gap-2 border-t border-white/[0.06] pt-5">
          <VaahanIcon
            name="shield"
            size={14}
            className="text-[#5db8a6]"
            aria-hidden="true"
          />

          <span className="text-[10px] text-[#71717a]">
            Public safety information remains owner controlled.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* CONTACTS                                                           */
/* ================================================================== */

function ContactsPanel() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#68655f]">
            Selected contacts
          </span>

          <p className="mt-2 max-w-md text-[11px] leading-5 text-muted-foreground">
            Choose who should be reachable through your safety profile.
          </p>
        </div>

        <span className="font-mono text-[9px] text-[#cc785c]">
          02
        </span>
      </div>

      <div className="space-y-2">
        <ContactRow
          initials="SP"
          role="Spouse"
          number="+91 ••••• ••001"
          primary
        />

        <ContactRow
          initials="FM"
          role="Family"
          number="+91 ••••• ••724"
        />
      </div>

      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <div className="flex items-start gap-3">
          <VaahanIcon
            name="shield"
            size={14}
            className="mt-0.5 text-[#5db8a6]"
            aria-hidden="true"
          />

          <p className="max-w-lg text-[10px] leading-5 text-[#71717a]">
            Contact information shown here is synthetic. Your public
            safety view should only present the information you choose.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* HISTORY                                                            */
/* ================================================================== */

function HistoryPanel() {
  return (
    <div>
      <div className="relative pl-7">
        <div
          aria-hidden="true"
          className="absolute bottom-2 left-[5px] top-2 w-px bg-gradient-to-b from-[#cc785c]/50 via-white/[0.08] to-transparent"
        />

        <HistoryEvent
          accent="coral"
          title="QR scanned"
          meta="Demo location • Yesterday"
          detail="The vehicle safety identity was opened."
        />

        <HistoryEvent
          title="Safety profile viewed"
          meta="Demo activity • 2 days ago"
          detail="Selected safety information was presented."
        />

        <HistoryEvent
          title="Profile updated"
          meta="Owner activity • 5 days ago"
          detail="Emergency contact preferences were changed."
        />
      </div>
    </div>
  );
}

/* ================================================================== */
/* PLAN                                                               */
/* ================================================================== */

function PlanPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_.8fr]">
      <div
        className="
          relative overflow-hidden
          rounded-[16px]
          border border-[#cc785c]/15
          bg-[#cc785c]/[0.055]
          p-5
          sm:p-6
        "
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#cc785c]">
          Current plan
        </span>

        <h4 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-[#fafafa]">
          VaahanSafe
        </h4>

        <p className="mt-4 max-w-sm text-[11px] leading-5 text-muted-foreground">
          Your plan manages the services around your VaahanSafe
          experience. Your vehicle QR remains a separate identity
          concept.
        </p>

        <div className="mt-7 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />

          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#8fd0a0]">
            Active
          </span>
        </div>
      </div>

      <div
        className="
          rounded-[16px]
          border border-white/[0.07]
          bg-[#18181b]
          p-5
        "
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#68655f]">
          Important distinction
        </span>

        <div className="mt-6 space-y-5">
          <PlanConcept
            icon="qr"
            title="QR identity"
            text="Identifies the vehicle."
          />

          <div className="h-px bg-white/[0.06]" />

          <PlanConcept
            icon="receipt"
            title="VaahanSafe plan"
            text="Controls the services available to your account."
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SMALL COMPOSITIONS                                                 */
/* ================================================================== */

function IdentityMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <span className="block font-mono text-[8px] uppercase tracking-[0.17em] text-[#71717a]">
        {label}
      </span>

      <span
        className={`mt-1.5 block text-[11px] font-medium ${
          accent
            ? "font-mono tracking-[0.04em] text-[#cc785c]"
            : "text-[#d8d4cd]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <dt className="text-[10px] text-[#71717a]">
        {label}
      </dt>

      <dd
        className={`text-right text-[11px] text-[#e2ded7] ${
          mono ? "font-mono tracking-[0.03em]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ContactRow({
  initials,
  role,
  number,
  primary = false,
}: {
  initials: string;
  role: string;
  number: string;
  primary?: boolean;
}) {
  return (
    <div
      className="
        flex items-center
        justify-between gap-4
        rounded-[12px]
        border border-white/[0.07]
        bg-[#22211e]
        p-4
        sm:p-5
      "
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`
            flex h-10 w-10
            shrink-0 items-center justify-center
            rounded-[10px]
            font-mono text-[9px]
            ${
              primary
                ? "bg-[#cc785c]/10 text-[#cc785c]"
                : "bg-white/[0.04] text-muted-foreground"
            }
          `}
        >
          {initials}
        </div>

        <div className="min-w-0">
          <span className="block truncate text-[12px] font-medium text-[#ece8e1]">
            {role}
          </span>

          <span className="mt-1 block font-mono text-[9px] text-[#71717a]">
            {number}
          </span>
        </div>
      </div>

      {primary && (
        <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-[#cc785c]">
          Primary
        </span>
      )}
    </div>
  );
}

function HistoryEvent({
  title,
  meta,
  detail,
  accent,
}: {
  title: string;
  meta: string;
  detail: string;
  accent?: "coral";
}) {
  return (
    <div className="relative pb-8 last:pb-0">
      <span
        aria-hidden="true"
        className={`
          absolute -left-[26px] top-1
          h-[11px] w-[11px]
          rounded-full
          border-2 border-[#09090b]
          ${
            accent === "coral"
              ? "bg-[#cc785c]"
              : "bg-[#71717a]"
          }
        `}
      />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
        <div>
          <span className="block text-[12px] font-medium text-[#ece8e1]">
            {title}
          </span>

          <p className="mt-1 text-[10px] leading-5 text-[#71717a]">
            {detail}
          </p>
        </div>

        <span className="shrink-0 font-mono text-[8px] text-[#68655f]">
          {meta}
        </span>
      </div>
    </div>
  );
}

function PlanConcept({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.04] text-[#cc785c]">
        <VaahanIcon
          name={icon as any}
          size={14}
          aria-hidden="true"
        />
      </div>

      <div>
        <span className="block text-[11px] font-medium text-[#ece8e1]">
          {title}
        </span>

        <span className="mt-1 block text-[9px] leading-4 text-[#71717a]">
          {text}
        </span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* SYNTHETIC QR ARTIFACT                                              */
/* ================================================================== */

function DemoQr() {
  return (
    <div className="relative">
      {/* custom scan corners */}
      <span
        aria-hidden="true"
        className="absolute -left-3 -top-3 h-5 w-5 border-l border-t border-[#cc785c]/70"
      />

      <span
        aria-hidden="true"
        className="absolute -right-3 -top-3 h-5 w-5 border-r border-t border-[#cc785c]/70"
      />

      <span
        aria-hidden="true"
        className="absolute -bottom-3 -left-3 h-5 w-5 border-b border-l border-[#cc785c]/70"
      />

      <span
        aria-hidden="true"
        className="absolute -bottom-3 -right-3 h-5 w-5 border-b border-r border-[#cc785c]/70"
      />

      <div className="relative h-[116px] w-[116px] overflow-hidden rounded-[12px] bg-background p-2.5">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          aria-hidden="true"
        >
          <QrFinder x={5} y={5} />
          <QrFinder x={69} y={5} />
          <QrFinder x={5} y={69} />

          {[
            [42, 8],
            [54, 8],
            [42, 20],
            [58, 20],
            [38, 37],
            [50, 37],
            [63, 37],
            [76, 37],
            [38, 49],
            [58, 49],
            [76, 49],
            [38, 61],
            [50, 61],
            [65, 61],
            [78, 61],
            [42, 74],
            [55, 74],
            [68, 74],
            [79, 81],
          ].map(([x, y], index) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="7"
              height="7"
              rx="1"
              fill={
                index === 8
                  ? "#CC785C"
                  : "#09090b"
              }
            />
          ))}
        </svg>

        <span
          aria-hidden="true"
          className="
            absolute left-2 right-2 top-2
            h-px
            bg-[#cc785c]/80
            shadow-[0_0_8px_rgba(204,120,92,0.20)]
            motion-safe:animate-[vaahanQrScan_2.4s_cubic-bezier(0.16,1,0.3,1)_1_forwards]
            motion-reduce:hidden
          "
        />
      </div>
    </div>
  );
}

function QrFinder({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="26"
        height="26"
        rx="2"
        fill="#09090b"
      />

      <rect
        x={x + 5}
        y={y + 5}
        width="16"
        height="16"
        rx="1"
        fill="#fafafa"
      />

      <rect
        x={x + 9}
        y={y + 9}
        width="8"
        height="8"
        rx="1"
        fill="#09090b"
      />
    </g>
  );
}