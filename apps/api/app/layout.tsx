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
      <body style={{ fontFamily: "monospace", margin: 0, padding: "2rem", backgroundColor: "#0f172a", color: "#f8fafc" }}>
        {children}
      </body>
    </html>
  );
}
