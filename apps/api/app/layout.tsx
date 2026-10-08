import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VaahanSafe Central API",
  description: "Central application backend API surface for VaahanSafe.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ApiRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          padding: "2.5rem 1.5rem",
          backgroundColor: "#FAF9F5",
          color: "#252320",
          minHeight: "100vh",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </body>
    </html>
  );
}
