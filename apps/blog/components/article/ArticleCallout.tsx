import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { ArticleCallout as CalloutType } from "@vaahansafe/content";

interface ArticleCalloutProps {
  callout: CalloutType;
}

export function ArticleCallout({ callout }: ArticleCalloutProps) {
  let iconName: VaahanIconName = "info";
  let railColor = "border-l-[#cc785c]";
  let labelColor = "text-[#cc785c]";
  let typeLabel = "NOTE";

  switch (callout.type) {
    case "warning":
    case "safety":
      iconName = "alert";
      railColor = "border-l-[#e8a55a]";
      labelColor = "text-[#e8a55a]";
      typeLabel = "SAFETY";
      break;
    case "statute":
      iconName = "shield";
      railColor = "border-l-[#5db872]";
      labelColor = "text-[#5db872]";
      typeLabel = "STATUTORY IMMUNITY";
      break;
    case "privacy":
      iconName = "shield";
      railColor = "border-l-[#5db8a6]";
      labelColor = "text-[#5db8a6]";
      typeLabel = "PRIVACY";
      break;
    case "important":
      iconName = "alert";
      railColor = "border-l-[#cc785c]";
      labelColor = "text-[#cc785c]";
      typeLabel = "IMPORTANT";
      break;
    default:
      iconName = "info";
      railColor = "border-l-[#8e8b82]";
      labelColor = "text-[#8e8b82]";
      typeLabel = "NOTE";
      break;
  }

  return (
    <aside
      aria-label={callout.title}
      className={`my-7 border-l-2 ${railColor} pl-5 py-2 space-y-1.5 font-sans bg-[#f5f0e8]/30 dark:bg-[#1f1e1b]/30 rounded-r-lg`}
    >
      <div className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] font-semibold ${labelColor}`}>
        <VaahanIcon name={iconName} size={13} aria-hidden="true" />
        <span>{typeLabel} &bull; {callout.title}</span>
      </div>
      <p className="text-sm sm:text-[15px] leading-relaxed text-[#3d3d3a] dark:text-[#a09d96]">
        {callout.text}
      </p>
    </aside>
  );
}
