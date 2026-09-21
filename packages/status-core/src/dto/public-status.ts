import type { JourneyStage } from "../domain/journey";
import type { ServiceState } from "../domain/service-state";
import type { IncidentState, IncidentImpact } from "../domain/incident";
import type { MaintenanceState } from "../domain/maintenance";

export interface PublicStatusServiceDto {
  publicId: string;
  slug: string;
  name: string;
  description: string;
  journeyStage: JourneyStage;
  state: ServiceState;
  displayOrder: number;
  latencyMs?: number;
  lastProbeAt?: string;
  targetUrl?: string;
  probeStatus?: string;
}

export interface PublicIncidentUpdateDto {
  state: IncidentState;
  message: string;
  publishedAt: string;
  publishedAtFormatted: string;
}

export interface PublicIncidentDto {
  publicId: string;
  slug: string;
  title: string;
  summary: string;
  state: IncidentState;
  impact: IncidentImpact;
  startedAt: string;
  startedAtFormatted: string;
  resolvedAt?: string | null;
  resolvedAtFormatted?: string | null;
  durationMinutes?: number | null;
  affectedServiceSlugs: string[];
  updates: PublicIncidentUpdateDto[];
}

export interface PublicMaintenanceDto {
  publicId: string;
  slug: string;
  title: string;
  description: string;
  scheduledStart: string;
  scheduledStartFormatted: string;
  scheduledEnd: string;
  scheduledEndFormatted: string;
  state: MaintenanceState;
  affectedServiceSlugs: string[];
}

export interface PublicServiceHistoryDay {
  date: string; // YYYY-MM-DD
  state: ServiceState;
  hasIncident: boolean;
  incidentTitle?: string;
  incidentDurationMinutes?: number;
}

export interface PublicServiceHistoryDto {
  serviceSlug: string;
  recordedDaysCount: number;
  startDate: string;
  endDate: string;
  days: PublicServiceHistoryDay[];
}

export interface PublicSystemStatusDto {
  overallState: ServiceState;
  headline: string;
  description: string;
  generatedAt: string;
  generatedAtFormatted: string;
  isStale: boolean;
  services: PublicStatusServiceDto[];
  activeIncidents: PublicIncidentDto[];
  activeMaintenance: PublicMaintenanceDto[];
  historySummary: {
    recordedDays: number;
    resolvedIncidentCount30D: number;
  };
}
