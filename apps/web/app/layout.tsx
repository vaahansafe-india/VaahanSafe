import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import "./marketing.css";
import "./editorial.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";
import { discoveryOrigin } from "@vaahansafe/config";

export const metadata: Metadata = {
  title: "VaahanSafe — QR-Based Vehicle Safety & Emergency Identification Platform",
  description:
    "A QR-based vehicle safety identity for Indian roads. Connect a physical sticker to the safety information and contact options you choose to share.",
  metadataBase: new URL(discoveryOrigin("web")),
  alternates: {
    canonical: discoveryOrigin("web"),
  },
  openGraph: {
    title: "VaahanSafe — Vehicle Safety Identity Platform",
    description:
      "A physical QR connects your vehicle to an owner-controlled safety view and available contact options.",
    url: discoveryOrigin("web"),
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaahanSafe — Vehicle Safety Identity Platform",
    description:
      "QR-based vehicle identification, owner-controlled safety information and available contact options.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const origin = discoveryOrigin("web");
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VaahanSafe",
    url: origin,
    logo: `${origin}/logo.svg`,
    sameAs: [
      "https://x.com/vaahansafe",
      "https://www.linkedin.com/company/vaahansafe",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="VaahanSafe Journal" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary">
        {/* WCAG 2.2 AA Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-md focus:font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
