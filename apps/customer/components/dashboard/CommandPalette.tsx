"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon } from "@vaahansafe/icons";
import { Dialog, DialogContent } from "@vaahansafe/ui";
import type { DashboardVehicle, DashboardQrSticker } from "@/lib/dashboard-types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeVehicle: DashboardVehicle | null;
  qrSticker: DashboardQrSticker | null;
  onOpenVehicleSheet: () => void;
  onOpenQrSheet: () => void;
  onOpenSafetySheet: () => void;
  onOpenContactsSheet: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  activeVehicle,
  qrSticker,
  onOpenVehicleSheet,
  onOpenQrSheet,
  onOpenSafetySheet,
  onOpenContactsSheet,
}: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard shortcut listener for Ctrl+K / ⌘K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Reset search and selection whenever dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      // Ensure input focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const runCommand = React.useCallback(
    (action: () => void) => {
      onOpenChange(false);
      // Defer action execution slightly so Radix Dialog closes and restores body focus cleanly
      setTimeout(() => {
        action();
      }, 80);
    },
    [onOpenChange]
  );

  const commands = React.useMemo(() => [
    // Contextual Actions for Active Vehicle
    ...(activeVehicle
      ? [
          {
            id: "inspect-vehicle",
            category: "Active Vehicle",
            title: `Manage ${activeVehicle.registrationNumber}`,
            subtitle: `${activeVehicle.make} ${activeVehicle.model}`,
            icon: "vehicle" as const,
            action: onOpenVehicleSheet,
          },
          {
            id: "inspect-qr",
            category: "Active Vehicle",
            title: qrSticker ? `Inspect QR ${qrSticker.visibleCode}` : "Activate QR Sticker",
            subtitle: qrSticker ? `Status: ${qrSticker.status}` : "Bind a safety sticker to this vehicle",
            icon: "qr" as const,
            action: onOpenQrSheet,
          },
          {
            id: "edit-safety",
            category: "Active Vehicle",
            title: "Configure Public Safety View",
            subtitle: "Manage what passerby responders see on scan",
            icon: "shield" as const,
            action: onOpenSafetySheet,
          },
          {
            id: "edit-contacts",
            category: "Active Vehicle",
            title: "Manage Emergency Contacts",
            subtitle: "Priority phone recipients for incident alerts",
            icon: "phone" as const,
            action: onOpenContactsSheet,
          },
        ]
      : []),
    // Global Navigation
    {
      id: "nav-vehicles",
      category: "Navigation",
      title: "All Vehicles",
      subtitle: "View and manage vehicle fleet",
      icon: "vehicle" as const,
      action: () => router.push("/vehicles"),
    },
    {
      id: "nav-qr",
      category: "Navigation",
      title: "My QR Hub",
      subtitle: "Active stickers, replacements, and batches",
      icon: "qr" as const,
      action: () => router.push("/qr"),
    },
    {
      id: "nav-contacts",
      category: "Navigation",
      title: "Emergency Contacts",
      subtitle: "Alert priority settings",
      icon: "phone" as const,
      action: () => router.push("/emergency-contacts"),
    },
    {
      id: "nav-buy-qr",
      category: "Commerce",
      title: "Order New QR Sticker",
      subtitle: "Doorstep delivery across India",
      icon: "cart" as const,
      action: () => router.push("/qr/buy"),
    },
    {
      id: "nav-activate",
      category: "Activation",
      title: "Activate Retail QR Kit",
      subtitle: "Pair physical packaging code",
      icon: "scanner" as const,
      action: () => router.push("/qr/activate"),
    },
    {
      id: "nav-sub",
      category: "Billing",
      title: "Subscription & Protection Plan",
      subtitle: "Review vehicle coverage entitlements",
      icon: "receipt" as const,
      action: () => router.push("/subscription"),
    },
  ], [
    activeVehicle,
    qrSticker,
    onOpenVehicleSheet,
    onOpenQrSheet,
    onOpenSafetySheet,
    onOpenContactsSheet,
    router,
  ]);

  const filteredCommands = React.useMemo(() => {
    if (!search.trim()) return commands;
    const q = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, search]);

  // Reset selectedIndex whenever filtered commands change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Scroll selected item into view
  React.useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // Keyboard navigation handler for the search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredCommands.length > 0
          ? (prev - 1 + filteredCommands.length) % filteredCommands.length
          : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd) {
        runCommand(cmd.action);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-border bg-card shadow-2xl [&>button.absolute]:hidden">
        {/* Search Bar Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <VaahanIcon name="search" size={17} className="text-[#cc785c] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            title="Press ESC or click to close"
          >
            ESC
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => runCommand(cmd.action)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-[#cc785c]/10 text-foreground ring-1 ring-[#cc785c]/30"
                        : "hover:bg-muted text-foreground"
                    } focus:outline-none`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                          isSelected
                            ? "bg-[#cc785c] text-white"
                            : "bg-muted text-[#cc785c]"
                        }`}
                      >
                        <VaahanIcon name={cmd.icon} size={15} />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {cmd.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {cmd.subtitle}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      {cmd.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard Navigation Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>&bull;</span>
            <span>↵ to select</span>
            <span>&bull;</span>
            <span>esc to dismiss</span>
          </div>
          <span>VaahanSafe Command Surface</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

