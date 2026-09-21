"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@vaahansafe/ui";
import type { ContactRoleType } from "@/lib/contacts-types";
import { ROLE_DEFINITIONS, ContactRoleIcon } from "./ContactRoleIcon";

interface ContactRoleSelectorProps {
  selectedRole: ContactRoleType;
  onSelectRole: (role: ContactRoleType) => void;
  disabled?: boolean;
}

export function ContactRoleSelector({
  selectedRole,
  onSelectRole,
  disabled = false,
}: ContactRoleSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const currentDef = ROLE_DEFINITIONS.find((r) => r.type === selectedRole) ?? ROLE_DEFINITIONS[0]!;

  const filteredRoles = React.useMemo(() => {
    if (!search.trim()) return ROLE_DEFINITIONS;
    const q = search.toLowerCase();
    return ROLE_DEFINITIONS.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.descriptor.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="w-full space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-expanded={open}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 text-left text-sm transition-colors hover:border-[#cc785c]/60 focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5f0e8] text-foreground dark:bg-[#252320]">
                <ContactRoleIcon role={selectedRole} size={15} />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{currentDef.label}</span>
                <span className="text-[11px] text-muted-foreground">{currentDef.descriptor}</span>
              </div>
            </div>
            <VaahanIcon
              name="chevron-down"
              size={14}
              className={`text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[320px] sm:w-[360px] p-0 shadow-lg border border-border bg-popover rounded-2xl overflow-hidden"
        >
          {/* Header & Search */}
          <div className="p-3 border-b border-border/60 bg-muted/20">
            <div className="relative">
              <VaahanIcon
                name="search"
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search safety roles..."
                className="h-8 w-full rounded-lg bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground border border-input focus:border-[#cc785c] focus:outline-none"
              />
            </div>
          </div>

          {/* Role List */}
          <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-0.5">
            {filteredRoles.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching safety roles found.
              </div>
            ) : (
              filteredRoles.map((r) => {
                const isSelected = r.type === selectedRole;
                return (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => {
                      onSelectRole(r.type);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                      isSelected
                        ? "bg-[#cc785c]/10 text-[#cc785c]"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? "border-[#cc785c]/40 bg-[#cc785c]/15 text-[#cc785c]"
                            : "border-border/60 bg-[#f5f0e8] text-foreground dark:bg-[#252320]"
                        }`}
                      >
                        <ContactRoleIcon role={r.type} size={15} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">{r.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {r.descriptor}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <VaahanIcon name="check" size={14} className="text-[#cc785c] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
