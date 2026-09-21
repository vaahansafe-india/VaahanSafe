import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import { ThemeProvider } from "@vaahansafe/ui/theme";

export const metadata: Metadata = {
  title: "Activate Sticker — VaahanSafe",
  description: "Activate your physical retail VaahanSafe QR safety sticker.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActivateRootLayout({
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
