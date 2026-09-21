import * as React from "react";
import { VaahanIcon, type VaahanIconName } from "@vaahansafe/icons";
import { Badge } from "../../components/badge";

export type ConnectionState =
  | "online"
  | "offline"
  | "checking"
  | "degraded"
  | "reconnected"
  | "maintenance";

interface StateMeta {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  icon: VaahanIconName;
}

const STATE_CONFIG: Record<ConnectionState, StateMeta> = {
  online: { label: "Systems Operational", variant: "success", icon: "online" },
  offline: { label: "Network Offline", variant: "destructive", icon: "offline" },
  checking: { label: "Checking Connection...", variant: "secondary", icon: "loading" },
  degraded: { label: "Performance Degraded", variant: "warning", icon: "warning" },
  reconnected: { label: "Connection Restored", variant: "success", icon: "online" },
  maintenance: { label: "Scheduled Maintenance", variant: "info", icon: "maintenance" },
};

export interface ConnectionStatusProps {
  status?: ConnectionState;
  showIcon?: boolean;
  className?: string;
}

export function ConnectionStatus({
  status = "online",
  showIcon = true,
  className = "",
}: ConnectionStatusProps) {
  const meta = STATE_CONFIG[status] || STATE_CONFIG.online;

  return (
    <Badge variant={meta.variant} className={`inline-flex items-center gap-1.5 font-medium ${className}`}>
      {showIcon && <VaahanIcon name={meta.icon} size={13} className={status === "checking" ? "animate-spin" : ""} />}
      <span>{meta.label}</span>
    </Badge>
  );
}
