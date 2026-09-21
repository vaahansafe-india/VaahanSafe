import * as React from "react";

interface StoryCoordinateProps {
  indexNumber: string; // e.g., "01"
  category: string;    // e.g., "QR & IDENTITY"
  date: string;        // e.g., "15 SEP 2026"
  readingTime: string; // e.g., "05 MIN"
  className?: string;
}

export function StoryCoordinate({
  indexNumber,
  category,
  date,
  readingTime,
  className = "",
}: StoryCoordinateProps) {
  return (
    <div
      className={`font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e8b82] dark:text-[#77736d] ${className}`}
      aria-label="Story editorial coordinates"
    >
      {/* Top Row: Index & Category */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
          {indexNumber}
        </span>
        <span className="font-semibold text-[#cc785c]">
          {category}
        </span>
      </div>

      {/* Center Registration Line with Node */}
      <div className="my-1.5 flex items-center gap-2">
        <div className="flex flex-col items-center">
          <span className="h-2 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#cc785c]" />
          <span className="h-2 w-px bg-[#e6dfd8] dark:bg-[#2e2b27]" />
        </div>
        <span className="h-px flex-1 bg-[#e6dfd8] dark:bg-[#2e2b27]" />
        <span className="text-[8px] tracking-[0.26em] text-[#8e8b82] dark:text-[#77736d]">
          VS JOURNAL
        </span>
      </div>

      {/* Bottom Row: Date & Reading Duration */}
      <div className="flex items-center justify-between text-[9px] text-[#6c6a64] dark:text-[#a09d96]">
        <span>{date}</span>
        <span>{readingTime}</span>
      </div>
    </div>
  );
}
