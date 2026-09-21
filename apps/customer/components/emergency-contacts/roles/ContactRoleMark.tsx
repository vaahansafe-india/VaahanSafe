"use client";

import React from "react";
import type { ContactRoleType } from "@/lib/contacts-types";
import { ContactRoleIcon, ROLE_DEFINITIONS } from "./ContactRoleIcon";

interface ContactRoleMarkProps {
  role: ContactRoleType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  isPrimary?: boolean;
}

export function ContactRoleMark({
  role,
  size = "md",
  showLabel = false,
  className = "",
  isPrimary = false,
}: ContactRoleMarkProps) {
  const definition = ROLE_DEFINITIONS.find((d) => d.type === role) || {
    type: role,
    label: role,
    descriptor: "",
  };

  const dimensions = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
  }[size];

  const iconSizes = {
    sm: 15,
    md: 18,
    lg: 20,
  }[size];

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-2xl border transition-colors ${dimensions} ${
          isPrimary
            ? "border-[#cc785c]/40 bg-[#cc785c]/10 text-[#cc785c] shadow-xs"
            : "border-border/70 bg-[#f5f0e8] text-[#3d3d3a] dark:bg-[#252320] dark:text-[#faf9f5]"
        }`}
        title={`Safety Role: ${definition.label}`}
        aria-label={`Role: ${definition.label}`}
      >
        <ContactRoleIcon
          role={role}
          size={iconSizes}
          className={isPrimary ? "text-[#cc785c]" : "text-foreground"}
        />
        {isPrimary && (
          <span
            className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#cc785c] ring-2 ring-card"
            aria-label="Primary contact"
            title="Primary contact"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        )}
      </div>

      {showLabel && (
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {definition.label}
        </span>
      )}
    </div>
  );
}
