import Link from "next/link";
import { Button } from "@vaahansafe/ui/components";
import { VaahanIcon } from "@vaahansafe/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <header className="border-b border-border py-4 px-6 bg-background">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <VaahanIcon name="shield" size={24} className="text-primary" />
            <span>VaahanSafe</span>
          </div>
          <Button asChild variant="outline" size="sm" className="bg-background hover:bg-muted text-foreground border border-border rounded-md">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main id="main-content" className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-muted border border-border text-primary mx-auto">
            <VaahanIcon name="alert" size={30} className="text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif font-normal text-3xl sm:text-4xl text-foreground tracking-[-1px]">Page not found</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The page you are looking for does not exist, has been relocated, or requires authentication.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild className="w-full sm:w-auto h-10 px-5 bg-primary hover:bg-[#a9583e] text-white font-medium rounded-md shadow-xs">
              <Link href="/dashboard">
                <VaahanIcon name="home" size={16} className="mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto h-10 px-5 bg-background hover:bg-muted text-foreground border border-border font-medium rounded-md">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground bg-background">
        &copy; {new Date().getFullYear()} VaahanSafe. All rights reserved.
      </footer>
    </div>
  );
}
