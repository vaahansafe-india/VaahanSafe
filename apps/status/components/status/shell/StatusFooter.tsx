import Link from "next/link";
import { getWebUrl } from "@vaahansafe/config";

const internalLinks = [
  { href: "/methodology", label: "Methodology", detail: "How status is measured" },
  { href: "/history", label: "Reliability history", detail: "Published incidents" },
  { href: "/api-reference", label: "Status API", detail: "Response guide" },
  { href: "/api/status", label: "Raw JSON", detail: "Live status data" },
] as const;

const linkClass = "group flex min-h-12 items-center justify-between gap-4 border-b border-[#d8d0c5] py-3 text-[#252320] outline-none hover:text-[#a9583e] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#a9583e] dark:border-[#4b463d] dark:text-[#f6f1e9] dark:hover:text-[#e39b7c]";

export function StatusFooter() {
  const rawWebUrl = getWebUrl();
  const webUrl = rawWebUrl === "https://vaahansafe.com" ? "https://www.vaahansafe.com" : rawWebUrl;

  return (
    <footer className="w-full border-t border-[#d8d0c5] bg-[#f5f0e8]/65 dark:border-[#37342e] dark:bg-[#201e1a]">
      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-12 lg:px-8">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9583e]">VaahanSafe / Status</p>
          <p className="mt-2 max-w-sm font-serif text-xl leading-tight text-[#252320] sm:text-2xl dark:text-[#f6f1e9]">A public record of service reliability.</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#696157] dark:text-[#b2aba0]">Current service conditions and published incident reports.</p>
        </div>

        <nav aria-label="Status resources" className="grid min-w-0 gap-x-8 sm:grid-cols-2">
          {internalLinks.map((item) => (
            <Link key={item.href} href={item.href} prefetch={false} className={linkClass}>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-xs text-[#696157] dark:text-[#b2aba0]">{item.detail}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 font-mono text-sm">→</span>
            </Link>
          ))}
          <a href={`${webUrl}/privacy`} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="Privacy policy on the VaahanSafe website, opens in a new tab">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Privacy policy</span>
              <span className="block text-xs text-[#696157] dark:text-[#b2aba0]">VaahanSafe website</span>
            </span>
            <span aria-hidden="true" className="shrink-0 font-mono text-sm">↗</span>
          </a>
        </nav>
      </div>
      <div className="border-t border-[#d8d0c5] dark:border-[#37342e]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-x-6 gap-y-1 px-4 py-4 font-mono text-[10px] leading-relaxed text-[#696157] sm:px-6 lg:px-8 dark:text-[#b2aba0]">
          <span suppressHydrationWarning>© {new Date().getFullYear()} VaahanSafe Technologies Private Limited</span>
          <span>Times shown in India Standard Time</span>
        </div>
      </div>
    </footer>
  );
}
