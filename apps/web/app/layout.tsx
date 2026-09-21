import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";

export const metadata: Metadata = {
  title: "VaahanSafe — QR-Based Vehicle Safety & Emergency Identification Platform",
  description:
    "India's dedicated vehicle safety identity platform. Permanent QR identification, immediate emergency contact relays, and owner-controlled safety profiles.",
  metadataBase: new URL("https://vaahansafe.com"),
  alternates: {
    canonical: "https://vaahansafe.com",
  },
  openGraph: {
    title: "VaahanSafe — Vehicle Safety Identity Platform",
    description:
      "A permanent QR connects your vehicle to a controlled emergency profile, approved contacts, and the VaahanSafe safety network.",
    url: "https://vaahansafe.com",
    siteName: "VaahanSafe",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VaahanSafe — Vehicle Safety Identity Platform",
    description:
      "Permanent QR identification, immediate emergency contact relays, and owner-controlled safety profiles.",
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
