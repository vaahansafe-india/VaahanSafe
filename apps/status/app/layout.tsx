import type { Metadata, Viewport } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";
import { Toaster } from "@vaahansafe/ui";
import { NetworkStatusProvider } from "../components/status/NetworkStatusProvider";

export const viewport: Viewport = {
  themeColor: "#FAF9F5",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VaahanSafe Service Status & System Pulse",
  description:
    "Official real-time operational status, customer journey health, and incident timeline for the VaahanSafe platform across India.",
  metadataBase: new URL("https://status.vaahansafe.com"),
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "VaahanSafe Service Status & System Pulse",
    description: "Official real-time operational status and customer journey health for VaahanSafe.",
    url: "https://status.vaahansafe.com",
    type: "website",
  },
  alternates: {
    canonical: "https://status.vaahansafe.com",
  },
};

export default function StatusRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-clip" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-clip bg-[#faf9f5] font-sans antialiased text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
        <ThemeProvider>
          <NetworkStatusProvider>
            {children}
            <Toaster />
          </NetworkStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
