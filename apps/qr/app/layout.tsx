import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";

export const metadata: Metadata = {
  title: "QR Safety Resolver — VaahanSafe",
  description: "Permanent emergency vehicle profile and safety resolver.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QrRootLayout({
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
