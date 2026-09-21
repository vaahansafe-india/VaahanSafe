export type IncidentState =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED";

export type IncidentImpact =
  | "NONE"
  | "MINOR"
  | "MAJOR"
  | "CRITICAL";

export interface IncidentUpdateEntity {
  id: string;
  incidentId: string;
  state: IncidentState;
  message: string;
  publishedAt: string;
  createdBy: string;
}

export interface IncidentEntity {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  summary: string;
  state: IncidentState;
  impact: IncidentImpact;
  startedAt: string;
  resolvedAt?: string | null;
  affectedServiceSlugs: string[];
  updates: IncidentUpdateEntity[];
  createdAt: string;
  updatedAt: string;
}
