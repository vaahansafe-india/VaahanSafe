"use client";

import React from "react";
import { VaahanIcon } from "@vaahansafe/icons";
import type { ContactRoleType } from "@/lib/contacts-types";
import { ROLE_ICON_MAP } from "@/lib/contacts-roles";

export {
  ROLE_ICON_MAP,
  ROLE_DEFINITIONS,
  normalizeRelationshipToRole,
} from "@/lib/contacts-roles";

interface ContactRoleIconProps {
  role: ContactRoleType;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export function ContactRoleIcon({
  role,
  size = 18,
  className = "",
  "aria-hidden": ariaHidden = true,
}: ContactRoleIconProps) {
  const iconName = ROLE_ICON_MAP[role] || "user";

  return (
    <VaahanIcon
      name={iconName}
      size={size}
      className={className}
      aria-hidden={ariaHidden}
    />
  );
}
