import type { Metadata, Viewport } from "next";
import "@vaahansafe/ui/styles/globals.css";
import "./activate.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";

export const metadata: Metadata = {
  title: "Activate QR | VaahanSafe",
  description: "Securely bind your physical VaahanSafe QR to your vehicle identity.",
  icons: {
    icon: [
      { url: "/icons/vaahansafe-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/vaahansafe-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/vaahansafe-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/vaahansafe-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF9F5" },
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function ActivateRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary">
        {/* WCAG 2.2 AA Skip Navigation Landmark */}
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
