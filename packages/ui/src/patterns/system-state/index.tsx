import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Button } from "../../components/button";

export type SystemStatusCode =
  | 400
  | 401
  | 403
  | 404
  | 408
  | 409
  | 429
  | 500
  | 502
  | 503
  | "400"
  | "401"
  | "403"
  | "404"
  | "408"
  | "409"
  | "429"
  | "500"
  | "502"
  | "503";

interface StatusInfo {
  title: string;
  description: string;
  icon: VaahanIconName;
}

const SYSTEM_STATUS_MAP: Record<string, StatusInfo> = {
  "400": {
    title: "Bad Request",
    description: "The requested syntax or payload could not be processed by the edge gateway.",
    icon: "alert",
  },
  "401": {
    title: "Authentication Required",
    description: "Please sign in to access this VaahanSafe service.",
    icon: "lock",
  },
  "403": {
    title: "Access Forbidden",
    description: "You do not have the required permissions for this resource.",
    icon: "shield",
  },
  "404": {
    title: "Page or QR Not Found",
    description: "The requested profile, page, or identifier could not be located.",
    icon: "alert",
  },
  "408": {
    title: "Request Timeout",
    description: "The request took too long to complete. Please verify your connection and try again.",
    icon: "refresh",
  },
  "409": {
    title: "State Conflict",
    description: "This action conflicts with current resource state (e.g. sticker already activated).",
    icon: "warning",
  },
  "429": {
    title: "Rate Limit Exceeded",
    description: "Too many requests. Please pause a moment before requesting again.",
    icon: "activity",
  },
  "500": {
    title: "System Error",
    description: "An unexpected error occurred. Our operations team has been alerted.",
    icon: "alert",
  },
  "502": {
    title: "Bad Gateway",
    description: "The upstream edge service received an invalid response.",
    icon: "server",
  },
  "503": {
    title: "Service Temporarily Unavailable",
    description: "VaahanSafe is currently undergoing scheduled maintenance or system upgrade.",
    icon: "maintenance",
  },
};

export interface SystemStateProps {
  code: SystemStatusCode;
  title?: string;
  description?: string;
  correlationId?: string;
  onRetry?: () => void;
  actionText?: string;
  actionHref?: string;
  className?: string;
}

export function SystemState({
  code,
  title,
  description,
  correlationId,
  onRetry,
  actionText = "Go Home",
  actionHref = "/",
  className = "",
}: SystemStateProps) {
  const codeKey = String(code);
  const info = SYSTEM_STATUS_MAP[codeKey] || {
    title: `Error ${codeKey}`,
    description: "An unexpected error occurred.",
    icon: "alert",
  };

  const finalTitle = title || info.title;
  const finalDesc = description || info.description;

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto min-h-[350px] ${className}`}
      role="alert"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-foreground mb-6 shadow-sm">
        <VaahanIcon name={info.icon} size={32} />
      </div>
      <span className="text-xs font-mono font-semibold tracking-wider text-muted-foreground uppercase mb-2">
        HTTP {codeKey}
      </span>
      <h1 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
        {finalTitle}
      </h1>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {finalDesc}
      </p>

      {correlationId && (
        <div className="mb-6 rounded-md bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground">
          Reference: <span className="font-semibold text-foreground">{correlationId}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <VaahanIcon name="refresh" size={16} className="mr-2" />
            Try Again
          </Button>
        )}
        <Button asChild>
          <a href={actionHref}>{actionText}</a>
        </Button>
      </div>
    </div>
  );
}
