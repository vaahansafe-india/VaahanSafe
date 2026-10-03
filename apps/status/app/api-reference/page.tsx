import type { Metadata } from "next";
import Link from "next/link";
import { StatusHeader } from "../../components/status/shell/StatusHeader";
import { StatusFooter } from "../../components/status/shell/StatusFooter";

export const metadata: Metadata = {
  title: "Status API — VaahanSafe Status",
  description: "Reference for the public VaahanSafe system status JSON endpoint.",
  alternates: { canonical: "https://status.vaahansafe.com/api-reference" },
};

const fields = [
  { name: "overallState", purpose: "Current aggregate service condition." },
  { name: "headline / description", purpose: "Plain-language summary of the current condition." },
  { name: "generatedAt / isStale", purpose: "Response timestamp and freshness signal." },
  { name: "services", purpose: "Public capabilities, their current states, and available probe details." },
  { name: "serviceHistories", purpose: "Ninety daily marks per service with actual recorded check counts." },
  { name: "activeIncidents / activeMaintenance", purpose: "Published current events and planned windows." },
  { name: "databaseHeartbeat", purpose: "Direct database status and scheduled heartbeat details, when available." },
];

export default function ApiReferencePage() {
  return <div className="status-canvas flex min-h-screen flex-col text-[#252320] dark:text-[#f6f1e9]">
    <StatusHeader />
    <main id="main-content" className="w-full flex-1 pb-16 sm:pb-24">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-[#d8d0c5] py-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8a8073] dark:border-[#37342e] dark:text-[#aaa297]"><Link href="/" className="hover:text-[#a9583e]">Status</Link><span className="mx-3">/</span>API reference</div>
        <header className="grid gap-8 border-b border-[#d8d0c5] py-12 sm:py-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,.5fr)] lg:items-end dark:border-[#37342e]">
          <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a9583e]">Developer reference / 03</p><h1 className="mt-4 font-serif text-[clamp(2.8rem,7vw,5.7rem)] leading-[.98] tracking-tight">Status, in data.</h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-[#696157] sm:text-lg dark:text-[#b2aba0]">Use the public JSON response to read the same service conditions and recorded checks shown on this page.</p></div>
          <div className="rounded-sm border border-[#d8d0c5] bg-[#fffefa] p-5 dark:border-[#37342e] dark:bg-[#211f1b]"><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#a9583e]">Endpoint</p><code className="mt-3 block break-all font-mono text-sm text-[#252320] dark:text-[#f6f1e9]">GET /api/status</code><p className="mt-3 text-xs leading-relaxed text-[#756e63] dark:text-[#b2aba0]">Public read-only JSON · 30-second cache with stale-while-revalidate</p><Link href="/api/status" className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-[#252320] px-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[#fffefa] hover:bg-[#a9583e] dark:bg-[#f6f1e9] dark:text-[#211f1b]">Open raw JSON ↗</Link></div>
        </header>
        <div className="grid gap-10 pt-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a9583e]">Using this feed</p><p className="mt-4 text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">Check <code className="font-mono">isStale</code> and <code className="font-mono">generatedAt</code> before treating a response as current. Unknown conditions and unrecorded days should stay unknown in downstream displays.</p><Link href="/methodology" className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.1em] text-[#3f7462] underline underline-offset-4 hover:text-[#a9583e] dark:text-[#9bd8aa]">Read methodology ↗</Link></aside>
          <section aria-labelledby="fields-heading" className="min-w-0"><div className="border-t border-[#d8d0c5] pt-6 dark:border-[#37342e]"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a9583e]">Response guide</p><h2 id="fields-heading" className="mt-3 font-serif text-3xl sm:text-4xl">What the response contains</h2><p className="mt-4 text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">Fields are generated from live reporting sources. Optional telemetry can be absent when its source cannot be read.</p></div><div className="mt-7 overflow-hidden rounded-sm border border-[#d8d0c5] bg-[#fffefa] dark:border-[#37342e] dark:bg-[#211f1b]">{fields.map(field => <div key={field.name} className="grid gap-2 border-b border-[#e8e2d7] px-5 py-4 last:border-0 sm:grid-cols-[220px_1fr] dark:border-[#37342e]"><code className="break-words font-mono text-xs text-[#a9583e]">{field.name}</code><p className="text-sm leading-relaxed text-[#756e63] dark:text-[#b2aba0]">{field.purpose}</p></div>)}</div><div className="mt-7 rounded-sm border-l-2 border-[#a9583e] bg-[#f5f0e8] p-5 dark:bg-[#292620]"><p className="font-serif text-lg">When reporting cannot be confirmed</p><p className="mt-2 text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">The API may return an error response with an unknown condition and a stale flag. Consumers should surface that uncertainty instead of displaying a healthy state.</p></div></section>
        </div>
      </div>
    </main>
    <StatusFooter />
  </div>;
}
