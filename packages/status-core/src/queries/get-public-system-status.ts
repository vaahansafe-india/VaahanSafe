import { StatusRepository } from "../repositories/status.repository";
import { deriveOverallStatus, formatIstTimestamp } from "../services/aggregate-status";
import type { PublicSystemStatusDto } from "../dto/public-status";
import type { DatabaseClient } from "@vaahansafe/database";

export async function getPublicSystemStatus(db?: DatabaseClient): Promise<PublicSystemStatusDto> {
  const repo = new StatusRepository(db);

  const [services, activeIncidents, activeMaintenance] = await Promise.all([
    repo.getPublicServices(),
    repo.getActiveIncidents(),
    repo.getUpcomingMaintenance(),
  ]);

  const now = new Date();
  const overall = deriveOverallStatus(services, false);

  return {
    overallState: overall.overallState,
    headline: overall.headline,
    description: overall.description,
    generatedAt: now.toISOString(),
    generatedAtFormatted: formatIstTimestamp(now),
    isStale: false,
    services,
    activeIncidents,
    activeMaintenance,
    historySummary: {
      recordedDays: 30,
      resolvedIncidentCount30D: 0,
    },
  };
}
