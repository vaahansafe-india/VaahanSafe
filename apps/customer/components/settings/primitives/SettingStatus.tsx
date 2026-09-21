import * as React from "react";

export type StatusVariant =
  | "VERIFIED"
  | "CONNECTED"
  | "ENABLED"
  | "DISABLED"
  | "PRIVATE"
  | "PUBLIC"
  | "CURRENT"
  | "REQUIRED"
  | "ACTIVE";

interface SettingStatusProps {
  status: StatusVariant;
  className?: string;
}

export function SettingStatus({ status, className = "" }: SettingStatusProps) {
  const styles: Record<StatusVariant, string> = {
    VERIFIED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    CONNECTED: "bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/25",
    ENABLED: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    DISABLED: "bg-muted text-muted-foreground border-border",
    PRIVATE: "bg-muted text-muted-foreground border-border",
    PUBLIC: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    CURRENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    REQUIRED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    ACTIVE: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-wider uppercase ${styles[status]} ${className}`}
    >
      {status === "CURRENT" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {status}
    </span>
  );
}
