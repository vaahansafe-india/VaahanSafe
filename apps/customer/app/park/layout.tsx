import type { Metadata, Viewport } from "next";
import "@/features/park/park.css";
import "@/features/park/atlas.css";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3eb",
};
export const metadata: Metadata = {
  manifest: "/images/park/manifest.webmanifest",
  icons: {
    icon: [{ url: "/images/park/icon.svg", type: "image/svg+xml" }],
    shortcut: "/images/park/icon.svg",
    apple: [
      { url: "/images/park/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: { index: false, follow: false },
};
export default function ParkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
