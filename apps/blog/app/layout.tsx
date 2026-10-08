import type { Metadata, Viewport } from "next";
import "@vaahansafe/ui/styles/core.css";
import "./journal-paper.css";
import { ThemeProvider } from "@vaahansafe/ui/theme/theme-provider";
import { Toaster } from "@vaahansafe/ui/components/sonner";
import { NetworkStatusProvider } from "../components/system/NetworkStatusProvider";

export const viewport: Viewport = {
  themeColor: "#FAF9F5",
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  title: "VaahanSafe Journal — Safety Guides & Vehicle Identity",
  description:
    "Guides for the road, the vehicle, and the identity. Field notes on roadside emergency protocols and digital vehicle safety.",
  metadataBase: new URL("https://blog.vaahansafe.com"),
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "VaahanSafe Journal — Safety Guides & Vehicle Identity",
    description: "Guides for the road, the vehicle, and the identity.",
    url: "https://blog.vaahansafe.com",
    type: "website",
  },
  alternates: {
    canonical: "https://blog.vaahansafe.com",
  },
};

export default function BlogRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-clip" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="VaahanSafe Journal" />
      </head>
      <body className="journal-paper min-h-screen">
        <ThemeProvider defaultTheme="light">
          <NetworkStatusProvider>
            <a className="journal-skip-link" href="#main-content">
              Skip to content
            </a>
            {children}
            <Toaster />
          </NetworkStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
