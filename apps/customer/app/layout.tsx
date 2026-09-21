import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";
import { Toaster } from "@vaahansafe/ui";

export const metadata: Metadata = {
  title: "Customer Portal — VaahanSafe",
  description: "Manage your vehicles, linked emergency contacts, and active QR safety stickers.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
