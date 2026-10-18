export const RISK_SEVERITIES = [
  "INFORMATIONAL",
  "REVIEW",
  "HIGH_ATTENTION",
  "CRITICAL_SECURITY",
] as const;
export const RISK_STATUSES = [
  "UNREVIEWED",
  "INVESTIGATING",
  "MONITORING",
  "RESOLVED",
  "DISMISSED",
] as const;
export const RISK_CATEGORIES = [
  "ACTIVATION",
  "SCAN",
  "REPLACEMENT",
  "LIFECYCLE",
] as const;
export const RISK_OUTCOMES = [
  "EXPECTED_ACTIVITY",
  "FALSE_POSITIVE",
  "CUSTOMER_VERIFIED",
  "MONITORING_REQUIRED",
  "DUPLICATE_SIGNAL",
  "OTHER_REVIEWED_OUTCOME",
] as const;
export interface RiskFilters {
  q: string;
  severity: string;
  category: string;
  status: string;
  from: string;
  to: string;
  lifecycle: string;
  assignment: string;
  hasCase: string;
  scope: string;
  period: string;
}
export const EMPTY_RISK_FILTERS: RiskFilters = {
  q: "",
  severity: "",
  category: "",
  status: "",
  from: "",
  to: "",
  lifecycle: "",
  assignment: "",
  hasCase: "",
  scope: "",
  period: "",
};
export interface RiskSignal {
  id: string;
  reference_code: string;
  title: string;
  category: string;
  severity: string;
  review_status: string;
  rule_key: string;
  rule_version: number;
  observed_at: string;
  first_observed_at: string;
  event_count: number;
  evidence_summary: string;
  revision: number;
  qr_id: string | null;
  visible_code: string | null;
  qr_status: string | null;
  vehicle_id: string | null;
  vehicle_label: string | null;
  registration_masked: string | null;
  customer_reference: string | null;
  case_id: string | null;
  case_reference: string | null;
  case_status: string | null;
  assigned_name: string | null;
}
export interface RiskCase {
  id: string;
  reference_code: string;
  title: string;
  priority: string;
  status: string;
  assigned_name: string | null;
  opened_at: string;
  updated_at: string;
  revision: number;
  signal_count: number;
  resolution: string | null;
  resolution_reason: string | null;
}
export interface RiskPage<T> {
  rows: T[];
  nextCursor: string | null;
}
export interface RiskSummary {
  unreviewed: number;
  high: number;
  investigating: number;
  monitoring: number;
  resolvedToday: number;
}
export interface RiskEvent {
  id: string;
  source: string;
  title: string;
  description: string;
  occurred_at: string;
  relation: string;
  reference: string | null;
  href?: string | null;
}
export interface RiskDetail {
  signal: RiskSignal;
  case: RiskCase | null;
  events: RiskEvent[];
  related: RiskSignal[];
  audit: {
    action: string;
    reason: string;
    actor: string;
    occurred_at: string;
  }[];
  evidenceTruncated: boolean;
  contextTruncated: boolean;
  resolution: string | null;
  resolutionReason: string | null;
}
export interface RiskCaseDetail {
  record: RiskCase;
  signals: RiskSignal[];
  events: RiskEvent[];
  audit: RiskDetail["audit"];
  truncated: boolean;
}
export interface RiskPattern {
  category: string;
  severity: string;
  lifecycle: string | null;
  total: number;
  unreviewed: number;
  dismissed: number;
}
export interface RiskPulse {
  from: string;
  to: string;
  events: Pick<
    RiskSignal,
    "id" | "reference_code" | "title" | "severity" | "observed_at"
  >[];
  truncated: boolean;
}
export const riskLabel = (v: string | null | undefined) =>
  (v || "Not recorded")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
