import type { Metadata } from "next";
import "@vaahansafe/ui/styles/globals.css";
import "aos/dist/aos.css";
import "./admin-paper.css";
import '../features/inventory/inventory.css';
import '../features/inventory/inventory-record.css';
import '../features/batches/batches.css';
import '../features/distributors/distributors.css';
import '../features/retailers/retailers.css';
import '../components/admin-dialog.css';
import { Toaster } from "@vaahansafe/ui/components/sonner";
import { AdminMotion } from "../components/AdminMotion";
import { AdminLayoutClient } from "../components/AdminLayoutClient";
import { getAdminIdentity } from "../lib/session";

export const metadata: Metadata = {
  title: "Operations Console — VaahanSafe Admin",
  description:
    "Internal VaahanSafe platform administration and QR fleet operations.",
  icons: {
    icon: {
      url: "/favicon.svg?v=vaahansafe-20261004",
      type: "image/svg+xml",
      sizes: "any",
    },
    shortcut: "/favicon.ico?v=vaahansafe-20261004",
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let identity = null;
  try {
    identity = await getAdminIdentity();
  } catch {
    /* Protected pages report a recoverable error. */
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AdminMotion />
        <AdminLayoutClient identity={identity}>{children}</AdminLayoutClient>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
