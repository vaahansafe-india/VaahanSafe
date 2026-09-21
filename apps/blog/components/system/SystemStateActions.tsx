import * as React from "react";
import Link from "next/link";
import { Button } from "@vaahansafe/ui";

interface ActionItem {
  label: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

interface SystemStateActionsProps {
  primary?: ActionItem;
  secondary?: ActionItem;
  className?: string;
}

export function SystemStateActions({
  primary,
  secondary,
  className = "",
}: SystemStateActionsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      {primary && (
        primary.href ? (
          primary.external ? (
            <Button
              asChild
              className="h-11 rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] dark:hover:bg-[#e6dfd8] transition-colors"
            >
              <a href={primary.href} target="_blank" rel="noopener noreferrer">
                {primary.label}
              </a>
            </Button>
          ) : (
            <Button
              asChild
              className="h-11 rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] dark:hover:bg-[#e6dfd8] transition-colors"
            >
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
          )
        ) : (
          <Button
            type="button"
            onClick={primary.onClick}
            className="h-11 rounded-full bg-[#141413] px-6 font-sans text-xs font-medium text-[#faf9f5] hover:bg-[#3d3d3a] dark:bg-[#faf9f5] dark:text-[#141413] dark:hover:bg-[#e6dfd8] transition-colors"
          >
            {primary.label}
          </Button>
        )
      )}

      {secondary && (
        secondary.href ? (
          secondary.external ? (
            <a
              href={secondary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center px-4 font-mono text-xs uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] dark:text-[#a09d96] dark:hover:text-[#cc785c] transition-colors"
            >
              {secondary.label}
            </a>
          ) : (
            <Link
              href={secondary.href}
              className="inline-flex h-11 items-center px-4 font-mono text-xs uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] dark:text-[#a09d96] dark:hover:text-[#cc785c] transition-colors"
            >
              {secondary.label}
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={secondary.onClick}
            className="inline-flex h-11 items-center px-4 font-mono text-xs uppercase tracking-wider text-[#6c6a64] hover:text-[#cc785c] dark:text-[#a09d96] dark:hover:text-[#cc785c] transition-colors"
          >
            {secondary.label}
          </button>
        )
      )}
    </div>
  );
}
