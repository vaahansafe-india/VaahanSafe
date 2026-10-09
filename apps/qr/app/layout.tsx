import type { Metadata, Viewport } from "next";
import "@vaahansafe/ui/styles/core.css";
import "./qr-paper.css";
import { ThemeProvider } from "@vaahansafe/ui/theme/theme-provider";
import { SmoothScrollHandler } from "../components/shell/SmoothScrollHandler";

export const metadata: Metadata = {
  metadataBase: new URL("https://qr.vaahansafe.com"),
  title: {
    default: "VaahanSafe QR — Vehicle Safety Identity Platform",
    template: "%s | VaahanSafe QR",
  },
  description:
    "Official public vehicle safety identity platform and emergency contact relay runtime.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.webmanifest",
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
