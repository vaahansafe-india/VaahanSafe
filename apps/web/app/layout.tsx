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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="VaahanSafe Journal" />
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
