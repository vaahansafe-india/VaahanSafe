"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@vaahansafe/ui/components/command";
import { ADMIN_MODULES, canReadModule } from "../lib/modules";
import type { AdminIdentity } from "../lib/contracts";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identity: AdminIdentity;
}

const MODULE_PRIORITY: Record<string, number> = {
  dashboard: 1,
  search: 2,
  inventory: 10,
  batches: 11,
  distributors: 12,
  retailers: 13,
  transfers: 14,
  reconciliation: 15,
  customers: 20,
  vehicles: 21,
  orders: 22,
  shipping: 23,
  activations: 24,
  subscriptions: 25,
  plans: 26,
  payments: 27,
  refunds: 28,
  replacements: 30,
  support: 31,
  fraud: 32,
  analytics: 40,
  notifications: 41,
  incidents: 42,
  reports: 43,
  audit: 44,
  articles: 50,
  documents: 51,
  gallery: 52,
  flags: 60,
  settings: 61,
};

export function CommandPalette({
  open,
  onOpenChange,
  identity,
}: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    setSearch("");
    callback();
  };

  const accessibleModules = [...ADMIN_MODULES]
    .filter((m) => canReadModule(identity.role, m.key))
    .sort(
      (a, b) => (MODULE_PRIORITY[a.key] ?? 99) - (MODULE_PRIORITY[b.key] ?? 99)
    );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search operational records…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No matching navigation or commands.</CommandEmpty>

        {search.trim().length > 0 && (
          <CommandGroup heading="Search In Workspace">
            <CommandItem
              onSelect={() =>
                handleSelect(() =>
                  router.push(`/search?q=${encodeURIComponent(search.trim())}`)
                )
              }
            >
              <VaahanIcon name="search" size={14} className="mr-2 opacity-70" />
              <span>Search all records for &ldquo;{search.trim()}&rdquo;</span>
            </CommandItem>

            <CommandItem
              onSelect={() =>
                handleSelect(() =>
                  router.push(
                    `/search?q=${encodeURIComponent(search.trim())}&scope=qr`
                  )
                )
              }
            >
              <VaahanIcon name="qr" size={14} className="mr-2 opacity-70" />
              <span>Search QR Identities for &ldquo;{search.trim()}&rdquo;</span>
            </CommandItem>

            <CommandItem
              onSelect={() =>
                handleSelect(() =>
                  router.push(
                    `/search?q=${encodeURIComponent(search.trim())}&scope=vehicle`
                  )
                )
              }
            >
              <VaahanIcon name="vehicle" size={14} className="mr-2 opacity-70" />
              <span>Search Vehicles for &ldquo;{search.trim()}&rdquo;</span>
            </CommandItem>

            <CommandItem
              onSelect={() =>
                handleSelect(() =>
                  router.push(
                    `/search?q=${encodeURIComponent(search.trim())}&scope=order`
                  )
                )
              }
            >
              <VaahanIcon name="file" size={14} className="mr-2 opacity-70" />
              <span>Search Orders for &ldquo;{search.trim()}&rdquo;</span>
            </CommandItem>

            <CommandItem
              onSelect={() =>
                handleSelect(() =>
                  router.push(
                    `/search?q=${encodeURIComponent(search.trim())}&scope=batch`
                  )
                )
              }
            >
              <VaahanIcon name="layers" size={14} className="mr-2 opacity-70" />
              <span>Search Batches for &ldquo;{search.trim()}&rdquo;</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          {accessibleModules.map((m) => (
            <CommandItem
              key={m.key}
              value={`${m.label} ${m.group} ${m.key}`}
              onSelect={() =>
                handleSelect(() =>
                  router.push(m.key === "dashboard" ? "/" : `/${m.key}`)
                )
              }
            >
              <VaahanIcon name={m.icon} size={14} className="mr-2 opacity-70" />
              <span>{m.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {m.group}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Switch">
          <CommandItem
            onSelect={() => handleSelect(() => router.push("/search"))}
          >
            <VaahanIcon name="search" size={14} className="mr-2 opacity-70" />
            <span>Open Global Search Workspace</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
