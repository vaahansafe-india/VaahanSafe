import React from "react";
import Link from "next/link";

export function ActivationFooter() {
  return (
    <footer className="w-full border-t border-border bg-background/80 py-5 transition-colors">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        {/* Brand context label */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="font-bold text-foreground">VAAHANSAFE</span>
          <span>/</span>
          <span className="text-[#cc785c]">ACTIVATE</span>
          <span className="text-border">|</span>
          <span>© {new Date().getFullYear()} VaahanSafe</span>
        </div>

        {/* Minimal Legal & Status routes */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 text-[11px]">
          <Link href="https://vaahansafe.com/help" className="hover:text-foreground transition-colors">
            Help
          </Link>
          <Link href="https://vaahansafe.com/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="https://vaahansafe.com/safety" className="hover:text-foreground transition-colors">
            Safety
          </Link>
          <Link href="https://status.vaahansafe.com" className="hover:text-foreground transition-colors">
            Status
          </Link>
        </div>
      </div>
    </footer>
  );
}
