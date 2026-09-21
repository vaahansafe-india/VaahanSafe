export type ServiceState =
  | "OPERATIONAL"
  | "DEGRADED"
  | "PARTIAL OUTAGE"
  | "MAJOR OUTAGE"
  | "MAINTENANCE"
  | "UNKNOWN";

export interface ServiceStateMeta {
  state: ServiceState;
  label: string;
  dotColor: string;
  badgeBg: string;
  textColor: string;
  description: string;
}

export const SERVICE_STATE_CONFIG: Record<ServiceState, ServiceStateMeta> = {
  OPERATIONAL: {
    state: "OPERATIONAL",
    label: "Operational",
    dotColor: "#5db872",
    badgeBg: "rgba(93, 184, 114, 0.12)",
    textColor: "#2e7d43",
    description: "Operating normally within expected performance parameters.",
  },
  DEGRADED: {
    state: "DEGRADED",
    label: "Degraded",
    dotColor: "#d4a017",
    badgeBg: "rgba(212, 160, 23, 0.15)",
    textColor: "#996b00",
    description: "Service is accessible, but some requests may experience elevated latency or delays.",
  },
  "PARTIAL OUTAGE": {
    state: "PARTIAL OUTAGE",
    label: "Partial Outage",
    dotColor: "#c64545",
    badgeBg: "rgba(198, 69, 69, 0.12)",
    textColor: "#a83232",
    description: "Certain public capabilities are temporarily disrupted while others remain operational.",
  },
  "MAJOR OUTAGE": {
    state: "MAJOR OUTAGE",
    label: "Major Outage",
    dotColor: "#c64545",
    badgeBg: "rgba(198, 69, 69, 0.16)",
    textColor: "#8c1f1f",
    description: "Critical public capability is currently unavailable.",
  },
  MAINTENANCE: {
    state: "MAINTENANCE",
    label: "Maintenance",
    dotColor: "#5db8a6",
    badgeBg: "rgba(93, 184, 166, 0.14)",
    textColor: "#2b7c6e",
    description: "Scheduled maintenance or infrastructure upgrade is currently underway.",
  },
  UNKNOWN: {
    state: "UNKNOWN",
    label: "Condition Unknown",
    dotColor: "#8e8b82",
    badgeBg: "rgba(142, 139, 130, 0.14)",
    textColor: "#5e5b54",
    description: "Current service condition could not be authoritatively confirmed.",
  },
};
