import type { Metadata } from "next";
import Link from "next/link";
import { JOURNEY_STAGES } from "@vaahansafe/status-core";
import { StatusHeader } from "../../components/status/shell/StatusHeader";
import { StatusFooter } from "../../components/status/shell/StatusFooter";

export const metadata: Metadata = {
  title: "Reliability & Status Methodology — VaahanSafe Status",
  description: "How VaahanSafe records checks, describes service conditions, and publishes incidents.",
  alternates: { canonical: "https://status.vaahansafe.com/methodology" },
};

const sections = [
  { id: "journey", number: "01", title: "What we monitor", summary: "The status page follows the steps people take with VaahanSafe, so a service condition has a clear customer meaning." },
  { id: "conditions", number: "02", title: "How conditions are named", summary: "A condition describes the available evidence for a capability. Unknown is shown when that evidence is missing." },
  { id: "history", number: "03", title: "How the 90-day history works", summary: "Each mark represents one calendar day in India Standard Time. The history uses recorded Cloudflare checks, not estimated uptime." },
  { id: "sources", number: "04", title: "Sources and timing", summary: "The infrastructure panel separates a direct Supabase read from the Cloudflare scheduled heartbeat. Service history comes from recorded public capability checks." },
] as const;

const conditions = [
  { name: "Operational", color: "bg-[#48bd83]", description: "The configured public check is responding successfully." },
  { name: "Degraded", color: "bg-[#d6a339]", description: "The capability remains reachable, but a recorded check indicates reduced performance." },
  { name: "Partial outage", color: "bg-[#bd5a4b]", description: "Some of the capability is unavailable or failing." },
  { name: "Major outage", color: "bg-[#bd5a4b]", description: "A primary capability is unavailable." },
  { name: "Maintenance", color: "bg-[#718b88]", description: "A planned service window has been published." },
  { name: "Condition unknown", color: "bg-[#b8bec5]", description: "A reliable check is unavailable; no healthy state is inferred." },
];

function Heading({ number, title, summary }: { number: string; title: string; summary: string }) {
  return <div className="border-t border-[#d8d0c5] pt-6 dark:border-[#37342e]"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a9583e]">{number} / Methodology</p><h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{title}</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#696157] sm:text-base dark:text-[#b2aba0]">{summary}</p></div>;
}

