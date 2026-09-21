"use client";

import * as React from "react";
import { VaahanIcon } from "@vaahansafe/icons";

interface SettingsMobileHeaderProps {
  onBack: () => void;
  categoryTitle: string;
}

export function SettingsMobileHeader({
  onBack,
  categoryTitle,
}: SettingsMobileHeaderProps) {
  return (
    <div className="lg:hidden sticky top-0 z-20 flex items-center gap-2 border-b border-border/80 bg-background/95 backdrop-blur-xs py-3 px-1 -mx-1 mb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-mono font-medium text-[#cc785c] hover:underline"
      >
        <VaahanIcon name="chevron-left" size={16} />
        <span>Settings</span>
      </button>
      <span className="text-muted-foreground text-xs">/</span>
      <span className="text-xs font-semibold text-foreground truncate">
        {categoryTitle}
      </span>
    </div>
  );
}
