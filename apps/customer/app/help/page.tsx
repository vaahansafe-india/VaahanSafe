import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedCustomer } from "@/lib/session";
import { CustomerQueryProvider } from "@/components/query/CustomerQueryProvider";
import { CustomerQueryShell } from "@/components/query/CustomerQueryShell";
import { HelpCenterView } from "@/components/help/HelpCenterView";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

export const metadata: Metadata = {
  title: "Help & Support — VaahanSafe Automotive Safety",
  description:
    "Official customer support and knowledgebase for VaahanSafe orders, QR hardware, courier delivery, and emergency safety routing.",
};

export const dynamic = "force-dynamic";

export default async function HelpPage() {
  const auth = await getAuthenticatedCustomer();

  if (auth) {
    const { user } = auth;
    const scope = `${user.id}:${auth.session.id}`;

    return (
      <CustomerQueryProvider key={scope} scope={scope}>
        <CustomerQueryShell
          userName={user.name}
          userPhone={user.phone}
          userEmail={user.email}
          phoneVerified={auth.phoneVerified}
          googleVerified={auth.googleVerified}
        >
          <HelpCenterView userEmail={user.email} userName={user.name} />
        </CustomerQueryShell>
      </CustomerQueryProvider>
    );
  }

  // Unauthenticated Public View
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border py-4 px-6 bg-background/95 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg text-foreground hover:opacity-90"
          >
            <VaahanIcon name="shield" size={24} className="text-[#cc785c]" />
            <span className="font-serif font-bold tracking-tight">
              VaahanSafe
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="font-mono text-xs border-border"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
        <HelpCenterView />
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-background">
        &copy; {new Date().getFullYear()} VaahanSafe Technologies India Pvt Ltd.
        All rights reserved.
      </footer>
    </div>
  );
}
