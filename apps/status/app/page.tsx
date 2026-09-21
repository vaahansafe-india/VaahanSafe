import * as React from "react";
import { getPublicSystemStatus } from "@vaahansafe/status-core";
import { StatusDashboard } from "../components/status/StatusDashboard";

export const revalidate = 30; // ISR cache at edge for 30s

export default async function StatusPage() {
  const initialStatus = await getPublicSystemStatus();

  return <StatusDashboard initialStatus={initialStatus} />;
}
