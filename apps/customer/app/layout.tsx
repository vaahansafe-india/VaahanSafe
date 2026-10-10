import type { Metadata } from "next";
import "@vaahansafe/ui/styles/core.css";
import "./customer-fonts.css";
import "./customer-paper.css";
import "@/features/document-vault/vault.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";
import { CustomerToaster } from "@/components/ui/CustomerToaster";

export const metadata: Metadata = {
  title: "Customer Portal — VaahanSafe",
  description:
    "Manage your vehicles, linked emergency contacts, and active QR safety stickers.",
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
    <html lang="en" suppressHydrationWarning className="overflow-x-clip">
      <body className="customer-surface min-h-screen w-full max-w-full overflow-x-clip bg-background font-sans antialiased text-foreground">
        <ThemeProvider forcedTheme="light" enableSystem={false}>
          {children}
          <CustomerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
