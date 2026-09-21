import type { Metadata } from "next";
import { SiteHeader } from "../../components/marketing/site-header";
import { SiteFooter } from "../../components/marketing/site-footer";
import { HelpCenterContainer } from "../../components/help/HelpCenterContainer";

export const metadata: Metadata = {
  title: "Help Center | VaahanSafe",
  description:
    "Find guidance for your VaahanSafe vehicle identity, QR, activation, safety information, account and related services.",
  openGraph: {
    title: "VaahanSafe Help Center — Action & Resolution Guide",
    description:
      "Find guidance for your VaahanSafe vehicle identity, QR, activation, safety information, account and related services.",
    url: "https://vaahansafe.com/help",
    type: "website",
  },
  alternates: {
    canonical: "https://vaahansafe.com/help",
  },
};

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "VaahanSafe Help Center",
    description:
      "Action-oriented support and guidance directory for VaahanSafe vehicle safety identities.",
    url: "https://vaahansafe.com/help",
    publisher: {
      "@type": "Organization",
      name: "VaahanSafe",
      url: "https://vaahansafe.com",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <HelpCenterContainer />
      </main>

      <SiteFooter />
    </div>
  );
}
