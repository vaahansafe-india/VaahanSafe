import {
  getStatusDatabaseClient,
  StatusRepository,
} from "@vaahansafe/status-core/server";

export async function getDiscoveryIncidents() {
  const db = getStatusDatabaseClient();
  if (!db) throw new Error("Status discovery source is unavailable");
  return new StatusRepository(db).getIncidentHistory(500);
}
