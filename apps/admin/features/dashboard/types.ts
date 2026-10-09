export interface DashboardMetric {
  id: string;
  label: string;
  value: number | null;
  detail: string;
  subtext?: string;
  href: string;
  status?: "normal" | "warning" | "critical";
}

export type AttentionSeverity = "critical" | "high" | "medium" | "info";

export interface DashboardAttentionItem {
  id: string;
  title: string;
  description: string;
  severity: AttentionSeverity;
  count?: number;
  actionLabel: string;
  actionHref: string;
}

export interface DashboardQueueItem {
  id: string;
  type: "Payment" | "Order" | "Support" | "Replacement" | "Incident";
  reference: string;
  rawReference: string;
  state: string;
  context: string;
  amountFormatted?: string | null;
  age: string;
  timestamp: string;
  actionLabel: string;
  actionHref: string;
}

export interface DashboardPulseBucket {
  hourLabel: string;
  scans: number;
  activations: number;
  orders: number;
  failures: number;
}

export interface DashboardPulse {
  buckets: DashboardPulseBucket[];
  totalScans24h: number;
  totalActivations24h: number;
  totalOrders24h: number;
  totalFailures24h: number;
  hasData: boolean;
}

export interface DashboardServiceItem {
  name: string;
  status: "healthy" | "degraded" | "unavailable" | "configured" | "unconfigured";
  latencyMs?: number | null;
  detail?: string;
  actionHref?: string;
  actionLabel?: string;
}

export interface DashboardAuditItem {
  id: string;
  action: string;
  summary: string;
  actor: string;
  resourceType: string;
  resourceId: string;
  age: string;
  timestamp: string;
}

export interface AdminDashboardSummary {
  generatedAt: string;
  formattedSyncTime: string;
  formattedSyncDate: string;
  greeting: string;
  operatorFirstName: string;
  operatorRole: string;
  systemStatus: "operational" | "degraded" | "attention";
  metrics: DashboardMetric[];
  attentionItems: DashboardAttentionItem[];
  queueItems: DashboardQueueItem[];
  pulse: DashboardPulse;
  services: DashboardServiceItem[];
  recentAudit: DashboardAuditItem[];
}
