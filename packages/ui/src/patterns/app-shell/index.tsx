"use client";

import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { ThemeToggle } from "../../theme/theme-toggle";
import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { Sheet, SheetContent, SheetTrigger } from "../../components/sheet";
import { VaahanSafeLogo } from "../../brand/VaahanSafeLogo";

export interface NavItem {
  label: string;
  href: string;
  icon?: VaahanIconName;
  active?: boolean;
}

export interface AppShellProps {
  appName: string;
  appDescription?: string;
  navItems?: NavItem[];
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
  };
  actions?: React.ReactNode;
  showSidebar?: boolean;
}

export function AppShell({
  appName,
  appDescription,
  navItems = [],
  children,
  user: _user,
  actions,
  showSidebar = false,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            {showSidebar && navItems.length > 0 && (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <VaahanIcon name="menu" size={20} />
                    <span className="sr-only">Toggle Navigation</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="p-6 border-b flex items-center gap-2.5">
                    <div>
                      <VaahanSafeLogo size="sm" />
                      <div className="text-xs text-muted-foreground">
                        {appName}
                      </div>
                    </div>
                  </div>
                  <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                          item.active
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.icon && <VaahanIcon name={item.icon} size={18} />}
                        <span>{item.label}</span>
                      </a>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}

            <VaahanSafeLogo href="/" size="sm" />

            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-border">
              <Badge variant="outline" className="text-xs font-medium">
                {appName}
              </Badge>
              {process.env.NODE_ENV === "development" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  DEV
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex container mx-auto max-w-7xl px-4 sm:px-8">
        {/* Desktop Sidebar (Optional) */}
        {showSidebar && navItems.length > 0 && (
          <aside className="hidden md:block w-60 shrink-0 border-r py-6 pr-6">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    item.active
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon && <VaahanIcon name={item.icon} size={18} />}
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          </aside>
        )}

        {/* Page Content */}
        <main
          id="main-content"
          className={`flex-1 py-8 ${showSidebar ? "md:pl-8" : ""}`}
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 bg-muted/20 text-xs text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">VaahanSafe</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>&bull;</span>
            <span>{appDescription || appName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Edge Network Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
