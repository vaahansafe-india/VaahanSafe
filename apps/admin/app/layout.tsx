import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";

export const metadata: Metadata = {
  title: "Operations Console — VaahanSafe Admin",
  description: "Internal VaahanSafe platform administration and QR fleet operations.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
