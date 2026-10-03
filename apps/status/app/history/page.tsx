import type { Metadata } from "next";
import Link from "next/link";
import { getStatusDatabaseClient, StatusRepository, type PublicIncidentDto } from "@vaahansafe/status-core/server";
import { StatusHeader } from "../../components/status/shell/StatusHeader";
import { StatusFooter } from "../../components/status/shell/StatusFooter";
import { IncidentHistory } from "../../components/status/incidents/IncidentHistory";

export const metadata: Metadata = {
  title: "Reliability & Incident History — VaahanSafe Status",
  description: "Published incident reports and resolution updates for VaahanSafe services.",
  alternates: { canonical: "https://status.vaahansafe.com/history" },
};

export const revalidate = 30;

export default async function HistoryPage() {
  let incidents: PublicIncidentDto[] = [];
  let sourceAvailable = true;
  try {
    incidents = await new StatusRepository(getStatusDatabaseClient()).getIncidentHistory(50);
  } catch {
    sourceAvailable = false;
    console.error("Status incident archive could not be read from Cloudflare D1");
  }

  return <div className="status-canvas flex min-h-screen flex-col text-[#252320] dark:text-[#f6f1e9]">
    <StatusHeader />
    <main id="main-content" className="w-full flex-1 pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-[#d8d0c5] py-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a8073] dark:border-[#37342e] dark:text-[#aaa297]"><Link href="/" className="hover:text-[#a9583e]">Status</Link><span className="mx-3">/</span>History</div>
        <header className="grid gap-8 border-b border-[#d8d0c5] py-12 sm:py-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,.4fr)] lg:items-end dark:border-[#37342e]">
          <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a9583e]">Public record / 02</p><h1 className="mt-4 max-w-3xl font-serif text-[clamp(2.8rem,7vw,5.7rem)] leading-[.98] tracking-tight">Reliability history.</h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-[#696157] sm:text-lg dark:text-[#b2aba0]">Published incident reports, service impact, and resolution updates in one chronological record.</p></div>
          <div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 dark:border-[#37342e] dark:bg-[#211f1b]"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a9583e]">Reading the archive</p><p className="mt-3 font-serif text-xl leading-snug">Every entry is a published incident.</p><p className="mt-3 text-xs leading-relaxed text-[#756e63] dark:text-[#b2aba0]">Daily checks appear on the current status page. An unrecorded day is never represented as a resolved incident.</p></div>
        </header>
        <div className="grid gap-10 pt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9583e]">Archive guide</p><p className="mt-4 text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">Reports are ordered by their start time. Open an entry to read its full public update timeline.</p><div className="mt-5 border-t border-[#d8d0c5] pt-5 dark:border-[#37342e]"><Link href="/methodology" className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#3f7462] underline underline-offset-4 hover:text-[#a9583e] dark:text-[#9bd8aa]">How we measure status ↗</Link></div></aside>
          <div className="min-w-0"><IncidentHistory incidents={incidents} sourceAvailable={sourceAvailable} /><div className="mt-14 flex flex-wrap gap-3 border-t border-[#d8d0c5] pt-8 dark:border-[#37342e]"><Link href="/" className="inline-flex min-h-11 items-center rounded-sm bg-[#252320] px-5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#fffefa] hover:bg-[#a9583e] dark:bg-[#f6f1e9] dark:text-[#211f1b]">← Current status</Link><Link href="/methodology" className="inline-flex min-h-11 items-center rounded-sm border border-[#d8d0c5] px-5 font-mono text-[10px] uppercase tracking-[0.1em] hover:border-[#a9583e] hover:text-[#a9583e] dark:border-[#4b463d]">Methodology ↗</Link></div></div>
        </div>
      </div>
    </main>
    <StatusFooter />
  </div>;
}