export default function MethodologyPage() {
  return <div className="status-canvas flex min-h-screen flex-col text-[#252320] dark:text-[#f6f1e9]">
    <StatusHeader />
    <main id="main-content" className="w-full flex-1 pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-[#d8d0c5] py-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a8073] dark:border-[#37342e] dark:text-[#aaa297]"><Link href="/" className="hover:text-[#a9583e]">Status</Link><span className="mx-3">/</span>Methodology</div>
        <header className="grid gap-8 border-b border-[#d8d0c5] py-12 sm:py-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,.5fr)] lg:items-end dark:border-[#37342e]">
          <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a9583e]">Field notes / 01</p><h1 className="mt-4 max-w-3xl font-serif text-[clamp(2.8rem,7vw,5.7rem)] leading-[.98] tracking-tight">How we report reliability.</h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-[#696157] sm:text-lg dark:text-[#b2aba0]">A clear account of the checks behind this status page, the meaning of each condition, and the limits of the history we show.</p></div>
          <div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 dark:border-[#37342e] dark:bg-[#211f1b]"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a9583e]">Reporting principle</p><p className="mt-3 font-serif text-xl leading-snug">Only recorded evidence informs the public timeline.</p><p className="mt-3 text-xs leading-relaxed text-[#756e63] dark:text-[#b2aba0]">A missing check remains unrecorded. It is never counted as successful uptime.</p></div>
        </header>
        <div className="grid gap-10 pt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="On this page" className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:block lg:self-start lg:overflow-visible"><p className="hidden pb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9583e] lg:block">In this document</p>{sections.map(section => <a key={section.id} href={`#${section.id}`} className="block shrink-0 rounded-sm border border-[#d8d0c5] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.06em] text-[#514b43] hover:border-[#a9583e] hover:text-[#a9583e] lg:mb-1 lg:border-0 lg:border-l-2 lg:border-l-[#d8d0c5] lg:px-4 dark:border-[#4b463d] dark:text-[#c5bdb2]">{section.number} / {section.title}</a>)}</nav>
          <div className="min-w-0 space-y-14 sm:space-y-20">
            <section id="journey" className="scroll-mt-24"><Heading {...sections[0]} /><div className="mt-7 grid gap-px overflow-hidden rounded-sm border border-[#d8d0c5] bg-[#d8d0c5] sm:grid-cols-2 dark:border-[#37342e] dark:bg-[#37342e]">{JOURNEY_STAGES.map((stage, index) => <div key={stage.stage} className="bg-[#fffefa] p-5 sm:p-6 dark:bg-[#211f1b]"><div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#a9583e]"><span>{stage.stage}</span><span className="text-[#a69c8f]">{String(index + 1).padStart(2, "0")}</span></div><h3 className="mt-3 font-serif text-xl">{stage.defaultServiceName}</h3><p className="mt-2 text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">{stage.description}</p></div>)}</div></section>
            <section id="conditions" className="scroll-mt-24"><Heading {...sections[1]} /><div className="mt-7 overflow-hidden rounded-sm border border-[#d8d0c5] bg-[#fffefa] dark:border-[#37342e] dark:bg-[#211f1b]">{conditions.map(condition => <div key={condition.name} className="grid gap-2 border-b border-[#e8e2d7] px-5 py-4 last:border-0 sm:grid-cols-[180px_1fr] sm:items-center dark:border-[#37342e]"><div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"><span className={`h-2 w-2 rounded-full ${condition.color}`} />{condition.name}</div><p className="text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">{condition.description}</p></div>)}</div></section>
            <section id="history" className="scroll-mt-24"><Heading {...sections[2]} /><div className="mt-7 grid gap-px overflow-hidden rounded-sm border border-[#d8d0c5] bg-[#d8d0c5] sm:grid-cols-3 dark:border-[#37342e] dark:bg-[#37342e]">{[{ label: "Green", value: "Successful check recorded", color: "bg-[#48bd83]" }, { label: "Amber / red", value: "Degraded or failed check recorded", color: "bg-[#d6a339]" }, { label: "Grey", value: "No check recorded that day", color: "bg-[#b8bec5]" }].map(item => <div key={item.label} className="bg-[#fffefa] p-5 dark:bg-[#211f1b]"><span className={`block h-8 w-2 ${item.color}`} /><p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#a9583e]">{item.label}</p><p className="mt-2 font-serif text-lg">{item.value}</p></div>)}</div><p className="mt-5 border-l-2 border-[#a9583e] pl-4 text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">Observed success is successful checks divided by completed recorded checks. It does not describe unobserved time, and it should not be read as a 90-day service-level guarantee.</p></section>
            <section id="sources" className="scroll-mt-24"><Heading {...sections[3]} /><div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 dark:border-[#37342e] dark:bg-[#211f1b]"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a9583e]">Direct database read</p><p className="mt-3 text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">A server-side request checks whether Supabase responds now. This is separate from the scheduled run history.</p></div><div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 dark:border-[#37342e] dark:bg-[#211f1b]"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a9583e]">Cloudflare scheduled run</p><p className="mt-3 text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">The Worker runs every 10 minutes. A successful database heartbeat is considered overdue after 25 minutes without a new record.</p></div></div><p className="mt-5 text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">Public service checks are stored as separate records. Capabilities without a configured check show an unknown condition. Published incident updates are reported independently of these measurements.</p></section>
            <div className="flex flex-wrap gap-3 border-t border-[#d8d0c5] pt-8 dark:border-[#37342e]"><Link href="/" className="inline-flex min-h-11 items-center rounded-sm bg-[#252320] px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#fffefa] hover:bg-[#a9583e] dark:bg-[#f6f1e9] dark:text-[#211f1b]">← Current status</Link><Link href="/history" className="inline-flex min-h-11 items-center rounded-sm border border-[#d8d0c5] px-5 font-mono text-[10px] uppercase tracking-[0.1em] hover:border-[#a9583e] hover:text-[#a9583e] dark:border-[#4b463d]">Incident history ↗</Link></div>
          </div>
        </div>
      </div>
    </main>
    <StatusFooter />
  </div>;
}
