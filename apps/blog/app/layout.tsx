import type { Metadata, Viewport } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";
import { Toaster } from "@vaahansafe/ui";
import { ClientErrorSanitizer } from "../components/journal/ClientErrorSanitizer";
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
      <body className="min-h-screen overflow-x-clip bg-[#faf9f5] font-sans antialiased text-[#141413] dark:bg-[#181715] dark:text-[#faf9f5]">
        <ThemeProvider>
          <NetworkStatusProvider>
            <ClientErrorSanitizer />
            {children}
            <Toaster />
          </NetworkStatusProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
