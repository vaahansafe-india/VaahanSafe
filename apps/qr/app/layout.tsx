import type { Metadata, Viewport } from "next";
import "@vaahansafe/ui/styles/core.css";
import "./qr-paper.css";
import { ThemeProvider } from "@vaahansafe/ui/theme/theme-provider";
import { SmoothScrollHandler } from "../components/shell/SmoothScrollHandler";

export const metadata: Metadata = {
  title: "Vehicle Safety Identity — VaahanSafe Resolver",
  description:
    "Official public emergency vehicle profile and safety resolver runtime.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#181715" },
  ],
};

export default function QrRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="qr-paper min-h-screen font-sans antialiased text-foreground">
        <ThemeProvider defaultTheme="light">
          <SmoothScrollHandler />
          <a href="#main-content" className="qr-skip-link">
            Skip to content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
