"use client";

import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Input } from "@vaahansafe/ui";
import type { SettingsCategory } from "@/lib/settings-types";

interface SearchIndexItem {
  title: string;
  category: SettingsCategory;
  categoryLabel: string;
  icon: VaahanIconName;
  keywords: string;
}

const SEARCH_INDEX: SearchIndexItem[] = [
  {
    title: "Personal Profile & Name",
    category: "profile",
    categoryLabel: "Profile",
    icon: "user",
    keywords: "name owner identity full name photo avatar",
  },
  {
    title: "Verified Mobile Number",
    category: "profile",
    categoryLabel: "Profile",
    icon: "phone",
    keywords: "phone mobile number otp sms verify change",
  },
  {
    title: "Google Connected Account",
    category: "profile",
    categoryLabel: "Profile",
    icon: "mail",
    keywords: "google email oauth signin connect",
  },
  {
    title: "Account Identifier & Timezone",
    category: "account",
    categoryLabel: "Account",
    icon: "id-card",
    keywords: "account id timezone reference region ist",
  },
  {
    title: "Notification Matrix & Channels",
    category: "notifications",
    categoryLabel: "Notifications",
    icon: "notification",
    keywords: "notifications whatsapp email in-app alerts updates dispatch",
  },
  {
    title: "Color Theme & Motion",
    category: "appearance",
    categoryLabel: "Appearance",
    icon: "palette",
    keywords: "theme dark light appearance contrast reduce motion",
  },
  {
    title: "Public Safety View & Privacy Controls",
    category: "privacy",
    categoryLabel: "Safety & Privacy",
    icon: "shield",
    keywords: "privacy safety blood group medical notes preview projection qr",
  },
  {
    title: "Vehicle Fleet & Default Car",
    category: "vehicles",
    categoryLabel: "Vehicle Preferences",
    icon: "car",
    keywords: "vehicle fleet registration model make default car",
  },
  {
    title: "Active Browser Sessions",
    category: "security",
    categoryLabel: "Security & Sessions",
    icon: "lock",
    keywords: "sessions devices security logout revoke signout browser httponly",
  },
  {
    title: "Download Your Account Data",
    category: "data",
    categoryLabel: "Data & Privacy",
    icon: "database",
    keywords: "data export download archive retention gdpr dpdp",
  },
  {
    title: "Permanently Close Account",
    category: "data",
    categoryLabel: "Data & Privacy",
    icon: "warning",
    keywords: "delete close account danger terminate",
  },
];

interface SettingsSearchProps {
  onSelectCategory: (cat: SettingsCategory) => void;
  className?: string;
}

export function SettingsSearch({ onSelectCategory, className = "" }: SettingsSearchProps) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
    );
  }, [query]);

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <VaahanIcon name="search" size={14} />
        </span>
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search settings..."
          className="h-8 pl-8 pr-3 text-xs bg-muted/30 border-border/70 focus:border-[#cc785c] focus:bg-background"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <VaahanIcon name="close" size={12} />
          </button>
        )}
      </div>

      {/* Instant Match Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-popover p-1 shadow-lg backdrop-blur-xs max-h-64 overflow-y-auto">
          {results.length > 0 ? (
            <div className="space-y-0.5">
              {results.map((item) => (
                <button
                  key={`${item.category}-${item.title}`}
                  type="button"
                  onClick={() => {
                    onSelectCategory(item.category);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="text-muted-foreground">
                      <VaahanIcon name={item.icon} size={14} />
                    </div>
                    <span className="text-foreground font-medium truncate">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground shrink-0 rounded bg-muted/60 px-1.5 py-0.5">
                    {item.categoryLabel}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No matching settings found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
